export function requirePid(sp?: { pid?: string } | null): string {
  const pid = sp?.pid;
  if (!pid) throw new Error("Missing pid");
  return pid;
}
