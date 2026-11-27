/* Shared types for Georilla's knowledge base. */

/** [longitude, latitude] in degrees */
export type LonLat = [number, number];

export type ContinentCode = "AF" | "AS" | "EU" | "NA" | "SA" | "OC";

export interface Capital {
  name: string;
  /** English Wikipedia article title, used to look up how well known the city is */
  wiki: string;
  aliases: string[];
}

export interface Country {
  name: string;
  /** ISO 3166-1 alpha-3 code (mledoze/countries uses UNK for Kosovo) */
  iso3: string;
  cont: ContinentCode[];
  /** empty when the capital is disputed; such countries sit out the capital prompts */
  caps: Capital[];
  aliases: string[];
  wiki: string;
  /** Kosovo, Palestine and Taiwan: accepted as answers, flagged for anyone curious */
  partial?: boolean;
}

/** A place inside a country: a US state, a Canadian province… */
export interface Region {
  name: string;
  wiki: string;
  aliases: string[];
}

/** Facts generated from open data by scripts/build-world.ts. */
export interface WorldFacts {
  area: number;
  pop: number;
  popYear: number;
  landlocked: boolean;
  /** land neighbours, as our display names */
  borders: string[];
  languages: string[];
  currencies: string[];
  /** Latin-script native and alternative names, used as extra aliases */
  alt: string[];
  latlng: [number, number];
}

export type Category =
  | "Continents" | "Regions" | "Capitals" | "Neighbours" | "Wordplay" | "Coasts & seas" | "Lines on the map"
  | "Rivers & ranges" | "Land & islands" | "Language & money" | "Size & people" | "States & provinces"
  // the capitals game
  | "Capital trivia"
  // the USA game
  | "The 50 states" | "Coasts & rivers" | "Regions & trails" | "History" | "Cities" | "State capitals" | "National parks";

/** A place in one of the side games: a US state, city or national park. */
export interface Place {
  /** unique id, like "city:Portland, OR" */
  id: string;
  name: string;
  wiki: string;
  /** every name a player might type, the display name first */
  keys: string[];
  /** the map area it sits in (a US state), for fills */
  area: string;
  /** where to put the pin, if not the middle of the area */
  ll?: LonLat;
  /** people, for cities: big cities come to mind first */
  pop?: number;
  /** tells apart two places with the same name, like "Oregon" for Portland */
  qual?: string;
}

export interface Prompt {
  /** unique, stable id */
  id: string;
  q: string;
  /** background for whoever edits the prompts. Never shown to players, so it can't give answers away */
  note?: string;
  cat: Category;
  /** what the answers are: countries, capitals of countries, regions of one country, or places by id */
  kind: "country" | "capital" | "region" | "place";
  /** answer names: countries (for country and capital prompts) or region names */
  answers: string[];
  /** for region prompts: which country, so the globe can point there */
  parent?: string;
  /** right but rarely thought of in this context (Brazil bordering France); always Silverback */
  trick?: string[];
  /** wordplay prompts: only names passing this test are accepted ("Timor-Leste" for T, not "East Timor") */
  spell?: (name: string) => boolean;
}

export interface Answer {
  label: string;
  /** country (or, in the USA game, state) this answer sits in, for the map */
  country?: string;
  /** where to put the pin, if not the middle of that area */
  ll?: LonLat;
  /** for capital answers: the country it is the capital of */
  sub?: string;
  /** yearly English Wikipedia pageviews, the basis of rarity */
  views: number;
  /** predicted share of players who'd give this answer */
  share: number;
  keys: string[];
  nkeys: string[];
  /** 0 Common … 4 Silverback */
  tier: number;
}

export type Judgement =
  | { kind: "empty" }
  | { kind: "ok"; item: Answer }
  | { kind: "wrong"; name: string }
  | { kind: "typo"; name: string; item: Answer | null }
  | { kind: "unknown" };
