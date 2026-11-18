import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque, Shantell_Sans } from "next/font/google";
import "./globals.css";

// OWNER: design agent. Pairing rationale lives in DESIGN.md (Typography).
// Display: warm, chunky grotesque with optical sizes. Body: built for low-vision legibility
// (many once-a-year, non-technical users on phones). Hand: names on paper slips and aliases.
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], axes: ["opsz"] });
const body = Atkinson_Hyperlegible_Next({ variable: "--font-body", subsets: ["latin"] });
const hand = Shantell_Sans({ variable: "--font-hand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SantaElf — free Secret Santa for small groups", template: "%s · SantaElf" },
  description:
    "Draw names, share wishlists and chat anonymously with your Secret Santa. Free, no accounts, groups of 3 to 20.",
};

export const viewport: Viewport = { themeColor: "#103826" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
