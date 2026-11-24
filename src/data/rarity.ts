/* Rarity: how likely is a player to give this answer?

   There are no players to count yet, so Georilla predicts it. Each answer gets a salience weight from real-world data:
   - how often its English Wikipedia article is read (five-year average), raised to ALPHA, a stand-in for how familiar
     the name is;
   - for countries, also population raised to BETA, because big countries come to mind first even when few people read
     about them (Ethiopia, DR Congo).
   Each answer's predicted share is its weight over the prompt's total weight.

   Answers are then sorted most to least likely, and tiered by where they sit in the cumulative share:
   the answers that make up the first half of all predicted guesses are Common, the next quarter Familiar, and so on.
   So "Silverback" means roughly "fewer than one player in thirty would say this". When real play data exists,
   observed answer counts can be blended into the weights without changing anything else. */

/** Pageviews are a soft signal (people read about obscure places too), so >1 sharpens the gap between famous and obscure. */
export const ALPHA = 1.5;
/** How much population adds for countries. */
export const BETA = 0.25;
/** A capital that shares its country's article (Monaco, Singapore, Vatican City) is rarely what players reach for. */
export const CITY_STATE_FACTOR = 0.1;
/** Upper bounds of cumulative predicted share for Common, Familiar, Uncommon and Rare; the rest is Silverback. */
export const BANDS = [0.5, 0.75, 0.9, 0.97] as const;

/** Trick answers are well known places that few would think of for this prompt, so their weight is cut to this fraction. */
export const TRICK_FACTOR = 0.02;

export interface Rated { share: number; tier: number }

/** Salience weight of one answer. */
export const salience = (views: number, pop?: number): number => Math.max(1, views) ** ALPHA * (pop ? pop ** BETA : 1);

/** Shares and tiers for answers with the given salience weights (in input order). Trick answers are always Silverback. */
export function rate(weights: number[], trick: boolean[] = []): Rated[] {
  const w = weights.map((v, i) => v * (trick[i] ? TRICK_FACTOR : 1)), total = w.reduce((s, x) => s + x, 0);
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
