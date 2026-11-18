import { shuffle, type Rng } from "./matching";

/** The 20 Christmas aliases (one per possible participant). */
export const ALIAS_POOL = [
  "Rudolph",
  "Dasher",
  "Dancer",
  "Prancer",
  "Vixen",
  "Comet",
  "Cupid",
  "Donner",
  "Blitzen",
  "Jingle",
  "Tinsel",
  "Holly",
  "Mistletoe",
  "Snowflake",
  "Gingerbread",
  "Sugarplum",
  "Evergreen",
  "Cocoa",
  "Peppermint",
  "Northstar",
] as const;

/** Assign each id a unique alias from the pool via a secure shuffle (rng injectable for tests). */
export function assignAliases(ids: readonly string[], rng?: Rng): Map<string, string> {
  if (ids.length > ALIAS_POOL.length) throw new Error(`At most ${ALIAS_POOL.length} aliases are available`);
  const pool = shuffle([...ALIAS_POOL], rng);
  return new Map(ids.map((id, i) => [id, pool[i]]));
}
