/* Rarity: how likely is a player to give this answer?

   There are no players to count yet, so Georilla predicts it. The chance that someone names a place is taken to be
   proportional to how often its English Wikipedia article is read (a good stand-in for how familiar the name is),
   raised to ALPHA. Each answer's predicted share is its weight over the prompt's total weight.

   Answers are then sorted most to least likely, and tiered by where they sit in the cumulative share:
   the answers that make up the first half of all predicted guesses are Common, the next quarter Familiar, and so on.
   So "Silverback" means roughly "fewer than one player in thirty would say this". When real play data exists,
   observed answer counts can be blended into the weights without changing anything else. */

/** >1 exaggerates the gap between famous and obscure places; <1 flattens it. */
export const ALPHA = 1;
/** Upper bounds of cumulative predicted share for Common, Familiar, Uncommon and Rare; the rest is Silverback. */
export const BANDS = [0.5, 0.75, 0.9, 0.97] as const;

/** Trick answers are well known places that few would think of for this prompt, so their weight is cut to this fraction. */
export const TRICK_FACTOR = 0.02;

export interface Rated { share: number; tier: number }

/** Shares and tiers for answers with the given weights (in input order). Trick answers are always Silverback. */
export function rate(views: number[], trick: boolean[] = []): Rated[] {
  const w = views.map((v, i) => Math.max(1, v) ** ALPHA * (trick[i] ? TRICK_FACTOR : 1)), total = w.reduce((s, x) => s + x, 0);
  const order = w.map((_, i) => i).sort((a, b) => w[b] - w[a]);
  const out: Rated[] = w.map(x => ({ share: x / total, tier: 0 }));
  let cum = 0, i = 0;
  while (i < order.length) {
    // equal weights share a tier
    let j = i, groupShare = 0;
    while (j < order.length && w[order[j]] === w[order[i]]) groupShare += out[order[j++]].share;
    const mid = cum + groupShare / 2;
    const tier = BANDS.findIndex(b => mid < b);
    for (let k = i; k < j; k++) out[order[k]].tier = tier < 0 ? 4 : tier;
    cum += groupShare; i = j;
  }
  trick.forEach((t, k) => { if (t) out[k].tier = 4; });
  return out;
}
