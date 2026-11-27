# Georilla

Three daily geography games on one page. Each gives you seven prompts a day, 30 seconds each, and as many guesses as you like. Every prompt has lots of right answers, and the more obscure your right answer is, the more it scores.

- **World** (the expedition): countries, capitals, seas, rivers, borders and more, on a spinning globe.
- **USA** (the road trip): US states, cities, rivers, borders, history and national parks, on a zoomable map of the US.
- **Capitals** (the grand tour): every answer is a capital city, pinned where it really is on the globe.

Play it at https://mbartonftp.github.io/georilla/

## How it plays

- **Three games a day.** Tabs under the map switch between World, USA and Capitals, and show whether you've played each one today. Everyone gets the same seven prompts in each game on a given day, based on the player's local date. All three share the day number; No. 1 is 24 November 2026. The seven prompts always come from seven different categories (Capitals, Neighbours, Coasts & seas, Wordplay and so on). A link ending `#usa` or `#capitals` opens that game.
<<<<<<< HEAD
- **No answer counts twice.** A day's prompts never share a right answer, so you can't give La Paz for both "a capital of a country with two capitals" and "a capital in South America". This holds across the three games too: the Capitals game never asks the capital version of one of the day's World prompts (World's "a country on the Black Sea" and Capitals' "the capital of a country on the Black Sea"), and the USA game avoids states the World game's US prompts already asked for. The USA game is mostly about the same 50 states, so it also has prompts answered with cities and national parks in each of its categories; in a simulated year no two USA prompts shared an answer. Broad prompts (the 30 most populous countries, a US state) come up less often than narrow ones, because they share answers with more of the rest. Days before 28 November 2026 keep the sets that were played.
=======
- **No answer counts twice.** A day's prompts never share a right answer, so you can't give La Paz for both "a capital of a country with two capitals" and "a capital in South America". This holds across the three games too: the Capitals game never asks the capital version of one of the day's World prompts (World's "a country on the Black Sea" and Capitals' "the capital of a country on the Black Sea"), and the USA game avoids states the World game's US prompts already asked for. The USA game is almost all about the same 50 states, so on roughly one day in fourteen two of its prompts still share a state. Broad prompts (the 30 most populous countries, a US state) come up less often than narrow ones, because they share answers with more of the rest. Days before 28 November 2026 keep the sets that were played.
>>>>>>> origin/main
- **No hints.** A prompt is just the question. Alternative spellings (St. Paul for Saint Paul, NYC for New York) are accepted without being mentioned on screen.
- **Clock.** Each prompt shows for a moment before its 30-second clock starts. The ring around the globe drains as time runs out, and the screen edges glow red in the last five seconds.
- **Guessing.** Wrong answers cost only time. A wrong guess that is a real place flashes red on the globe. A likely typo is corrected for you to confirm, and the type-ahead lists every place name, so it never gives the answer away.
- **Reveal.** The globe flies to your answer and the rarity ladder climbs to your tier: Common 10, Familiar 25, Uncommon 45, Rare 70, Silverback 100. Every right answer lights up on the globe, coloured by tier.
- **Results.** You get a score out of 700, a rank (Tourist up to King of the Jungle), and an emoji line to share, which names the game ("Georilla USA No. 2") and links straight to it. Once you've finished two or three games in a day, a second button ("Share both games" or "Share all three") copies one message with a line per game and the combined score, like "Georilla No. 4 🦍 625/1400". Every answer to every prompt is listed, with your streak and stats underneath, and buttons for the games you haven't played yet today. Each game keeps its own progress, stats and streak.
- **Practice.** A practice round uses a random set from the current game and doesn't count towards stats.
- **Maps.** The World and Capitals games use the globe. The USA game uses a flat map of the states in the same round frame: it zooms to each answer's state, flies out to Alaska, Hawaii and the territories, and can be dragged around. Cities, national parks and capitals get a dot where they really are.
- **Mascot and sound.** Rilla the gorilla reacts as you play. Sound effects are synthesised in the browser and can be muted.
- **Fits the screen.** The game is always exactly as tall as the visible screen, so the page never scrolls; the globe grows or shrinks to fill whatever room is left, and a long panel (like the results) scrolls inside itself. On a phone, opening the keyboard shrinks the layout to the space above it: the header and game tabs step aside and the globe shrinks (down to just the clock on small phones), so the prompt, answer box, Go button and suggestions stay in view. Suggestions are a swipeable row of chips under the answer box, so they never cover the prompt.

## How rarity works

There are no player counts yet, so Georilla predicts them. It assumes the chance that a player names a place is proportional to how often that place's English Wikipedia article is read: Paris is read far more than Chișinău, and far more players will think of it. Pageviews are averaged over five years to smooth out news spikes, raised to a power of 1.5 to sharpen the gap between famous and obscure places, and, for countries, multiplied by population to the power 0.25, because big countries come to mind even when few people read about them. Each right answer's predicted share is that weight over the total for all the prompt's answers.

The answers are then sorted from most to least likely and tiered by cumulative share. The answers that make up the first 50% of predicted guesses are Common, the next 25% Familiar, the next 15% Uncommon and the next 7% Rare. The last 3% are Silverback, so a Silverback answer is one that fewer than about one player in thirty would give. Small prompts with evenly known answers have fewer Silverbacks; big prompts with a long tail have more. The constants live in `src/data/rarity.ts`.

Some answers are right but rarely thought of in context, like Brazil bordering France through French Guiana. Prompts list these as `trick` answers, which are always Silverback.

Once there are real players, their answer counts can be blended into the same weights.

## The USA game

Prompts come in nine categories: the 50 states (size, population), neighbours (borders, including the Great Lakes water borders as surprise answers), coasts and rivers, regions and trails (Census regions, New England, Route 66, the Appalachian Trail), history (the Thirteen Colonies, the Confederacy, when states joined, and their capitals), cities, state capitals, national parks and wordplay. History, coasts and rivers, regions and wordplay each have prompts answered with cities or parks as well as states (big cities on the Mississippi, national parks in the Midwest, cities ending in "ville"), so a day's prompts don't all fight over the same 50 states. Answers can be states, cities or any of the 63 national parks. Players can type abbreviations (NY), nicknames (NYC, Philly) and park names with or without "National Park". When two cities in one prompt share a name, both are shown with their state, and the bare name means the bigger one.

## The capitals game

Every answer is a capital. Most prompts are the World game's country prompts reworded ("Name the capital of a country on the Black Sea"), so they share the same checked data. There are also capitals by continent, wordplay on capital names, and capital trivia, like capitals that aren't their country's biggest city.

## Where the knowledge comes from

- **Countries.** The 193 UN members, plus Vatican City, Palestine, Kosovo and Taiwan, with capitals and the alternative names people type (`src/data/countries.ts`).
- **Open data** (`src/data/world.gen.ts`, regenerate with `npm run data:world`): land borders, area, landlocked status, currencies and native names from [mledoze/countries](https://github.com/mledoze/countries) (ODbL), and population from the World Bank via [datasets/population](https://github.com/datasets/population) (CC BY 4.0). Known errors in the source are corrected in `scripts/build-world.ts`.
- **Hand-checked features** (`src/data/features.ts`): seas, rivers, mountain ranges, lines of latitude, regions, languages and currencies.
- **States and provinces** (`src/data/regions.ts`): the US, Canada, Australia, Germany, India, Brazil and Mexico.
- **Capital locations** (`src/data/capitals.gen.ts`, regenerate with `npm run data:capitals`): from Natural Earth's populated places (public domain).
- **US facts** (`src/data/us.ts`): the 50 states with their capitals, neighbours, Census regions and the year they joined, the 10 largest and smallest by area, and the 63 national parks with where they are.
- **US cities** (`src/data/us.gen.ts`, regenerate with `npm run data:us`): every city of 100,000 people or more, plus every state capital and each state's biggest city, with 2024 population estimates and locations from the US Census Bureau. It also holds state populations. census.gov isn't reachable from every machine, so the **Refresh popularity** GitHub Action runs this too.
- **Popularity** (`src/data/popularity.gen.ts`): the average yearly English Wikipedia pageviews, over five years, for every country, capital, region, US city and national park. Wikipedia's API isn't reachable from every machine, so the **Refresh popularity** GitHub Action (`.github/workflows/refresh-popularity.yml`) fetches it and commits the result. It runs on a branch whenever the list of places changes, every January, and on demand. You can also run `npm run data:popularity` locally. For US cities, rarity also counts population to the power 0.25, as for countries.

The tests check this data hard: borders are symmetric and match the shared edges of the map shapes, the equator, tropics, Arctic Circle and Prime Meridian lists match the real country outlines, no landlocked country appears on a coast, no typed name can mean two answers, every place has pageview data, and every prompt has at least five answers. For the USA game, the tests check state borders against the shared edges of the US map shapes, that every city and capital sits inside its state, and that there are exactly 63 national parks.

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
npm run data:us          # regenerate US city data (src/data/us.gen.ts); needs access to census.gov
npm run data:capitals    # regenerate capital locations (src/data/capitals.gen.ts)
```

GitHub Actions (`.github/workflows/deploy.yml`) type-checks, tests and builds every pull request. It deploys `main` to GitHub Pages; for that to work, set the Pages source to **GitHub Actions** in the repo settings. A second workflow, `refresh-popularity.yml`, rebuilds the US city data and keeps the pageview data current (see above).

## Files

- `index.html`: page markup. Vite's entry point is `src/main.ts`.
- `src/data/`: the knowledge base.
  - `countries.ts`, `regions.ts`, `features.ts`: hand-maintained places and facts.
  - `us.ts`: hand-checked US states and national parks.
  - `world.gen.ts`, `popularity.gen.ts`, `us.gen.ts`, `capitals.gen.ts`: generated from open data; don't edit by hand.
  - `prompts.ts`: builds the World game's prompts (about 180 prompts in 12 categories).
  - `usprompts.ts`: the USA game's places and prompts.
  - `capprompts.ts`: the capitals game's prompts.
  - `rarity.ts`: turns pageviews into predicted shares and tiers.
  - `index.ts`: answers for a prompt, and `judge()` for answer matching.
- `scripts/`: the data builders.
- `src/rules.ts`: daily seeding (including the rule that a day's prompts never share an answer), scoring, ranks and the share line. It doesn't touch the page.
- `src/modes.ts`: the three games: their prompt pools, storage keys, intro text and share names, and `dailySets`, which picks all three games' sets for a day so they don't overlap.
- `src/mapview.ts`: what the game needs from a map. `src/globe.ts` is the canvas globe (d3-geo), with fly-to, fills, dots, pins and drag to spin; `src/usmap.ts` is the flat US map, with zoom-to-state and drag to pan.
- `src/game.ts`: game flow, timer, reveal and results.
- `src/viewport.ts`: sizes the page to the visible screen (the visual viewport) and spots the on-screen keyboard; the layout rules are under "App shell" and "keyboard open" in `src/style.css`.
- `src/sound.ts`, `src/fx.ts`, `src/store.ts`: sound effects, confetti, and safe localStorage.
- `src/style.css`: styles.
- `public/data/`: Natural Earth country shapes from world-atlas, in 110m and 50m resolutions, and US state shapes from us-atlas (Census Bureau, 1:10m).
- `tests/`: Vitest unit tests. `geometry.test.ts` checks borders and lines of latitude against the map shapes; `games.test.ts` covers the USA and capitals games.

Scores and stats are saved only in the player's browser.
