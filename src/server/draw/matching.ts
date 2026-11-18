/**
 * Pure Secret Santa matching engine (no I/O).
 *
 * Finds a bijection giver -> receiver with no self-assignment that respects
 * every directional exclusion. Algorithm:
 *   1. Feasibility: bipartite perfect matching (Kuhn's augmenting paths).
 *   2. Random construction: shuffle givers (Fisher–Yates), and for each giver
 *      try receivers in random order, accepting a receiver only if the rest of
 *      the graph still has a perfect matching. This pruning means we never
 *      backtrack, so runtime is polynomial (n <= 20 in practice).
 *
 * Results are randomized with a cryptographically secure RNG, but the
 * distribution over valid assignments is NOT claimed to be uniform.
 */
import { randomInt } from "node:crypto";

/** Returns an integer in [0, maxExclusive). */
export type Rng = (maxExclusive: number) => number;

/** True when `giver` must not be assigned `receiver`. Self-assignment is always excluded. */
export type IsExcluded = (giver: string, receiver: string) => boolean;

const secureRng: Rng = (maxExclusive) => randomInt(maxExclusive);

/** In-place Fisher–Yates shuffle. */
export function shuffle<T>(items: T[], rng: Rng = secureRng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildAllowed(ids: readonly string[], isExcluded: IsExcluded): boolean[][] {
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate ids");
  return ids.map((g, i) => ids.map((r, j) => i !== j && !isExcluded(g, r)));
}

/**
 * Whether the givers not yet fixed can be perfectly matched to the receivers
 * not yet taken. `fixed[g]` is the receiver chosen for giver g, or -1.
 */
function hasPerfectMatching(allowed: boolean[][], fixed: Int32Array): boolean {
  const n = allowed.length;
  const taken = new Uint8Array(n);
  for (let g = 0; g < n; g++) if (fixed[g] >= 0) taken[fixed[g]] = 1;
  const matchR = new Int32Array(n).fill(-1);

  const augment = (g: number, seen: Uint8Array): boolean => {
    for (let r = 0; r < n; r++) {
      if (!allowed[g][r] || taken[r] || seen[r]) continue;
      seen[r] = 1;
      if (matchR[r] < 0 || augment(matchR[r], seen)) {
        matchR[r] = g;
        return true;
      }
    }
    return false;
  };

  for (let g = 0; g < n; g++) {
    if (fixed[g] >= 0) continue;
    if (!augment(g, new Uint8Array(n))) return false;
  }
  return true;
}

/** Whether any valid assignment exists for these ids and exclusions. */
export function isFeasible(ids: readonly string[], isExcluded: IsExcluded): boolean {
  if (ids.length < 2) return false;
  const allowed = buildAllowed(ids, isExcluded);
  return hasPerfectMatching(allowed, new Int32Array(ids.length).fill(-1));
}

/**
 * Random valid assignment (giver id -> receiver id), or null when none exists.
 * Inject `rng` for deterministic tests; defaults to `crypto.randomInt`.
 */
export function findAssignment(ids: readonly string[], isExcluded: IsExcluded, rng: Rng = secureRng): Map<string, string> | null {
  const n = ids.length;
  if (n < 2) return null;
  const allowed = buildAllowed(ids, isExcluded);
  const fixed = new Int32Array(n).fill(-1);
  if (!hasPerfectMatching(allowed, fixed)) return null;

  const givers = shuffle([...Array(n).keys()], rng);
  const used = new Uint8Array(n);
  for (const g of givers) {
    const candidates = shuffle(
      [...Array(n).keys()].filter((r) => allowed[g][r] && !used[r]),
      rng,
    );
    let chosen = -1;
    for (const r of candidates) {
      fixed[g] = r;
      if (hasPerfectMatching(allowed, fixed)) {
        chosen = r;
        break;
      }
    }
    // Unreachable: feasibility is an invariant maintained by every accepted step.
    if (chosen < 0) throw new Error("Matching invariant violated");
    used[chosen] = 1;
  }

  const result = new Map<string, string>();
  for (let g = 0; g < n; g++) result.set(ids[g], ids[fixed[g]]);
  return result;
}
