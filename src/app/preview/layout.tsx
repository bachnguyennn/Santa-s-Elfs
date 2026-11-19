import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Design previews for the village redesign (REDESIGN_BRIEF.md §1), with fictional data only.
 * Development only: 404 in production builds unless ENABLE_PREVIEWS=true.
 */
export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PREVIEWS !== "true") notFound();
  return children;
}
