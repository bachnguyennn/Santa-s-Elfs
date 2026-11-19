import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Barlow_Condensed, Shantell_Sans } from "next/font/google";
import { DoorstepMemory } from "@/components/village/doorstep-memory";
import { RoomEntrance } from "@/components/workshop/room-entrance";
import "./globals.css";

// Font choices: design/workshop-moodboard/SPEC.md and DESIGN.md (Typography).
// Display: Barlow Condensed 700 for short titles and signs. Body: Atkinson Hyperlegible Next, built for
// low-vision legibility. Hand: Shantell Sans, only for the invitation and the revealed name.
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700"] });
const body = Atkinson_Hyperlegible_Next({ variable: "--font-body", subsets: ["latin"], adjustFontFallback: false });
const hand = Shantell_Sans({ variable: "--font-hand", subsets: ["latin"], weight: ["600"] });

export const metadata: Metadata = {
  title: { default: "SantaElf: free Secret Santa for small groups", template: "%s · SantaElf" },
  description:
    "Draw names, share wishlists and chat anonymously with your Secret Santa. Free, no accounts, groups of 3 to 20.",
};

export const viewport: Viewport = { themeColor: "#430C15" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <DoorstepMemory />
        <RoomEntrance />
      </body>
    </html>
  );
}
