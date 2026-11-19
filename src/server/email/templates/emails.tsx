import type { ReactElement } from "react";
import { CtaButton, Layout, P } from "./layout";

/**
 * Email templates. Each returns a subject and a React Email element.
 * User content (group names, requester names) is rendered as React text, so it is escaped.
 * Privacy: assignment and message emails never include another participant's name.
 */
export interface EmailContent {
  subject: string;
  element: ReactElement;
}

export function organizerWelcome(p: { groupName: string; link: string }): EmailContent {
  return {
    subject: `Your Secret Santa group "${p.groupName}" is ready`,
    element: (
      <Layout preview="Your organizer dashboard link is inside." heading="Your group is ready">
        <P>
          You&apos;ve created <strong>{p.groupName}</strong>. Open your organizer dashboard to share the invite link,
          approve requests and draw names.
        </P>
        <CtaButton href={p.link}>Open organizer dashboard</CtaButton>
        <P>Keep this link private: anyone who has it can manage your group.</P>
      </Layout>
    ),
  };
}

export function organizerRecovery(p: { groupName: string; link: string }): EmailContent {
  return {
    subject: `Your organizer link for "${p.groupName}"`,
    element: (
      <Layout preview="Here's a fresh link to your organizer dashboard." heading="Here's your organizer link">
        <P>
          Someone asked for the organizer link for <strong>{p.groupName}</strong>. If that wasn&apos;t you, you can ignore this email.
        </P>
        <CtaButton href={p.link}>Open organizer dashboard</CtaButton>
        <P>Keep this link private: anyone who has it can manage your group.</P>
      </Layout>
    ),
  };
}

export function participantWelcome(p: { groupName: string; link: string; pending: boolean }): EmailContent {
  if (p.pending) {
    return {
      subject: `Your request to join "${p.groupName}" was received`,
      element: (
        <Layout preview="Your request is waiting for organizer approval." heading="Request received">
          <P>
            Your request to join <strong>{p.groupName}</strong> is waiting for the organizer&apos;s approval. We&apos;ll email you when
            they approve it. You can fill in your wishlist on your private page while you wait.
          </P>
          <CtaButton href={p.link}>Open my Secret Santa page</CtaButton>
        </Layout>
      ),
    };
  }
  return {
    subject: `You've joined "${p.groupName}"`,
    element: (
      <Layout preview="Your private Secret Santa page is ready." heading="You're in!">
        <P>
          Welcome to <strong>{p.groupName}</strong>. Add your wishlist on your private page. Once names are drawn, you&apos;ll open your Secret
          Santa assignment there too.
        </P>
        <CtaButton href={p.link}>Open my Secret Santa page</CtaButton>
      </Layout>
    ),
  };
}

export function participantRecovery(p: { groupName: string; link: string }): EmailContent {
  return {
    subject: `Your private link for "${p.groupName}"`,
    element: (
      <Layout preview="Here's a fresh link to your Secret Santa page." heading="Here's your private link">
        <P>
          Someone asked for your private link for <strong>{p.groupName}</strong>. If that wasn&apos;t you, you can ignore this email.
        </P>
        <CtaButton href={p.link}>Open my Secret Santa page</CtaButton>
      </Layout>
    ),
  };
}

export function joinRequestReceived(p: { groupName: string; requesterName: string; link: string }): EmailContent {
  return {
    subject: `New request to join "${p.groupName}"`,
    element: (
      <Layout preview="Someone would like to join your exchange." heading="Someone wants to join">
        <P>
          <strong>{p.requesterName}</strong> asked to join <strong>{p.groupName}</strong>. Open your dashboard to approve or decline.
        </P>
        <CtaButton href={p.link}>Review request</CtaButton>
      </Layout>
    ),
  };
}

export function joinApproved(p: { groupName: string; link: string }): EmailContent {
  return {
    subject: `You're in! Your request to join "${p.groupName}" was approved`,
    element: (
      <Layout preview="The organizer approved your request." heading="You're approved!">
        <P>
          The organizer approved your request to join <strong>{p.groupName}</strong>. Add your wishlist to give your Secret Santa
          some gift ideas.
        </P>
        <CtaButton href={p.link}>Open my Secret Santa page</CtaButton>
      </Layout>
    ),
  };
}

export function joinRejected(p: { groupName: string }): EmailContent {
  return {
    subject: `Update on your request to join "${p.groupName}"`,
    element: (
      <Layout preview="An update on your join request." heading="An update on your request" privateLink={false}>
        <P>
          The organizer of <strong>{p.groupName}</strong> wasn&apos;t able to add you to this exchange. We&apos;ve removed your details from the
          participant list. You don&apos;t need to do anything.
        </P>
      </Layout>
    ),
  };
}

export const ASSIGNMENT_SUBJECT = "SantaElf has picked your Secret Santa recipient! 🎁";

/** MUST NOT contain the recipient's (or any other participant's) name. */
export function assignmentReady(p: { link: string }): EmailContent {
  return {
    subject: ASSIGNMENT_SUBJECT,
    element: (
      <Layout preview="Your Secret Santa assignment is ready." heading="The elves have finished drawing names!">
        <P>Open your Christmas card to find out who you’re buying for.</P>
        <CtaButton href={p.link}>Open my Christmas card</CtaButton>
      </Layout>
    ),
  };
}

/** Generic alert: never the message body, never the Santa's identity. */
export function newMessage(p: { thread: "recipient" | "santa"; link: string }): EmailContent {
  const headline = p.thread === "santa" ? "You have a new message from your Secret Santa" : "The person you’re buying for replied";
  return {
    subject: `${headline} 💌`,
    element: (
      <Layout preview={headline} heading={headline}>
        <P>Open your Secret Santa page and head to Messages to read it and reply.</P>
        <CtaButton href={p.link}>Read message</CtaButton>
      </Layout>
    ),
  };
}

export function drawFailed(p: { groupName: string; reason: string; link: string }): EmailContent {
  return {
    subject: `We couldn't draw names for "${p.groupName}" yet`,
    element: (
      <Layout preview="The scheduled drawing needs your attention." heading="The drawing needs your attention">
        <P>
          The scheduled drawing for <strong>{p.groupName}</strong> didn&apos;t happen: {p.reason}
        </P>
        <P>Open your dashboard to fix it, then draw names when you&apos;re ready.</P>
        <CtaButton href={p.link}>Open organizer dashboard</CtaButton>
      </Layout>
    ),
  };
}

export function emergencyCode(p: { groupName: string; code: string }): EmailContent {
  return {
    subject: `Your SantaElf emergency reveal code`,
    element: (
      <Layout preview="Your one-time code expires in 10 minutes." heading="Your emergency reveal code" privateLink={false}>
        <P>
          Enter this code on your <strong>{p.groupName}</strong> organizer dashboard. It expires in 10 minutes and can be used once.
        </P>
        <P>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 8, fontFamily: "monospace", color: "#430c15" }}>{p.code}</span>
        </P>
        <P>Using it reveals one participant&apos;s assignment and is recorded in the group&apos;s audit log. If you didn&apos;t request it, ignore this email.</P>
        <P>Please don&apos;t forward this email.</P>
      </Layout>
    ),
  };
}

/** Friendly wording for draw_failed reason codes. */
export function drawFailureReason(code: string): string {
  switch (code) {
    case "NOT_ENOUGH_PARTICIPANTS":
      return "at least 3 approved participants are needed.";
    case "IMPOSSIBLE_EXCLUSIONS":
      return "the exclusions you set make it impossible to give everyone a recipient.";
    default:
      return "something about the group's settings prevented it.";
  }
}
