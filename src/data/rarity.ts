/* Rarity: how likely is a player to give this answer?

   There are no players to count yet, so Georilla predicts it, much as Krillion does: from how familiar each name is.
   Familiarity blends two measures of how well known a place is:
   - how often its English Wikipedia article is read (five-year average), and
   - for countries, capitals, states and provinces, how often its name is written in everyday English (the wordfreq
     dataset: books, news, subtitles, the web, social media), mapped onto the same scale as pageviews.
   Pageviews alone overrate places people look up out of curiosity (Tuvalu, Liechtenstein, Eswatini) and are noisy
   between similar places (every US state gets about a million views a year). Word frequency alone overrates names
   that are also ordinary words or people (Chad, Turkey), so those keep pageviews alone (see familiarity.ts).
   The two are averaged on a log scale, and a few hand nudges fix what neither can see.

   Each answer's salience weight is its familiarity raised to ALPHA, times population raised to BETA for countries and
   US cities, because big places come to mind first even when few people read about them (Ethiopia, DR Congo).
   Each answer's predicted share is its weight over the prompt's total weight.

   Answers are then sorted most to least likely, and tiered by how many guesses would go to likelier answers:
   an answer is Common while fewer than half of all predicted guesses are for likelier answers, Familiar while fewer
   than three quarters are, and so on. So "Silverback" means "more than 97% of players would name something more
   obvious". Counting only the likelier answers keeps a strong runner-up (New Zealand, behind Australia) from being
   marked down just because the favourite takes most of the guesses. When real play data exists,
   observed answer counts can be blended into the weights without changing anything else.
   Everything here is fixed data, so a day's scores never change while people play. */

/** Familiarity is a soft signal, so >1 sharpens the gap between famous and obscure. */
export const ALPHA = 1.25;
/** How much population adds for countries. */
export const BETA = 0.25;
/** A capital that shares its country's article (Monaco, Singapore, Vatican City) is rarely what players reach for. */
export const CITY_STATE_FACTOR = 0.1;
/** Initials like PRC or DPRK, as wordplay answers: common in print, rare as an answer. */
export const INITIALS_FACTOR = 0.1;
/** Upper bounds of the predicted share of guesses going to likelier answers, for Common, Familiar, Uncommon and Rare;
    beyond the last is Silverback. */
export const BANDS = [0.5, 0.75, 0.9, 0.97] as const;

/** Trick answers are well known places that few would think of for this prompt, so their weight is cut to this fraction. */
export const TRICK_FACTOR = 0.02;

export interface Rated { share: number; tier: number }

/** Salience weight of one answer, from its familiarity (in pageviews a year, see blend) and population. */
export const salience = (familiar: number, pop?: number): number => Math.max(1, familiar) ** ALPHA * (pop ? pop ** BETA : 1);

/** Maps Zipf word frequency onto log10 pageviews by matching their mean and spread over the places that have both. */
export interface ZipfScale { meanZipf: number; sdZipf: number; meanViews: number; sdViews: number }
export function fitScale(pairs: [log10Views: number, zipf: number][]): ZipfScale {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const sd = (xs: number[], m: number) => Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
  const v = pairs.map(p => p[0]), z = pairs.map(p => p[1]), meanViews = mean(v), meanZipf = mean(z);
  return { meanZipf, sdZipf: sd(z, meanZipf), meanViews, sdViews: sd(v, meanViews) };
}

/** Pageviews a year implied by a word frequency, as log10. */
export const wordsAsViews = (zipf: number, scale: ZipfScale): number => scale.meanViews + (zipf - scale.meanZipf) * scale.sdViews / scale.sdZipf;

/** Familiarity in pageviews a year: the geometric mean of real pageviews and the pageviews its word frequency implies.
    A place with no usable word frequency stands in its pageviews moved by `gap`: how far, on average, word frequency
    moves its peers (other states, other capitals), so leaving it out doesn't push it up or down the list.
    `nudge` is a hand correction in tenths of a power of ten. */
export function blend(views: number, zipf: number | undefined, scale: ZipfScale, gap = 0, nudge = 0): number {
  const lv = Math.log10(Math.max(1, views));
  const fromWords = zipf === undefined ? lv + gap : wordsAsViews(zipf, scale);
  return 10 ** ((lv + fromWords) / 2 + nudge / 10);
}

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
    const tier = BANDS.findIndex(b => cum < b);
    for (let k = i; k < j; k++) out[order[k]].tier = tier < 0 ? 4 : tier;
    cum += groupShare; i = j;
  }
  trick.forEach((t, k) => { if (t) out[k].tier = 4; });
  return out;
}
