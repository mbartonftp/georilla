/* Hand-kept notes for the familiarity measure: how well known a place's name is.

   Georilla blends two signals (see rarity.ts):
   - how often the place's Wikipedia article is read (popularity.gen.ts), and
   - how often its name turns up in everyday English, from the wordfreq dataset (wordfreq.gen.ts).
   Pageviews overrate trivia favourites: people look up Tuvalu or Liechtenstein because they're curious, not because
   the names come to mind. Word frequency overrates names that are also ordinary words or people (Chad, Turkey, Mobile).
   Each signal covers the other's blind spot, and this file says where word frequency can't be trusted.

   Word frequency is only used for countries, capitals, states and provinces. Most US city and park names are
   ordinary words or people (Independence, Surprise, Lincoln, Olympic), so those keep pageviews and population. */

/** Names whose spelling mostly means something else in English text, so their word frequency says little about the place. */
export const NOT_A_PLACE_WORD = new Set<string>([
  // countries
  "Chad", "Jordan", "Turkey", "Georgia", "Guinea", "Chile", "Dominica", "Congo", "Marshall Islands", "Solomon Islands",
  "San Marino",
  // capitals
  "Malé", "Victoria", "Kingston", "Kingstown", "Lima", "Manila", "Sofia", "Havana", "Georgetown", "Hamilton", "Praia",
  "Santiago", "San José", "Nassau", "Moroni", "Sucre", "Roseau", "Castries", "Washington, D.C.", "Porto-Novo",
  "Port-au-Prince", "Bissau", "La Paz", "Port Vila",
  // US states
  "Washington", "Virginia", "Indiana", "New Jersey", "New Hampshire",
  // provinces and states elsewhere
  "Acre", "Pará", "Paraná", "Amazonas", "Tocantins", "Rio de Janeiro", "São Paulo", "Espírito Santo", "Hamburg", "Hesse",
  "Brandenburg", "New South Wales", "Chihuahua", "Tabasco", "Durango", "Hidalgo", "Guerrero", "Morelos", "Colima",
  "Nova Scotia", "New Brunswick", "Delhi", "Goa", "Rio Grande do Norte", "Prince Edward Island", "Northwest Territories"
]);

/** Other names people write for the same place; their word frequencies are added to the main name's. */
export const ALSO_WRITTEN = new Map<string, string[]>([
  ["Czechia", ["Czech Republic"]],
  ["Eswatini", ["Swaziland"]],
  ["Myanmar", ["Burma"]],
  ["Ivory Coast", ["Côte d'Ivoire"]],
  ["Kyiv", ["Kiev"]],
  ["Timor-Leste", ["East Timor"]],
  ["East Timor", ["Timor-Leste"]],
  ["Cape Verde", ["Cabo Verde"]],
  ["Cabo Verde", ["Cape Verde"]],
  ["North Macedonia", ["Macedonia"]],
  ["Astana", ["Nur-Sultan"]],
  ["Ulaanbaatar", ["Ulan Bator"]]
]);

/** Words that say what kind of place it is rather than which one, so they're skipped in multi-word names
    ("Republic of the Congo" is as rare as "Congo", not as common as "Republic"). */
export const GENERIC_WORDS = new Set<string>([
  "the", "of", "and", "de", "del", "da", "do", "dos", "la", "le", "el", "al", "d", "s", "st", "saint", "san", "santa", "são",
  "new", "north", "south", "east", "west", "northern", "southern", "eastern", "western", "central", "upper", "lower",
  "great", "city", "port", "town", "island", "islands", "republic", "united", "territory", "territories", "capital",
  "district", "state", "federal", "pradesh", "democratic", "people's", "kingdom", "federated", "states"
]);

/** Hand corrections, in tenths of a power of ten of familiarity (+3 means twice as familiar, -3 half), each with its reason.
    Use sparingly: they're for cases neither signal can see. */
export const NUDGE: Record<string, { by: number; why: string }> = {
  "Maryland": { by: -1.5, why: "about 2.9 million views a year, twice any state its size; looks like automated traffic" },
  "Victoria (state)": { by: 4, why: "readers go to Melbourne's article, so the state's own page undercounts it" },
  "Brasília": { by: 3, why: "famous as the planned capital that isn't Rio or São Paulo, more than its pageviews show" },
  // parks whose fame lives in the landscape's own article, not the park's
  "Grand Canyon National Park": { by: 6, why: "the Grand Canyon is one of the best known places in America; the park page gets a fraction of its readers" },
  "Everglades National Park": { by: 4, why: "readers go to the Everglades article" },
  "Denali National Park and Preserve": { by: 3, why: "readers go to the mountain's article" },
  "Death Valley National Park": { by: 2, why: "readers go to the valley's article" },
  "Mammoth Cave National Park": { by: -3, why: "pageviews well above how often players think of it" },
  "Gates of the Arctic National Park and Preserve": { by: -3, why: "the least visited national park; pageviews come from curiosity" }
};
