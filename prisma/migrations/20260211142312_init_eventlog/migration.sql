-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ts" INTEGER NOT NULL,
    "page" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "payload" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "TrialSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL,
    "isInappropriate" BOOLEAN NOT NULL,
    "confirmedImportantInfo" BOOLEAN NOT NULL,
    "totalTimeMs" INTEGER NOT NULL,
    "extras" JSONB
);

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE INDEX "EventLog_type_idx" ON "EventLog"("type");

-- CreateIndex
CREATE INDEX "EventLog_page_idx" ON "EventLog"("page");

-- CreateIndex
CREATE INDEX "TrialSummary_createdAt_idx" ON "TrialSummary"("createdAt");
