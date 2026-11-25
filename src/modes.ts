/* Georilla's three daily games. Each has its own prompts, saved progress, stats and share line. */
import { ALL_NAMES, CAPITAL_NAMES, CAP_P, KNOWN_US, P, PLACE_COUNTRY, PLACE_US, US_NAMES, US_P, type Known, type LonLat, type NameEntry, type Prompt } from "./data";

export type ModeId = "world" | "usa" | "capitals";

export interface Mode {
  id: ModeId;
  /** tab label */
  name: string;
  /** what the share line and headings call it */
  title: string;
  emoji: string;
  pool: Prompt[];
  /** mixed into the date, so each game gets a different daily draw */
  salt: number;
  /** localStorage keys: day progress is `${dayKey}${date}` */
  dayKey: string;
  statsKey: string;
  map: "globe" | "usa";
  names: NameEntry[];
  /** names this game recognises, or undefined for the world list */
  known?: Known;
  /** where a recognised wrong answer is, to flash it on the map */
  locate(name: string): { area: string; ll?: LonLat } | null;
  intro: { eyebrow: string; h1: string; blurb: string };
  /** places the map drifts between on the intro screen */
  demo: string[];
  placeholder: string;
}

export const MODES: Mode[] = [
  {
    id: "world", name: "World", title: "", emoji: "🌍", pool: P, salt: 0, dayKey: "gr-day-", statsKey: "gr-stats", map: "globe", names: ALL_NAMES,
    locate: n => (PLACE_COUNTRY[n] ? { area: PLACE_COUNTRY[n] } : null),
    intro: { eyebrow: "Expedition", h1: "Name the places nobody else will.",
      blurb: "Seven prompts, <b>30 seconds</b> each, as many guesses as you like. Every prompt has lots of right answers, and the more obscure yours is, the more it scores." },
    demo: ["Bhutan", "Suriname", "Malta", "Namibia", "Laos", "Uruguay", "Iceland", "Fiji", "Eritrea", "Moldova", "Belize", "Comoros"],
    placeholder: "Type a place"
  },
  {
    id: "usa", name: "USA", title: "USA", emoji: "🇺🇸", pool: US_P, salt: 1, dayKey: "gr-usa-day-", statsKey: "gr-usa-stats", map: "usa", names: US_NAMES, known: KNOWN_US,
    locate: n => PLACE_US[n] || null,
    intro: { eyebrow: "Road trip", h1: "Fifty states. Go off the interstate.",
      blurb: "Seven prompts about US states, cities, rivers and national parks, <b>30 seconds</b> each. Skip the famous answers: the less likely yours is, the more it scores." },
    demo: ["Vermont", "Wyoming", "New Mexico", "Delaware", "Idaho", "Arkansas", "Maine", "Nebraska", "Oregon", "South Carolina", "Hawaii", "Alaska"],
    placeholder: "Type a state, city or park"
  },
  {
    id: "capitals", name: "Capitals", title: "Capitals", emoji: "🏛️", pool: CAP_P, salt: 2, dayKey: "gr-cap-day-", statsKey: "gr-cap-stats", map: "globe", names: CAPITAL_NAMES,
    locate: n => (PLACE_COUNTRY[n] ? { area: PLACE_COUNTRY[n] } : null),
    intro: { eyebrow: "Grand tour", h1: "Every country has one. Name the one nobody else will.",
      blurb: "Seven prompts, every answer a capital city, <b>30 seconds</b> each. Paris scores 10. Ngerulmud scores a lot more." },
    demo: ["Mongolia", "Bhutan", "Burkina Faso", "Palau", "Suriname", "Eswatini", "Kyrgyzstan", "Malta", "Belize", "Djibouti"],
    placeholder: "Type a capital city"
  }
];
export const MODE = new Map(MODES.map(m => [m.id, m]));
export const modeFromHash = (hash: string): Mode | undefined => MODE.get(hash.replace(/^#/, "") as ModeId);

/** Each game's daily seed. The world game keeps the plain date, so its sets didn't change when the other games arrived. */
export const seedFor = (m: Mode, dayKey: number): number => (m.salt ? dayKey * 10 + m.salt : dayKey);
