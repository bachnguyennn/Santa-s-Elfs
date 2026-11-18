// OWNER: email/messaging agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import { AppError } from "../errors";
import { rateLimit } from "../rateLimit";
import { audit } from "../audit";
import { enqueueEmail } from "../email/queue";
import { sendMessageSchema, type MessageDTO, type SendMessageInput, type Thread, type ThreadDTO } from "@/lib/contracts";

const MAX_MESSAGES = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Internal view of one conversation. `giverId` / `recipientId` stay server-side:
 * they are never copied into a ThreadDTO.
 */
interface ThreadRow {
  giver_id: string;
  recipient_id: string;
  group_status: string;
  revealed_at: string | null;
  recipient_muted_at: string | null;
  santa_alias: string | null;
  /** Only selected on the "recipient" thread (the caller is the Santa and may see who they drew). */
  recipient_name: string | null;
}

async function loadThread(db: Db, ctx: ParticipantCtx, thread: Thread): Promise<ThreadRow> {
  const rows =
    thread === "recipient"
      ? await db.query<ThreadRow>(
          `select a.giver_id, a.recipient_id, g.status as group_status, a.revealed_at, a.recipient_muted_at,
                  s.alias as santa_alias, r.name as recipient_name
             from assignments a
             join groups g on g.id = a.group_id
             join participants s on s.id = a.giver_id
             join participants r on r.id = a.recipient_id
            where a.group_id = $1 and a.giver_id = $2`,
          [ctx.groupId, ctx.participantId],
        )
      : await db.query<ThreadRow>(
          `select a.giver_id, a.recipient_id, g.status as group_status, a.revealed_at, a.recipient_muted_at,
                  s.alias as santa_alias, null as recipient_name
             from assignments a
             join groups g on g.id = a.group_id
             join participants s on s.id = a.giver_id
            where a.group_id = $1 and a.recipient_id = $2`,
          [ctx.groupId, ctx.participantId],
        );
  const row = rows[0];
  if (!row || row.group_status === "open") throw new AppError("NOT_DRAWN", "Names haven't been drawn yet.");
  if (thread === "recipient" && !row.revealed_at) throw new AppError("NOT_DRAWN", "Unwrap your assignment first.");
  return row;
}

async function toDTO(db: Db, ctx: ParticipantCtx, thread: Thread, row: ThreadRow): Promise<ThreadDTO> {
  const msgs = await db.query<{ id: string; sender_role: "santa" | "recipient"; body: string; created_at: string | Date }>(
    `select id, sender_role, body, created_at from messages
      where group_id = $1 and giver_id = $2
      order by created_at desc, id desc limit $3`,
    [ctx.groupId, row.giver_id, MAX_MESSAGES],
  );
  const myRole = thread === "recipient" ? "santa" : "recipient";
  const alias = row.santa_alias ?? "Secret Santa";
  const messages: MessageDTO[] = msgs.reverse().map((m) => ({
    id: m.id,
    fromMe: m.sender_role === myRole,
    body: m.body,
    createdAt: new Date(m.created_at).toISOString(),
  }));
  return {
    thread,
    counterpartLabel: thread === "recipient" ? (row.recipient_name ?? "") : `${alias} — Your Secret Santa`,
    santaAlias: alias,
    muted: row.recipient_muted_at !== null,
    messages,
  };
}

/** NOT_DRAWN before the drawing. The "santa" thread never exposes the giver's identity. */
export async function getThread(db: Db, ctx: ParticipantCtx, thread: Thread): Promise<ThreadDTO> {
  const row = await loadThread(db, ctx, thread);
  return toDTO(db, ctx, thread, row);
}

export async function sendMessage(db: Db, ctx: ParticipantCtx, input: SendMessageInput): Promise<ThreadDTO> {
  const { thread, body } = sendMessageSchema.parse(input);
  const row = await loadThread(db, ctx, thread);
  if (row.group_status === "closed") throw new AppError("CONFLICT", "This exchange has wrapped up; messages are read-only.");
  if (thread === "recipient" && row.recipient_muted_at) {
    throw new AppError("MUTED", "Your giftee has paused messages for now.");
  }
  await rateLimit(db, `msg:10m:${ctx.participantId}`, 20, 600);
  await rateLimit(db, `msg:day:${ctx.participantId}`, 100, 86_400);

  const senderRole = thread === "recipient" ? "santa" : "recipient";
  // Notify the other side, from *their* point of view.
  const notifyId = thread === "recipient" ? row.recipient_id : row.giver_id;
  const notifyThread: Thread = thread === "recipient" ? "santa" : "recipient";
  const hour = new Date().toISOString().slice(0, 13);

  await db.tx(async (t) => {
    await t.query(`insert into messages (group_id, giver_id, sender_role, body) values ($1, $2, $3, $4)`, [
      ctx.groupId,
      row.giver_id,
      senderRole,
      body,
    ]);
    const [p] = await t.query<{ email: string }>(`select email from participants where id = $1 and group_id = $2`, [notifyId, ctx.groupId]);
    if (p) {
      await enqueueEmail(
        t,
        p.email,
        { template: "new_message", groupId: ctx.groupId, participantId: notifyId, thread: notifyThread },
        `new_message:${ctx.groupId}:${row.giver_id}:${notifyThread}:${hour}`,
      );
    }
  });
  return toDTO(db, ctx, thread, row);
}

/** Recipient pauses / resumes messages from their Santa. */
export async function setSantaMuted(db: Db, ctx: ParticipantCtx, muted: boolean): Promise<ThreadDTO> {
  await loadThread(db, ctx, "santa");
  await db.query(
    `update assignments set recipient_muted_at = case when $3::boolean then coalesce(recipient_muted_at, now()) else null end
      where group_id = $1 and recipient_id = $2`,
    [ctx.groupId, ctx.participantId, muted],
  );
  return getThread(db, ctx, "santa");
}

/** Recipient reports a message from their Santa (flags it; mutes the thread). */
export async function reportMessage(db: Db, ctx: ParticipantCtx, messageId: string): Promise<void> {
  const notFound = () => new AppError("NOT_FOUND", "We couldn't find that message.");
  if (!UUID.test(messageId)) throw notFound();
  await db.tx(async (t) => {
    const rows = await t.query<{ id: string }>(
      `select m.id from messages m
         join assignments a on a.group_id = m.group_id and a.giver_id = m.giver_id
        where m.id = $1 and a.group_id = $2 and a.recipient_id = $3 and m.sender_role = 'santa'`,
      [messageId, ctx.groupId, ctx.participantId],
    );
    if (rows.length === 0) throw notFound();
    await t.query(`update messages set reported_at = coalesce(reported_at, now()) where id = $1`, [messageId]);
    await t.query(
      `update assignments set recipient_muted_at = coalesce(recipient_muted_at, now()) where group_id = $1 and recipient_id = $2`,
      [ctx.groupId, ctx.participantId],
    );
    await audit(t, { groupId: ctx.groupId, actor: "participant", type: "message.reported", metadata: { messageId } });
  });
}
