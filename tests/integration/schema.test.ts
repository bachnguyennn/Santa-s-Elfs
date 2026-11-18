import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { insertGroup, insertParticipants } from "../helpers/fixtures";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  db = await createTestDb();
});
afterEach(async () => db.close());

describe("database invariants", () => {
  it("rejects a 21st approved participant", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 20);
    await expect(insertParticipants(db, g.id, 1)).rejects.toThrow(/GROUP_FULL/);
  });

  it("allows pending requests beyond capacity but blocks approving them", async () => {
    const g = await insertGroup(db, { requiresApproval: true });
    await insertParticipants(db, g.id, 20);
    const [pending] = await insertParticipants(db, g.id, 1, "pending");
    await expect(db.query(`update participants set status = 'approved' where id = $1`, [pending])).rejects.toThrow(/GROUP_FULL/);
  });

  it("enforces one email per group", async () => {
    const g = await insertGroup(db);
    await db.query(`insert into participants (group_id, name, email, status) values ($1, 'A', 'a@x.com', 'approved')`, [g.id]);
    await expect(
      db.query(`insert into participants (group_id, name, email, status) values ($1, 'A2', 'a@x.com', 'approved')`, [g.id]),
    ).rejects.toThrow();
  });

  it("locks membership once drawn", async () => {
    const g = await insertGroup(db);
    await insertParticipants(db, g.id, 3);
    await db.query(`update groups set status = 'drawn', drawn_at = now() where id = $1`, [g.id]);
    await expect(insertParticipants(db, g.id, 1)).rejects.toThrow(/GROUP_LOCKED/);
  });

  it("rejects cross-group assignments", async () => {
    const a = await insertGroup(db);
    const b = await insertGroup(db);
    const [pa] = await insertParticipants(db, a.id, 1);
    const [pb] = await insertParticipants(db, b.id, 1);
    await expect(db.query(`insert into assignments (group_id, giver_id, recipient_id) values ($1, $2, $3)`, [a.id, pa, pb])).rejects.toThrow();
  });

  it("rejects invalid status transitions", async () => {
    const g = await insertGroup(db);
    const [p] = await insertParticipants(db, g.id, 1, "pending");
    await db.query(`update participants set status = 'rejected' where id = $1`, [p]);
    await expect(db.query(`update participants set status = 'removed' where id = $1`, [p])).rejects.toThrow(/INVALID_TRANSITION/);
  });
});
