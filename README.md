# Georilla

A daily geography game. You get seven prompts a day, 30 seconds each, and as many guesses as you like. Every prompt has lots of right answers, and the more obscure your right answer is, the more it scores.

Play it at https://mbartonftp.github.io/georilla/

## How it plays

- **Daily expedition.** Everyone gets the same seven prompts on a given day, based on the player's local date. No. 1 is 24 November 2026.
- **Clock.** Each prompt shows for a moment before its 30-second clock starts. The ring around the globe drains as time runs out, and the screen edges glow red in the last five seconds.
- **Guessing.** Wrong answers cost only time. A wrong guess that is a real place flashes red on the globe. A likely typo is corrected for you to confirm, and the type-ahead lists every place name, so it never gives the answer away.
- **Reveal.** The globe flies to your answer and the rarity ladder climbs to your tier: Common 10, Familiar 25, Uncommon 45, Rare 70, Silverback 100. Every right answer lights up on the globe, coloured by tier.
- **Results.** You get a score out of 700, a rank (Tourist up to King of the Jungle), and an emoji line to share. Every answer to every prompt is listed, with your streak and stats underneath.
- **Practice.** A practice round uses a random set and doesn't count towards stats.
- **Mascot and sound.** Rilla the gorilla reacts as you play. Sound effects are synthesised in the browser and can be muted.

## How rarity works

There are no player counts yet, so each country has a hand-set fame score from 1 (obscure) to 5 (household name). For each prompt, the right answers are ranked by fame against each other and split into five tiers. A prompt can mark surprising answers as top tier by hand with `boost`, for example Brazil bordering France through French Guiana.

## Files

It's a static site with no build step and no backend. Serve the repo root.

- `index.html`: markup and styles.
- `js/data.js`: all content and answer matching.
  - `RAW`: countries with continents, capitals, fame, tags and accepted alternative names.
  - `BORDERS`: borders for the "borders X" prompts.
  - `CUSTOM`: US states, Canadian provinces and Australian states.
  - `P`: the prompt list.
  - `judge()`: answer matching.
- `js/globe.js`: the canvas globe, with fly-to, fills, pins and drag to spin.
- `js/game.js`: game flow, timer, reveal, results, sound and confetti.
- `vendor/`: d3 and topojson-client, copied in so the game has no runtime CDN dependency.
- `data/`: Natural Earth country shapes from world-atlas, in 110m and 50m resolutions.

Scores and stats are saved only in the player's browser.

To run it locally, run `python3 -m http.server` in the repo root and open http://localhost:8000. The map data is fetched, so opening the file directly doesn't work.
