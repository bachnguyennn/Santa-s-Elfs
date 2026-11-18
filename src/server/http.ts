import "server-only";
import { ZodError, type ZodType } from "zod";
import { getDb, type Db } from "./db";
import { AppError, mapDbError } from "./errors";
import { logError } from "./log";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

function errorResponse(err: unknown): Response {
  const mapped = mapDbError(err);
  if (mapped instanceof AppError) {
    return Response.json({ error: { code: mapped.code, message: mapped.message } } satisfies ApiErrorBody, {
      status: mapped.status,
    });
  }
  if (mapped instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of mapped.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    return Response.json(
      { error: { code: "VALIDATION", message: "Please check the highlighted fields.", fields } } satisfies ApiErrorBody,
      { status: 400 },
    );
  }
  logError("api.unhandled", mapped);
  return Response.json({ error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } }, {
    status: 500,
  });
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite=Lax cookies). */
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null; // "null" (sandboxed/opaque origins) fails to parse
  } catch {}
  if (!originHost || !host || originHost !== host) {
    throw new AppError("FORBIDDEN", "Cross-site request blocked.");
  }
}

/**
 * Wrap a route handler: same-origin check for mutations, DB injection,
 * consistent JSON errors, and no leaking of internals.
 * Return a plain value to send it as JSON (200), or a Response for full control.
 */
export function api<P = Record<string, string>>(
  fn: (ctx: { req: Request; db: Db; params: P }) => Promise<unknown>,
) {
  return async (req: Request, routeCtx: { params: Promise<P> }) => {
    try {
      assertSameOrigin(req);
      const db = await getDb();
      const params = await routeCtx.params;
      const result = await fn({ req, db, params });
      if (result instanceof Response) return result;
      return Response.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parse a JSON body with a zod schema (throws ZodError / AppError). */
export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("VALIDATION", "Expected a JSON request body.");
  }
  return schema.parse(body);
}
