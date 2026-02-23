export function requireRid(sp: { rid?: string } | undefined): string {
  const rid = sp?.rid?.trim();
  if (!rid) throw new Error("Missing rid (trialRunId). Start from product with ensureTrialStart.");
  return rid;
}
