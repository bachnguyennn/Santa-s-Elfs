"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ApiRequestError } from "@/lib/api-client";

/**
 * Runs one organizer mutation at a time: tracks which control is busy, keeps a user-safe error,
 * and refreshes the server-rendered page afterwards so every count stays true.
 */
export function useAction(friendly?: (err: ApiRequestError) => string | undefined) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(key);
    setError(null);
    try {
      const result = await fn();
      router.refresh();
      return result;
    } catch (err) {
      const e = err instanceof ApiRequestError ? err : new ApiRequestError("INTERNAL", "Something went wrong. Please try again.");
      setError(friendly?.(e) ?? e.message);
      if (e.code === "GROUP_LOCKED" || e.code === "GROUP_FULL") router.refresh();
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  return { busy, error, setError, run };
}
