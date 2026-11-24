/* Shared types for Georilla's knowledge base. */

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
  | "Rivers & ranges" | "Land & islands" | "Language & money" | "Size & people" | "States & provinces";

export interface Prompt {
  /** unique, stable id */
  id: string;
  q: string;
  note?: string;
  cat: Category;
  /** what the answers are: countries, capitals of countries, or regions of one country */
  kind: "country" | "capital" | "region";
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
  /** country this answer sits in, for the globe */
  country?: string;
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
