import { describe, expect, it } from "vitest";
import { ALIAS_POOL, assignAliases } from "@/server/draw/aliases";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe("aliases", () => {
  it("has exactly the 20 expected names", () => {
    expect(ALIAS_POOL).toEqual([
      "Rudolph", "Dasher", "Dancer", "Prancer", "Vixen", "Comet", "Cupid", "Donner", "Blitzen", "Jingle",
      "Tinsel", "Holly", "Mistletoe", "Snowflake", "Gingerbread", "Sugarplum", "Evergreen", "Cocoa", "Peppermint", "Northstar",
    ]);
  });

  it.each([3, 10, 20])("assigns unique pool aliases to %i participants", (n) => {
    const m = assignAliases(ids(n));
    expect([...m.keys()]).toEqual(ids(n));
    expect(new Set(m.values()).size).toBe(n);
    for (const a of m.values()) expect(ALIAS_POOL).toContain(a);
  });

  it("is deterministic with an injected rng", () => {
    const zero = () => 0;
    expect([...assignAliases(ids(3), zero)]).toEqual([...assignAliases(ids(3), zero)]);
  });

  it("throws for more than 20 participants", () => {
    expect(() => assignAliases(ids(21))).toThrow();
  });
});
