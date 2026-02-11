"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type LogEventInput = {
    ts: number;
    page: string;
    type: string;
    meta?: Prisma.InputJsonValue;
    payload?: Prisma.InputJsonValue;
};

export async function logEvent(input: LogEventInput) {
    await prisma.eventLog.create({
        data: {
            ts: input.ts,
            page: input.page,
            type: input.type,
            meta: input.meta ?? Prisma.JsonNull,
            payload: input.payload ?? Prisma.JsonNull,
        },
    });
}
