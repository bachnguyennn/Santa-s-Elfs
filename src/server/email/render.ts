import { render } from "@react-email/render";
import type { EmailContent } from "./templates/emails";

/** Keep headings in normal case in the plain-text version. */
const TEXT_OPTIONS = { selectors: [{ selector: "h1", options: { uppercase: false } }] };

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Render a template to HTML + plain text. Control characters are stripped from the subject (header safety). */
export async function renderEmail(content: EmailContent): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(content.element), render(content.element, { plainText: true, htmlToTextOptions: TEXT_OPTIONS })]);
  const subject = content.subject.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 200);
  return { subject, html, text };
}
