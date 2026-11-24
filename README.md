# Georilla

A daily geography game. You get seven prompts a day, 30 seconds each, and as many guesses as you like. Every prompt has lots of right answers, and the more obscure your right answer is, the more it scores.

Play it at https://mbartonftp.github.io/georilla/

## How it plays

- **Daily expedition.** Everyone gets the same seven prompts on a given day, based on the player's local date. No. 1 is 24 November 2026. The seven prompts always come from seven different categories (Capitals, Neighbours, Coasts & seas, Wordplay and so on).
- **Clock.** Each prompt shows for a moment before its 30-second clock starts. The ring around the globe drains as time runs out, and the screen edges glow red in the last five seconds.
- **Guessing.** Wrong answers cost only time. A wrong guess that is a real place flashes red on the globe. A likely typo is corrected for you to confirm, and the type-ahead lists every place name, so it never gives the answer away.
- **Reveal.** The globe flies to your answer and the rarity ladder climbs to your tier: Common 10, Familiar 25, Uncommon 45, Rare 70, Silverback 100. Every right answer lights up on the globe, coloured by tier.
- **Results.** You get a score out of 700, a rank (Tourist up to King of the Jungle), and an emoji line to share. Every answer to every prompt is listed, with your streak and stats underneath.
- **Practice.** A practice round uses a random set and doesn't count towards stats.
- **Mascot and sound.** Rilla the gorilla reacts as you play. Sound effects are synthesised in the browser and can be muted.

## How rarity works

There are no player counts yet, so Georilla predicts them. It assumes the chance that a player names a place is proportional to how often that place's English Wikipedia article is read: Paris is read far more than Chișinău, and far more players will think of it. Pageviews are averaged over five years to smooth out news spikes, raised to a power of 1.5 to sharpen the gap between famous and obscure places, and, for countries, multiplied by population to the power 0.25, because big countries come to mind even when few people read about them. Each right answer's predicted share is that weight over the total for all the prompt's answers.

The answers are then sorted from most to least likely and tiered by cumulative share. The answers that make up the first 50% of predicted guesses are Common, the next 25% Familiar, the next 15% Uncommon and the next 7% Rare. The last 3% are Silverback, so a Silverback answer is one that fewer than about one player in thirty would give. Small prompts with evenly known answers have fewer Silverbacks; big prompts with a long tail have more. The constants live in `src/data/rarity.ts`.

Some answers are right but rarely thought of in context, like Brazil bordering France through French Guiana. Prompts list these as `trick` answers, which are always Silverback.

Once there are real players, their answer counts can be blended into the same weights.

## Where the knowledge comes from

- **Countries.** The 193 UN members, plus Vatican City, Palestine, Kosovo and Taiwan, with capitals and the alternative names people type (`src/data/countries.ts`).
- **Open data** (`src/data/world.gen.ts`, regenerate with `npm run data:world`): land borders, area, landlocked status, currencies and native names from [mledoze/countries](https://github.com/mledoze/countries) (ODbL), and population from the World Bank via [datasets/population](https://github.com/datasets/population) (CC BY 4.0). Known errors in the source are corrected in `scripts/build-world.ts`.
- **Hand-checked features** (`src/data/features.ts`): seas, rivers, mountain ranges, lines of latitude, regions, languages and currencies.
- **States and provinces** (`src/data/regions.ts`): the US, Canada, Australia, Germany, India, Brazil and Mexico.
- **Popularity** (`src/data/popularity.gen.ts`): the average yearly English Wikipedia pageviews, over five years, for every country, capital and region. Wikipedia's API isn't reachable from every machine, so the **Refresh popularity** GitHub Action (`.github/workflows/refresh-popularity.yml`) fetches it and commits the result. It runs on a branch whenever the list of places changes, every January, and on demand. You can also run `npm run data:popularity` locally.

The tests check this data hard: borders are symmetric and match the shared edges of the map shapes, the equator, tropics, Arctic Circle and Prime Meridian lists match the real country outlines, no landlocked country appears on a coast, no typed name can mean two answers, every place has pageview data, and every prompt has at least five answers.

## Development

It's written in TypeScript and built with Vite. Node 20 or newer is needed.

```sh
npm install
npm run dev        # local server with hot reload at http://localhost:5173/georilla/
npm test           # unit tests for data integrity, answer matching, rarity and scoring (Vitest)
npm run typecheck  # strict TypeScript check
npm run build      # production build into dist/
npm run data:world       # regenerate open-data country facts (src/data/world.gen.ts)
npm run data:popularity  # regenerate Wikipedia pageviews (src/data/popularity.gen.ts); needs access to Wikipedia
```

GitHub Actions (`.github/workflows/deploy.yml`) type-checks, tests and builds every pull request. It deploys `main` to GitHub Pages; for that to work, set the Pages source to **GitHub Actions** in the repo settings. A second workflow, `refresh-popularity.yml`, keeps the pageview data current (see above).

## Files

- `index.html`: page markup. Vite's entry point is `src/main.ts`.
- `src/data/`: the knowledge base.
  - `countries.ts`, `regions.ts`, `features.ts`: hand-maintained places and facts.
  - `world.gen.ts`, `popularity.gen.ts`: generated from open data; don't edit by hand.
  - `prompts.ts`: builds the prompt list (about 180 prompts in 12 categories).
  - `rarity.ts`: turns pageviews into predicted shares and tiers.
  - `index.ts`: answers for a prompt, and `judge()` for answer matching.
- `scripts/`: the data builders.
- `src/rules.ts`: daily seeding, scoring, ranks and the share line. It doesn't touch the page.
- `src/globe.ts`: the canvas globe (d3-geo), with fly-to, fills, pins and drag to spin.
- `src/game.ts`: game flow, timer, reveal and results.
- `src/sound.ts`, `src/fx.ts`, `src/store.ts`: sound effects, confetti, and safe localStorage.
- `src/style.css`: styles.
- `public/data/`: Natural Earth country shapes from world-atlas, in 110m and 50m resolutions.
- `tests/`: Vitest unit tests. `geometry.test.ts` checks borders and lines of latitude against the map shapes.

Scores and stats are saved only in the player's browser.
