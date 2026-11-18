import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";
import { insertDrawnGroup } from "../helpers/services";
import { addExclusion, listExclusions, removeExclusion } from "@/server/services/exclusions";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

const sorted = (xs: { giverId: string; receiverId: string }[]) => xs.map((x) => `${x.giverId}>${x.receiverId}`).sort();

describe("exclusions", () => {
  it("adds and removes symmetric exclusions", async () => {
    const g = await insertGroup(db);
    const [a, b, c] = await insertParticipants(db, g.id, 3);
    const ctx = { groupId: g.id };
    expect(sorted(await addExclusion(db, ctx, { giverId: a, receiverId: b }))).toEqual(sorted([{ giverId: a, receiverId: b }, { giverId: b, receiverId: a }]));
    // idempotent
    expect(await addExclusion(db, ctx, { giverId: b, receiverId: a })).toHaveLength(2);
    expect(await addExclusion(db, ctx, { giverId: a, receiverId: c, symmetric: false })).toHaveLength(3);
    expect(sorted(await removeExclusion(db, ctx, { giverId: b, receiverId: a }))).toEqual([`${a}>${c}`]);
    expect(await removeExclusion(db, ctx, { giverId: a, receiverId: c, symmetric: false })).toEqual([]);
    expect(await listExclusions(db, ctx)).toEqual([]);
  });

  it("rejects cross-group participants and self-exclusion", async () => {
    const g1 = await insertGroup(db);
    const g2 = await insertGroup(db);
    const [a] = await insertParticipants(db, g1.id, 1);
    const [x, y] = await insertParticipants(db, g2.id, 2);
    await expect(addExclusion(db, { groupId: g1.id }, { giverId: a, receiverId: x })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addExclusion(db, { groupId: g1.id }, { giverId: x, receiverId: y })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addExclusion(db, { groupId: g1.id }, { giverId: a, receiverId: a })).rejects.toThrow();
    expect(await listExclusions(db, { groupId: g2.id })).toEqual([]);
  });

  it("is locked after the drawing", async () => {
    const g = await insertDrawnGroup(db);
    const [a, b] = g.participants;
    await expect(addExclusion(db, { groupId: g.id }, { giverId: a, receiverId: b })).rejects.toMatchObject({ code: "GROUP_LOCKED" });
    await expect(removeExclusion(db, { groupId: g.id }, { giverId: a, receiverId: b })).rejects.toMatchObject({ code: "GROUP_LOCKED" });
  });
});
