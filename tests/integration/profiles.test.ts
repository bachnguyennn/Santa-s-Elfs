import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { loadProfile, saveProfile } from "@/server/services/profiles";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

describe("profiles", () => {
  it("empty profile by default", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1);
    expect(await loadProfile(db, p)).toEqual({ about: null, interests: [], dislikes: null, notes: null, wishlist: [] });
  });

  it("saves, dedupes interests, keeps wishlist order and replaces on re-save", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1, "pending");
    const ctx = { participantId: p, groupId: g.id };
    const saved = await saveProfile(db, ctx, {
      about: "Loves tea",
      interests: ["tea", "books", " tea "],
      dislikes: "",
      wishlist: [
        { name: "First", url: "https://example.com/1" },
        { name: "Second", description: "blue", url: "" },
        { name: "Third" },
      ],
    });
    expect(saved.about).toBe("Loves tea");
    expect(saved.dislikes).toBeNull();
    expect(saved.interests).toEqual(["tea", "books"]);
    expect(saved.wishlist.map((w) => [w.name, w.url, w.description])).toEqual([
      ["First", "https://example.com/1", null],
      ["Second", null, "blue"],
      ["Third", null, null],
    ]);

    const again = await saveProfile(db, ctx, { interests: [], wishlist: [{ name: "Only" }] });
    expect(again).toMatchObject({ about: null, interests: [], wishlist: [{ name: "Only" }] });
    expect(await loadProfile(db, p)).toEqual(again);
  });

  it("rejects javascript: URLs", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1);
    await expect(
      saveProfile(db, { participantId: p, groupId: g.id }, { interests: [], wishlist: [{ name: "x", url: "javascript:alert(1)" }] }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await db.query(`select 1 from wishlist_items`)).toHaveLength(0);
  });

  it("blocks removed participants, closed groups and foreign groups", async () => {
    const g = await insertGroup(db);
    const [p, q] = await insertParticipants(db, g.id, 2);
    await db.query(`update participants set status = 'removed' where id = $1`, [p]);
    await expect(saveProfile(db, { participantId: p, groupId: g.id }, { interests: [], wishlist: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const other = await insertGroup(db);
    await expect(saveProfile(db, { participantId: q, groupId: other.id }, { interests: [], wishlist: [] })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await db.query(`update groups set status = 'closed' where id = $1`, [g.id]);
    await expect(saveProfile(db, { participantId: q, groupId: g.id }, { interests: [], wishlist: [] })).rejects.toMatchObject({ code: "GROUP_LOCKED" });
  });
});
