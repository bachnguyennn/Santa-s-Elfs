import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Email palette: the Workshop's buttercream paper, oxblood headings and buttons, ink body text.
 * Inline styles only (mail clients ignore stylesheets) and no images, so the email reads the same
 * with images off. Contrast: ink on buttercream 15:1, ink-soft 9:1, oxblood 14:1, cherry 7:1;
 * buttercream on oxblood 14:1.
 */
export const palette = {
  oxblood: "#430c15",
  buttercream: "#fff0cc",
  parchment: "#f5e8cc",
  persimmon: "#c45a39",
  cherry: "#962e40",
  ink: "#301c22",
  inkSoft: "#5a3e40",
  line: "#cbb690",
};

const font = "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', Verdana, Arial, sans-serif";
const display = "'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";

/** Shared Workshop frame. Every email has a preview line, a heading, and the "private key" footer. */
export function Layout({ preview, heading, children, privateLink = true }: { preview: string; heading: string; children: ReactNode; privateLink?: boolean }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: palette.parchment, margin: 0, padding: "24px 0", fontFamily: font, color: palette.ink }}>
        <Container
          style={{ maxWidth: 560, margin: "0 auto", backgroundColor: palette.buttercream, border: `1px solid ${palette.line}`, borderRadius: 8, overflow: "hidden" }}
        >
          <Section style={{ backgroundColor: palette.oxblood, padding: "16px 28px", borderBottom: `4px solid ${palette.persimmon}` }}>
            <Text style={{ margin: 0, color: palette.buttercream, fontFamily: display, fontSize: 22, lineHeight: "26px", fontWeight: 700, letterSpacing: 0.5 }}>
              SantaElf
            </Text>
          </Section>
          <Section style={{ padding: "28px 28px 8px" }}>
            <Heading as="h1" style={{ margin: "0 0 16px", fontFamily: display, fontSize: 30, lineHeight: "34px", fontWeight: 700, color: palette.oxblood }}>
              {heading}
            </Heading>
            {children}
          </Section>
          <Hr style={{ border: "none", borderTop: `1px dashed ${palette.line}`, margin: "16px 28px" }} />
          <Section style={{ padding: "0 28px 24px" }}>
            {privateLink && (
              <Text style={{ margin: "0 0 8px", fontSize: 14, lineHeight: "20px", color: palette.cherry, fontWeight: 700 }}>
                This link opens your private page. Please don&apos;t forward this email.
              </Text>
            )}
            <Text style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: palette.inkSoft }}>
              Sent by SantaElf. You don’t need an account to take part. Replies to this email are not monitored.
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
        style={{
          backgroundColor: palette.oxblood,
          color: palette.buttercream,
          borderRadius: 999,
          padding: "14px 26px",
          fontSize: 16,
          fontWeight: 700,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children}
      </Button>
      <Text style={{ margin: "12px 0 0", fontSize: 13, lineHeight: "19px", color: palette.inkSoft, wordBreak: "break-all" }}>
        Or paste this link into your browser: {href}
      </Text>
    </Section>
  );
}
