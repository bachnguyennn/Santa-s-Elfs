// OWNER: email/messaging agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import type { SendMessageInput, Thread, ThreadDTO } from "@/lib/contracts";

/** NOT_DRAWN before the drawing. The "santa" thread never exposes the giver's identity. */
export async function getThread(db: Db, ctx: ParticipantCtx, thread: Thread): Promise<ThreadDTO> {
  void db; void ctx; void thread;
  throw new Error("not implemented");
}

export async function sendMessage(db: Db, ctx: ParticipantCtx, input: SendMessageInput): Promise<ThreadDTO> {
  void db; void ctx; void input;
  throw new Error("not implemented");
}

/** Recipient pauses / resumes messages from their Santa. */
export async function setSantaMuted(db: Db, ctx: ParticipantCtx, muted: boolean): Promise<ThreadDTO> {
  void db; void ctx; void muted;
  throw new Error("not implemented");
}

/** Recipient reports a message from their Santa (flags it; mutes the thread). */
export async function reportMessage(db: Db, ctx: ParticipantCtx, messageId: string): Promise<void> {
  void db; void ctx; void messageId;
  throw new Error("not implemented");
}
