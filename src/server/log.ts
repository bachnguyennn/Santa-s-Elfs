/**
 * Minimal structured logger. Only pass non-sensitive fields: never tokens,
 * emails, names, message bodies, or assignment data.
 */
export function logError(event: string, err: unknown, fields: Record<string, string | number | boolean> = {}) {
  const e = err as { name?: string; code?: string } | undefined;
  console.error(JSON.stringify({ level: "error", event, errName: e?.name ?? "unknown", errCode: e?.code, ...fields }));
}

export function logInfo(event: string, fields: Record<string, string | number | boolean> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...fields }));
}
