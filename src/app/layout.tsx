import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";

// OWNER: design agent may change the font pairing (keep the CSS variable names).
const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });
const body = Nunito_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SantaElf — free Secret Santa for small groups", template: "%s · SantaElf" },
  description: "Draw names, share wishlists, and chat anonymously with your Secret Santa. Free, no accounts.",
};

export const viewport: Viewport = { themeColor: "#123828" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
