# Georilla

Daily geography games.

## Outlier

Seven geography prompts a day, 30 seconds each. Every prompt has many right answers, and the more obscure your correct answer, the more it scores: Common 10, Familiar 25, Uncommon 45, Rare 70, Outlier 100. Everyone gets the same seven prompts on a given day (by the player's local date), and the result can be copied as an emoji line.

It is a single static file, `index.html`, with no build step and no backend. Open it in a browser, or serve the repo root with GitHub Pages.

### How rarity works

There are no player counts yet, so each country has a hand-set fame score from 1 (obscure) to 5 (household name). For each prompt, answers are ranked by fame against the other valid answers and split into five tiers. A prompt can mark surprising answers as top tier by hand with `boost`, for example Brazil bordering France through French Guiana.

### Editing content

All data is at the top of the script in `index.html`:

- `RAW`: one line per country with continents, capitals, fame, tags (landlocked, equator, Mediterranean, and so on) and accepted alternative names.
- `BORDERS`: land borders for the countries used in "borders X" prompts.
- `CUSTOM`: non-country answer sets such as US states and Canadian provinces.
- `P`: the prompt list. The daily set takes seven prompts, at most one per family (one continent, one letter, one border prompt).

Puzzle No. 1 is 24 November 2026.
