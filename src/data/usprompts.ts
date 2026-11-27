/* The USA game: its places (states, cities, national parks) and every prompt it can ask. */
import { US_STATES } from "./regions";
import type { Category, Place, Prompt } from "./types";
import { CITY_ALIASES, DC, LARGEST_BY_AREA, PARKS, SMALLEST_BY_AREA, STATE, STATES, STATE_BY_ABBR, areaOf, cityKey, cityWiki, type UsState } from "./us";
import { STATE_POP, US_CITIES, type UsCity } from "./us.gen";

/* ---------- places ---------- */

export const US_PLACES = new Map<string, Place>();
const put = (p: Place) => { if (US_PLACES.has(p.id)) throw new Error(`duplicate place ${p.id}`); US_PLACES.set(p.id, p); return p.id; };

const stateId = (name: string) => "state:" + name;
for (const r of US_STATES) {
  const st = STATE.get(r.name)!;
  put({ id: stateId(r.name), name: r.name, wiki: r.wiki, keys: [r.name, ...r.aliases, st.abbr], area: r.name });
}

const cityId = (c: UsCity) => "city:" + cityKey(c.name, c.state);
for (const c of US_CITIES) {
  const k = cityKey(c.name, c.state), abbr = k.slice(k.lastIndexOf(", ") + 2);
  put({ id: cityId(c), name: c.name, wiki: cityWiki(c.name, c.state), area: c.state, ll: c.ll, pop: c.pop, qual: c.state === DC ? "D.C." : c.state,
    keys: [c.name, k, `${c.name} ${abbr}`, `${c.name}, ${c.state}`, ...(CITY_ALIASES[k] || [])] });
}
export const CITY_OF = new Map(US_CITIES.map(c => [cityKey(c.name, c.state), cityId(c)]));

const parkId = (name: string) => "park:" + name;
for (const p of PARKS) {
  const names = [p.name, ...p.aliases];
  put({ id: parkId(p.name), name: p.name, wiki: p.wiki, area: areaOf(p.states[0]), ll: p.ll,
    keys: [...names, ...names.map(n => n + " National Park")] });
}

/* ---------- prompts ---------- */

export const US_P: Prompt[] = [];
const add = (id: string, cat: Category, q: string, answers: string[], extra: Partial<Prompt> = {}) =>
  US_P.push({ id: "usa-" + id, cat, q, kind: "place", answers, ...extra });
const ids = (states: UsState[]) => states.map(s => stateId(s.name));
const states = (f: (s: UsState) => boolean) => ids(STATES.filter(f));
const named = (csv: string) => csv.split(",").map(x => {
  const s = STATE.get(x.trim());
  if (!s) throw new Error(`no state ${x}`);
  return stateId(s.name);
});
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

// The 50 states
add("states", "The 50 states", "Name a US state", states(() => true));
add("area-largest", "The 50 states", "Name one of the 10 largest states by area", named(LARGEST_BY_AREA.join(",")));
add("area-smallest", "The 50 states", "Name one of the 10 smallest states by area", named(SMALLEST_BY_AREA.join(",")));
add("pop-10m", "The 50 states", "Name a state with more than 10 million people", states(s => STATE_POP[s.name] > 10e6), { note: "Census Bureau estimates, 2024." });
add("pop-under-2m", "The 50 states", "Name a state with fewer than 2 million people", states(s => STATE_POP[s.name] < 2e6), { note: "Census Bureau estimates, 2024." });
const byPop = [...STATES].sort((a, b) => STATE_POP[b.name] - STATE_POP[a.name]);
add("pop-top15", "The 50 states", "Name one of the 15 most populous states", ids(byPop.slice(0, 15)), { note: "Census Bureau estimates, 2024." });

// Neighbours: land borders, with borders across the Great Lakes as the surprise answers
for (const s of STATES) {
  const all = [...s.land, ...s.water];
  if (all.length < 5) continue;
  add("border-" + slug(s.name), "Neighbours", `Name a state that borders ${s.name}`, all.map(a => stateId(STATE_BY_ABBR.get(a)!.name)),
    s.water.length ? { note: "Borders across the Great Lakes count.", trick: s.water.map(a => STATE_BY_ABBR.get(a)!.name) } : {});
}
add("canada", "Neighbours", "Name a state that borders Canada",
  named("Alaska, Washington, Idaho, Montana, North Dakota, Minnesota, Michigan, New York, Vermont, New Hampshire, Maine, Ohio, Pennsylvania"),
  { note: "Water borders on the Great Lakes count.", trick: ["Ohio", "Pennsylvania"] });
add("one-neighbour", "Neighbours", "Name a state that borders four or fewer states", states(s => s.land.length + s.water.length <= 4 && s.land.length > 0));

// Coasts & rivers
add("pacific", "Coasts & rivers", "Name a state on the Pacific", named("California, Oregon, Washington, Alaska, Hawaii"));
add("gulf", "Coasts & rivers", "Name a state on the Gulf of Mexico", named("Texas, Louisiana, Mississippi, Alabama, Florida"), { note: "Also called the Gulf of America in the US." });
add("atlantic", "Coasts & rivers", "Name a state on the Atlantic coast",
  named("Maine, New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia, Florida"),
  { note: "Bays and sounds open to the ocean count." });
add("great-lakes", "Coasts & rivers", "Name a state on the Great Lakes", named("Minnesota, Wisconsin, Illinois, Indiana, Michigan, Ohio, Pennsylvania, New York"));
add("mississippi", "Coasts & rivers", "Name a state the Mississippi River touches", named("Minnesota, Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiana"));
add("missouri", "Coasts & rivers", "Name a state the Missouri River touches", named("Montana, North Dakota, South Dakota, Nebraska, Iowa, Kansas, Missouri"));
add("ohio-river", "Coasts & rivers", "Name a state the Ohio River touches", named("Pennsylvania, West Virginia, Ohio, Kentucky, Indiana, Illinois"));
add("colorado-river", "Coasts & rivers", "Name a state the Colorado River flows through or along", named("Colorado, Utah, Arizona, Nevada, California"));
const COASTAL = new Set("California,Oregon,Washington,Alaska,Hawaii,Texas,Louisiana,Mississippi,Alabama,Florida,Maine,New Hampshire,Massachusetts,Rhode Island,Connecticut,New York,New Jersey,Delaware,Maryland,Virginia,North Carolina,South Carolina,Georgia".split(","));
add("no-coast", "Coasts & rivers", "Name a state with no ocean coastline", states(s => !COASTAL.has(s.name)), { note: "The Gulf of Mexico counts as ocean; the Great Lakes don't." });

// Regions & trails
const CENSUS: [string, string][] = [["Northeast", "northeast"], ["Midwest", "midwest"], ["South", "south"], ["West", "west"]];
for (const [r, id] of CENSUS) add("census-" + id, "Regions & trails", `Name a state in the ${r}`, states(s => s.region === r), { note: "As the Census Bureau draws it." });
add("new-england", "Regions & trails", "Name a New England state", named("Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, Connecticut"));
add("route-66", "Regions & trails", "Name a state that Route 66 ran through", named("Illinois, Missouri, Kansas, Oklahoma, Texas, New Mexico, Arizona, California"), { trick: ["Kansas"] });
add("appalachian-trail", "Regions & trails", "Name a state on the Appalachian Trail",
  named("Georgia, North Carolina, Tennessee, Virginia, West Virginia, Maryland, Pennsylvania, New Jersey, New York, Connecticut, Massachusetts, Vermont, New Hampshire, Maine"));

// History
add("thirteen", "History", "Name one of the original Thirteen Colonies",
  named("New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia"),
  { note: "As the states they became." });
add("confederacy", "History", "Name a state that joined the Confederacy",
  named("South Carolina, Mississippi, Florida, Alabama, Georgia, Louisiana, Texas, Virginia, Arkansas, North Carolina, Tennessee"), { note: "The eleven that seceded." });
add("before-1800", "History", "Name a state that joined the Union before 1800", states(s => s.admitted < 1800), { note: "The thirteen count, from when they ratified the Constitution." });
const byYear = [...STATES].sort((a, b) => b.admitted - a.admitted || a.name.localeCompare(b.name));
add("last-ten", "History", "Name one of the last ten states to join the Union", ids(byYear.slice(0, 10)), { note: "Montana was tenth from last, in 1889." });
add("1850-1899", "History", "Name a state that joined the Union between 1850 and 1899", states(s => s.admitted >= 1850 && s.admitted <= 1899));

// Cities (places with Census populations)
const cities = [...US_CITIES].sort((a, b) => b.pop - a.pop);
const cityIds = (list: UsCity[]) => list.map(cityId);
const big = (min: number) => cities.filter(c => c.pop >= min);
add("city-1m", "Cities", "Name a US city with more than a million people", cityIds(big(1e6)), { note: "The city itself, not the metro area. Census Bureau estimates, 2024." });
add("city-top25", "Cities", "Name one of the 25 biggest US cities", cityIds(cities.slice(0, 25)), { note: "The city itself, not the metro area. Census Bureau estimates, 2024." });
add("city-largest", "Cities", "Name a city that is the biggest in its state", STATES.map(s => cityId(cities.find(c => c.state === s.name)!)),
  { note: "Census Bureau estimates, 2024." });
for (const s of STATES) {
  // New York City would swamp the rest of New York State, so it sits that one out
  const nys = s.name === "New York", mine = cities.filter(c => c.state === s.name && !(nys && c.name === "New York"));
  for (const min of [500_000, 200_000, 100_000]) {
    const n = mine.filter(c => c.pop >= min).length;
    if (n < (nys ? 5 : 6) || (min === 100_000 && mine.some(c => c.pop >= 200_000) && n > 60)) continue;
    add(`city-${slug(s.name)}-${min / 1000}k`, "Cities", `Name a city in ${nys ? "New York State, other than New York City," : s.name} with more than ${(min / 1000).toLocaleString("en-US")},000 people`,
      cityIds(mine.filter(c => c.pop >= min)), { note: "Census Bureau estimates, 2024." });
  }
}

// State capitals
const capital = (s: UsState) => cityId(cities.find(c => c.state === s.name && c.name === s.capital)!);
add("capitals", "State capitals", "Name a state capital", STATES.map(capital));
add("capital-not-largest", "State capitals", "Name a state capital that isn't its state's biggest city",
  STATES.filter(s => cities.find(c => c.state === s.name)!.name !== s.capital).map(capital), { note: "Census Bureau estimates, 2024." });
add("capital-big", "State capitals", "Name a state capital with more than 250,000 people",
  STATES.filter(s => cities.find(c => c.state === s.name && c.name === s.capital)!.pop > 250_000).map(capital), { note: "Census Bureau estimates, 2024." });
add("capital-small", "State capitals", "Name a state capital with fewer than 50,000 people",
  STATES.filter(s => cities.find(c => c.state === s.name && c.name === s.capital)!.pop < 50_000).map(capital), { note: "Census Bureau estimates, 2024." });
const capInitial = (s: UsState) => s.capital.replace(/^St\. /, "Saint ")[0];
for (const letter of [...new Set(STATES.map(capInitial))].sort()) {
  const list = STATES.filter(s => capInitial(s) === letter);
  if (list.length >= 5) add("capital-letter-" + letter, "State capitals", `Name a state capital starting with “${letter}”`, list.map(capital),
    letter === "S" ? { note: "St. Paul counts as Saint Paul." } : {});
}
add("capital-west", "State capitals", "Name the capital of a state in the West", STATES.filter(s => s.region === "West").map(capital),
  { note: "As the Census Bureau draws it, Alaska and Hawaii included." });

// National parks
const parks = (f: (p: typeof PARKS[number]) => boolean) => PARKS.filter(f).map(p => parkId(p.name));
const inState = (...abbrs: string[]) => (p: typeof PARKS[number]) => p.states.some(s => abbrs.includes(s));
add("parks", "National parks", "Name a US national park", parks(() => true), { note: "The 63 with “National Park” in their official title." });
add("parks-ca", "National parks", "Name a national park in California", parks(inState("CA")));
add("parks-ak", "National parks", "Name a national park in Alaska", parks(inState("AK")));
add("parks-ut", "National parks", "Name a national park in Utah", parks(inState("UT")));
add("parks-southwest", "National parks", "Name a national park in Arizona, New Mexico, Nevada or Utah", parks(inState("AZ", "NM", "NV", "UT")));
add("parks-rockies", "National parks", "Name a national park in Colorado, Wyoming or Montana", parks(inState("CO", "WY", "MT")));
const EAST = "AL CT DE FL GA IL IN KY ME MD MA MI MS NH NJ NY NC OH PA RI SC TN VT VA WV WI".split(" ");
add("parks-east", "National parks", "Name a national park east of the Mississippi", parks(p => p.states.every(s => EAST.includes(s))),
  { note: "In the states entirely east of the river." });
add("parks-canyon", "National parks", "Name a national park with “Canyon” in its name", parks(p => p.name.includes("Canyon")));

// Wordplay
const word = (id: string, q: string, test: (n: string) => boolean, note?: string) => add(id, "Wordplay", q, states(s => test(s.name)), note ? { note } : {});
for (const letter of [...new Set(STATES.map(s => s.name[0]))].sort()) {
  if (STATES.filter(s => s.name[0] === letter).length >= 5) word("letter-" + letter, `Name a state starting with “${letter}”`, n => n[0] === letter);
}
word("vowel", "Name a state starting with a vowel", n => "AEIOU".includes(n[0]));
word("two-words", "Name a state with a two-word name", n => n.includes(" "));
word("end-a", "Name a state ending in “a”", n => n.endsWith("a"));
word("double", "Name a state with a double letter in its name", n => /(\w)\1/i.test(n.replace(/ /g, "")), "Like the “ss” in Missouri.");
word("long", "Name a state with 12 or more letters in its name", n => n.replace(/ /g, "").length >= 12, "Spaces don't count.");

/* ---------- city and park prompts in the state-heavy categories ----------
   Most USA prompts take states, and there are only 50, so two of them on one day often share an answer.
   These take cities and parks instead, so History, Coasts & rivers, Regions & trails and Wordplay have prompts that
   fit alongside the state ones. Lists cut at 100,000 people are complete, because the city data has every city that big. */
const city = (csv: string) => csv.split(";").map(x => {
  const id = CITY_OF.get(x.trim());
  if (!id) throw new Error(`no city ${x}`);
  return id;
});
const regionOf = (abbr: string) => STATE_BY_ABBR.get(abbr)?.region;
const NEW_ENGLAND = new Set(["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut"]);

// History
add("capitals-thirteen", "History", "Name the capital of one of the original Thirteen Colonies",
  STATES.filter(s => s.admitted < 1791).map(capital));
add("capitals-confederacy", "History", "Name the capital of a state that joined the Confederacy",
  named("South Carolina, Mississippi, Florida, Alabama, Georgia, Louisiana, Texas, Virginia, Arkansas, North Carolina, Tennessee").map(id => capital(STATE.get(id.slice(6))!)));
add("capitals-last-ten", "History", "Name the capital of one of the last ten states to join the Union", byYear.slice(0, 10).map(capital));

// Coasts & rivers
add("cities-mississippi", "Coasts & rivers", "Name a city on the Mississippi River with more than 100,000 people",
  city("Minneapolis, MN; St. Paul, MN; Davenport, IA; St. Louis, MO; Memphis, TN; Baton Rouge, LA; New Orleans, LA"));
add("capitals-big-rivers", "Coasts & rivers", "Name a state capital on the Mississippi or Missouri River", city("St. Paul, MN; Baton Rouge, LA; Bismarck, ND; Pierre, SD; Jefferson City, MO"));

// Regions & trails
add("parks-midwest", "Regions & trails", "Name a national park in the Midwest", parks(p => p.states.some(a => regionOf(a) === "Midwest")));
add("parks-south", "Regions & trails", "Name a national park in the South", parks(p => p.states.some(a => regionOf(a) === "South")));
add("cities-new-england", "Regions & trails", "Name a New England city with more than 100,000 people", cityIds(big(100_000).filter(c => NEW_ENGLAND.has(c.state))));
for (const [r, id] of CENSUS) {
  const list = big(500_000).filter(c => STATE.get(c.state)?.region === r);
  if (list.length >= 5) add("cities-500k-" + id, "Regions & trails", `Name a city in the ${r} with more than 500,000 people`, cityIds(list));
}

// Wordplay
add("cities-san", "Wordplay", "Name a city starting with “San” or “Santa” that has more than 100,000 people",
  cityIds(cities.filter(c => /^Sant?a? /.test(c.name) && (c.pop >= 100_000 || STATES.some(s => s.capital === c.name && s.name === c.state)))));
add("cities-city", "Wordplay", "Name a city with “City” in its name that has more than 100,000 people",
  cityIds(cities.filter(c => / City$/.test(c.name) && (c.pop >= 100_000 || STATES.some(s => s.capital === c.name && s.name === c.state)))));
add("cities-ville", "Wordplay", "Name a city ending in “ville” that has more than 100,000 people", cityIds(big(100_000).filter(c => c.name.endsWith("ville"))));
