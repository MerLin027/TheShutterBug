/**
 * Shuffle bag for the sign-in photographs (owner's rule, 2026-11-15): every
 * photo is shown once, in random order, before any photo repeats. When the
 * bag is empty it refills with all of them, except that the photo just shown
 * can't open the next round (no back-to-back repeat at the changeover).
 *
 * Pure: storage and randomness come in as arguments, so the rule can be
 * reasoned about (and tested) on its own. `stored` is untrusted — it comes
 * from localStorage, which anything on the origin can write — so it is
 * validated, never assumed.
 */
export type BagState = { seen: number[]; last: number | null };

export function parseBag(raw: string | null, count: number): BagState {
  const empty: BagState = { seen: [], last: null };
  if (!raw) return empty;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return empty;
    const o = v as { seen?: unknown; last?: unknown };
    const valid = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < count;
    const seen = Array.isArray(o.seen) ? [...new Set(o.seen.filter(valid))] : [];
    const last = valid(o.last) ? o.last : null;
    return { seen, last };
  } catch {
    return empty;
  }
}

/**
 * Pick this visit's photo. `suggested` is the server's random pick, used
 * when it's still in the bag (so most of the time nothing changes on the
 * client); otherwise a random photo from what's left.
 */
export function drawFromBag(
  count: number,
  suggested: number,
  state: BagState,
  random: () => number = Math.random
): { pick: number; next: BagState } {
  // A full bag (every photo seen) starts a new round.
  let seen = state.seen.length >= count ? [] : state.seen;
  const newRound = seen.length === 0;

  const available = [...Array(count).keys()].filter(
    (i) => !seen.includes(i) && !(newRound && count > 1 && i === state.last)
  );
  const pick = available.includes(suggested)
    ? suggested
    : available[Math.floor(random() * available.length)] ?? suggested;

  seen = [...seen, pick];
  return { pick, next: { seen, last: pick } };
}
