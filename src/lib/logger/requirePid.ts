export function requirePid(sp: { pid?: string } | undefined): string {
  const pid = sp?.pid?.trim();
  if (!pid) throw new Error("Missing pid. Start from /start.");
  return pid;
}
