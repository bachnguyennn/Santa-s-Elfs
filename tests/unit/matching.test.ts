import { describe, expect, it } from "vitest";
import { findAssignment, isFeasible, shuffle, type IsExcluded, type Rng } from "@/server/draw/matching";

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
const none: IsExcluded = () => false;
const fromPairs = (pairs: [string, string][]): IsExcluded => {
  const s = new Set(pairs.map(([g, r]) => `${g}|${r}`));
  return (g, r) => s.has(`${g}|${r}`);
};

/** Deterministic seeded rng (mulberry32) for reproducible tests. */
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return (max) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const x = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return Math.floor(x * max);
  };
}

function assertValid(ids: string[], isExcluded: IsExcluded, m: Map<string, string> | null) {
  expect(m).not.toBeNull();
  const map = m!;
  expect([...map.keys()].sort()).toEqual([...ids].sort());
  expect(new Set(map.values()).size).toBe(ids.length);
  for (const r of map.values()) expect(ids).toContain(r);
  for (const [g, r] of map) {
    expect(g).not.toBe(r);
    expect(isExcluded(g, r)).toBe(false);
  }
}

describe("findAssignment", () => {
  it("handles a 3-person group", () => {
    const ids = people(3);
    assertValid(ids, none, findAssignment(ids, none));
  });

  it("handles a 20-person group", () => {
    const ids = people(20);
    assertValid(ids, none, findAssignment(ids, none));
  });

  it("produces valid assignments over many random runs with random exclusions", () => {
    const rnd = seeded(42);
    for (let run = 0; run < 500; run++) {
      const n = 3 + (run % 18);
      const ids = people(n);
      const pairs: [string, string][] = [];
      for (const g of ids) for (const r of ids) if (g !== r && rnd(100) < 30) pairs.push([g, r]);
      const ex = fromPairs(pairs);
      const m = findAssignment(ids, ex);
      expect(m === null).toBe(!isFeasible(ids, ex));
      if (m) assertValid(ids, ex, m);
    }
  });

  it("respects symmetric (couple) exclusions", () => {
    const ids = people(6);
    const ex = fromPairs([["p0", "p1"], ["p1", "p0"], ["p2", "p3"], ["p3", "p2"], ["p4", "p5"], ["p5", "p4"]]);
    for (let i = 0; i < 100; i++) assertValid(ids, ex, findAssignment(ids, ex));
  });

  it("finds the single valid assignment when exclusions force it", () => {
    // Only cycle p0->p1->p2->p0 is allowed.
    const ids = people(3);
    const ex = fromPairs([["p0", "p2"], ["p1", "p0"], ["p2", "p1"]]);
    for (let i = 0; i < 20; i++) {
      expect(Object.fromEntries(findAssignment(ids, ex)!)).toEqual({ p0: "p1", p1: "p2", p2: "p0" });
    }
  });

  it("returns null when one person excludes everyone", () => {
    const ids = people(3);
    const ex = fromPairs([["p0", "p1"], ["p0", "p2"]]);
    expect(isFeasible(ids, ex)).toBe(false);
    expect(findAssignment(ids, ex)).toBeNull();
  });

  it("returns null when nobody may give to one person", () => {
    const ids = people(5);
    const ex: IsExcluded = (_g, r) => r === "p4";
    expect(findAssignment(ids, ex)).toBeNull();
  });

  it("detects Hall violations (3 givers restricted to 2 receivers)", () => {
    const ids = people(6);
    // p0,p1,p2 may only give to p3 or p4.
    const ex: IsExcluded = (g, r) => ["p0", "p1", "p2"].includes(g) && !["p3", "p4"].includes(r);
    expect(isFeasible(ids, ex)).toBe(false);
    expect(findAssignment(ids, ex)).toBeNull();
  });

  it("detects a 20-person near-impossible case quickly and solves a barely feasible one", () => {
    const ids = people(20);
    // Everyone in p0..p9 may only give to p10..p18 (9 receivers for 10 givers): infeasible.
    const low = new Set(ids.slice(0, 10));
    const allowedLow = new Set(ids.slice(10, 19));
    const impossible: IsExcluded = (g, r) => low.has(g) && !allowedLow.has(r);
    let start = performance.now();
    expect(findAssignment(ids, impossible)).toBeNull();
    expect(performance.now() - start).toBeLessThan(500);

    // Only the single cycle p_i -> p_{i+1} is allowed: exactly one valid assignment.
    const next = (id: string) => `p${(Number(id.slice(1)) + 1) % 20}`;
    const cycle: IsExcluded = (g, r) => r !== next(g);
    start = performance.now();
    const m = findAssignment(ids, cycle);
    expect(performance.now() - start).toBeLessThan(500);
    assertValid(ids, cycle, m);
  });

  it("returns null for fewer than two people", () => {
    expect(findAssignment(["a"], none)).toBeNull();
    expect(findAssignment([], none)).toBeNull();
  });

  it("is deterministic with an injected rng", () => {
    const ids = people(12);
    const a = findAssignment(ids, none, seeded(7));
    const b = findAssignment(ids, none, seeded(7));
    expect([...a!]).toEqual([...b!]);
  });

  it("produces varied assignments with the default secure rng", () => {
    const ids = people(8);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) seen.add(JSON.stringify([...findAssignment(ids, none)!]));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("shuffle", () => {
  it("is a permutation", () => {
    const arr = people(20);
    expect([...shuffle([...arr])].sort()).toEqual([...arr].sort());
  });
});
