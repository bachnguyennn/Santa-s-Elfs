"use client";
import type { ApiError, ErrorCode } from "./contracts";

export class ApiRequestError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields: Record<string, string> = {},
    readonly status = 0,
  ) {
    super(message);
  }
}

/** Typed JSON fetch for SantaElf API routes. Throws ApiRequestError with server-provided, user-safe messages. */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError("INTERNAL", "We couldn't reach SantaElf. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    throw new ApiRequestError(err?.code ?? "INTERNAL", err?.message ?? "Something went wrong. Please try again.", err?.fields, res.status);
  }
  return data as T;
}
