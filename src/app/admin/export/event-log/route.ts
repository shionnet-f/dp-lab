import { prisma } from "@/lib/db";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const escaped = s.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function GET() {
  const rows = await prisma.eventLog.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      ts: true,
      page: true,
      type: true,
      meta: true,
      payload: true,
    },
  });

  const header = [
    "id",
    "createdAt",
    "ts",
    "page",
    "type",

    "participantId",
    "trialRunId",
    "phase",
    "taskSetId",
    "taskVersion",
    "trialId",
    "strategy",
    "flowId",
    "variant",

    "payload",
  ];

  const lines = [header.join(",")];

  for (const r of rows) {
    const trial = (r.meta as any)?.trial ?? {};

    lines.push(
      [
        r.id,
        r.createdAt.toISOString(),
        r.ts,
        r.page,
        r.type,

        trial.participantId,
        trial.trialRunId,
        trial.phase,
        trial.taskSetId,
        trial.taskVersion,
        trial.trialId,
        trial.strategy,
        trial.flowId,
        trial.variant,

        JSON.stringify(r.payload ?? {}),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const csv = "\uFEFF" + lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="event_log.csv"',
    },
  });
}
