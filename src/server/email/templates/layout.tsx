import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/** Email palette (inline styles only — mail clients ignore stylesheets). */
export const palette = {
  green: "#174a34",
  greenDark: "#123828",
  cream: "#fdfaf3",
  creamDeep: "#f8f1e3",
  red: "#a83434",
  gold: "#c79a3b",
  ink: "#1f1a14",
  inkSoft: "#4a4136",
  line: "#e3d7bf",
};

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Shared festive frame. Every email has a preview line, a heading, and the "private key" footer. */
export function Layout({ preview, heading, children, privateLink = true }: { preview: string; heading: string; children: ReactNode; privateLink?: boolean }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: palette.creamDeep, margin: 0, padding: "24px 0", fontFamily: font, color: palette.ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: palette.cream, border: `1px solid ${palette.line}`, borderRadius: 16, overflow: "hidden" }}>
          <Section style={{ backgroundColor: palette.green, padding: "18px 28px", borderBottom: `4px solid ${palette.gold}` }}>
            <Text style={{ margin: 0, color: palette.cream, fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>🎄 SantaElf</Text>
          </Section>
          <Section style={{ padding: "28px 28px 8px" }}>
            <Heading as="h1" style={{ margin: "0 0 16px", fontSize: 24, lineHeight: "32px", color: palette.greenDark }}>
              {heading}
            </Heading>
            {children}
          </Section>
          <Hr style={{ borderColor: palette.line, margin: "16px 28px" }} />
          <Section style={{ padding: "0 28px 24px" }}>
            {privateLink && (
              <Text style={{ margin: "0 0 8px", fontSize: 13, lineHeight: "20px", color: palette.red, fontWeight: 600 }}>
                This button is your private key — please don&apos;t forward this email.
              </Text>
            )}
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: palette.inkSoft }}>
              Sent by SantaElf, the accountless Secret Santa helper. Replies to this email are not monitored.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "0 0 14px", fontSize: 16, lineHeight: "24px", color: palette.ink }}>{children}</Text>;
}

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 20px" }}>
      <Button
        href={href}
        style={{ backgroundColor: palette.red, color: palette.cream, borderRadius: 999, padding: "14px 26px", fontSize: 16, fontWeight: 700, textDecoration: "none", display: "inline-block" }}
      >
        {children}
      </Button>
      <Text style={{ margin: "12px 0 0", fontSize: 12, lineHeight: "18px", color: palette.inkSoft, wordBreak: "break-all" }}>
        Or paste this link into your browser: {href}
      </Text>
    </Section>
  );
}
