// OWNER: backend agent. Contract — keep signatures stable.
import type { Db } from "../db/types";
import type { ParticipantCtx } from "../tokens";
import { profileSchema, type ProfileDTO, type ProfileInput } from "@/lib/contracts";
import { AppError } from "../errors";

/** Internal: load a participant's profile + wishlist. Callers must already be authorized. */
export async function loadProfile(db: Db, participantId: string): Promise<ProfileDTO> {
  const [p] = await db.query<{ about: string | null; interests: string[]; dislikes: string | null; notes: string | null }>(
    `select about, interests, dislikes, notes from profiles where participant_id = $1`,
    [participantId],
  );
  const items = await db.query<{ id: string; name: string; description: string | null; url: string | null }>(
    `select id, name, description, url from wishlist_items where participant_id = $1 order by position`,
    [participantId],
  );
  return {
    about: p?.about || null,
    interests: p?.interests ?? [],
    dislikes: p?.dislikes || null,
    notes: p?.notes || null,
    wishlist: items.map((i) => ({ id: i.id, name: i.name, description: i.description || null, url: i.url || null })),
  };
}

/** Replace the caller's own profile and wishlist. Allowed while pending or approved. */
export async function saveProfile(db: Db, ctx: ParticipantCtx, input: ProfileInput): Promise<ProfileDTO> {
  const v = profileSchema.parse(input);
  await db.tx(async (t) => {
    const [row] = await t.query<{ status: string; group_status: string }>(
      `select p.status, g.status as group_status from participants p join groups g on g.id = p.group_id
        where p.id = $1 and p.group_id = $2`,
      [ctx.participantId, ctx.groupId],
    );
    if (!row) throw new AppError("NOT_FOUND", "We couldn't find your profile.");
    if (row.status !== "pending" && row.status !== "approved") {
      throw new AppError("FORBIDDEN", "You're no longer part of this group.");
    }
    if (row.group_status === "closed") throw new AppError("GROUP_LOCKED", "This exchange has finished.");

    await t.query(
      `insert into profiles (participant_id, about, interests, dislikes, notes, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (participant_id) do update
         set about = excluded.about, interests = excluded.interests, dislikes = excluded.dislikes,
             notes = excluded.notes, updated_at = now()`,
      [ctx.participantId, v.about ?? null, v.interests, v.dislikes ?? null, v.notes ?? null],
    );
    await t.query(`delete from wishlist_items where participant_id = $1`, [ctx.participantId]);
    for (const [position, item] of v.wishlist.entries()) {
      await t.query(
        `insert into wishlist_items (participant_id, position, name, description, url) values ($1, $2, $3, $4, $5)`,
        [ctx.participantId, position, item.name, item.description ?? null, item.url ?? null],
      );
    }
  });
  return loadProfile(db, ctx.participantId);
}
