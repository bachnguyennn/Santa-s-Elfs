import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { insertDrawnGroup } from "../helpers/services";
import { getParticipantHome, getRecipientView, revealAssignment } from "@/server/services/participant";
import { saveProfile } from "@/server/services/profiles";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

describe("participant home & reveal", () => {
  it("before the drawing: state none, NOT_DRAWN on reveal", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1);
    const ctx = { participantId: p, groupId: g.id };
    const home = await getParticipantHome(db, ctx);
    expect(home.assignment.state).toBe("none");
    expect(home.messaging).toEqual({ canMessageRecipient: false, hasSanta: false });
    expect(home.participant.alias).toBeNull();
    expect(home.group.name).toBe("Test Group");
    await expect(revealAssignment(db, ctx)).rejects.toMatchObject({ code: "NOT_DRAWN" });
    expect(await getRecipientView(db, ctx)).toBeNull();
  });

  it("scopes by group", async () => {
    const g = await insertDrawnGroup(db);
    const other = await insertGroup(db);
    await expect(getParticipantHome(db, { participantId: g.participants[0], groupId: other.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(revealAssignment(db, { participantId: g.participants[0], groupId: other.id })).rejects.toMatchObject({ code: "NOT_DRAWN" });
  });

  it("reveal is idempotent and never exposes recipient email/id", async () => {
    const g = await insertDrawnGroup(db);
    const [me, recipient] = g.participants;
    const ctx = { participantId: me, groupId: g.id };
    await saveProfile(db, { participantId: recipient, groupId: g.id }, { about: "Likes socks", interests: ["socks"], wishlist: [{ name: "Socks" }] });

    expect((await getParticipantHome(db, ctx)).assignment.state).toBe("ready");
    const first = await revealAssignment(db, ctx);
    expect(first.recipient.name).toBe("Person 2");
    expect(first.recipient.profile.about).toBe("Likes socks");
    expect(first.myAlias).toBe("Alias 1");
    const second = await revealAssignment(db, ctx);
    expect(second).toEqual(first);
    expect(await getRecipientView(db, ctx)).toEqual(first);

    const [{ email }] = await db.query<{ email: string }>(`select email from participants where id = $1`, [recipient]);
    const json = JSON.stringify(first);
    expect(json).not.toContain(email);
    for (const id of g.participants) expect(json).not.toContain(id);
    expect(Object.keys(first.recipient).sort()).toEqual(["name", "profile"]);

    const home = await getParticipantHome(db, ctx);
    expect(home.assignment.state).toBe("revealed");
    expect(home.participant.alias).toBe("Alias 1");
    expect(home.messaging).toEqual({ canMessageRecipient: true, hasSanta: true });

    const audits = await db.query<{ subject_participant_id: string; metadata: object }>(
      `select subject_participant_id, metadata from audit_events where event_type = 'assignment.revealed'`,
    );
    expect(audits).toHaveLength(1);
    expect(audits[0].subject_participant_id).toBe(me);
    expect(JSON.stringify(audits[0].metadata)).not.toContain(recipient);
  });
});
