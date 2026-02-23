export function requireRid(sp?: { rid?: string } | null): string {
  const rid = sp?.rid;
  if (!rid) throw new Error("Missing rid");
  return rid;
}
