import { prisma } from "@/lib/db";

type AnyJson = Record<string, unknown> | null;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const s = String(value);
  const escaped = s.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

export async function GET() {
  const rows = await prisma.trialSummary.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      meta: true,
      isInappropriate: true,
      confirmedImportantInfo: true,
      totalTimeMs: true,
      extras: true,
    },
  });

  const header = [
    "id",
    "createdAt",
    "participantId",
    "trialRunId",
    "phase",
    "taskSetId",
    "taskVersion",
    "trialId",
    "orderInSession",
    "strategy",
    "flowId",
    "variant",
    "confirmedImportantInfo",
    "isInappropriate",
    "totalTimeMs",
    "productId",
    "shippingId",
    "addonGiftWrap",
    "totalYen",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    const meta = (row.meta ?? {}) as AnyJson;
    const extras = (row.extras ?? {}) as AnyJson;

    lines.push(
      [
        row.id,
        row.createdAt.toISOString(),
        meta?.participantId,
        meta?.trialRunId,
        meta?.phase,
        meta?.taskSetId,
        meta?.taskVersion,
        meta?.trialId,
        meta?.orderInSession,
        meta?.strategy,
        meta?.flowId,
        meta?.variant,
        row.confirmedImportantInfo,
        row.isInappropriate,
        row.totalTimeMs,
        extras?.productId,
        extras?.shippingId,
        extras?.addonGiftWrap,
        extras?.totalYen,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const bom = "\uFEFF";
  const csv = bom + lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trial_summary.csv"',
      "Cache-Control": "no-store",
    },
  });
}
