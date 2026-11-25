/* Regenerates src/data/us.gen.ts from US Census Bureau data:
   - Vintage 2024 population estimates for states and incorporated places (sub-est2024.csv)
   - the 2024 Gazetteer place file, for each place's location
   Keeps every city of 100,000 or more, plus each state's capital and largest city.
   census.gov isn't reachable from every machine; the "Refresh popularity" GitHub Action runs this.
   Run with: npm run data:us */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DC, STATES } from "../src/data/us";

const POPEST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv";
const GAZETTEER = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip";
const MIN_POP = 100_000;

/** Hawaii has no incorporated places, so the Census estimates leave Honolulu out. 2020 Census count for Urban Honolulu CDP. */
const EXTRA: { name: string; state: string; geoid: string; pop: number; source: string }[] = [
  { name: "Honolulu", state: "Hawaii", geoid: "1571550", pop: 350_964, source: "2020 Census, Urban Honolulu CDP" }
];
/** Census names that aren't what anyone calls the city. */
const RENAME: Record<string, string> = {
  "Nashville-Davidson": "Nashville", "Louisville/Jefferson County": "Louisville", "Lexington-Fayette": "Lexington",
  "Athens-Clarke County": "Athens", "Augusta-Richmond County": "Augusta", "Macon-Bibb County": "Macon",
  "Boise City": "Boise", "San Buenaventura (Ventura)": "Ventura", "Urban Honolulu": "Honolulu"
};

const decode = (buf: ArrayBuffer | Uint8Array): string => {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("latin1").decode(buf) : utf8;
};
const fetchBuf = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.arrayBuffer();
};

/** "Louisville/Jefferson County metro government (balance)" → "Louisville/Jefferson County" → "Louisville" */
export function cleanName(raw: string): string {
  let n = raw.replace(/\s*\(balance\)$/, "");
  // drop the trailing government type, which the Census writes in lower case: city, town, metropolitan government…
  n = n.replace(/(\s+[a-z][a-z.]*)+$/, "");
  return RENAME[n] || n;
}

function csvRow(line: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function main() {
  const est = decode(await fetchBuf(POPEST)).trim().split(/\r?\n/);
  const head = csvRow(est[0]), col = (k: string) => { const i = head.indexOf(k); if (i < 0) throw new Error(`no column ${k}`); return i; };
  const [SUMLEV, STATE, PLACE, NAME, STNAME, POP] = ["SUMLEV", "STATE", "PLACE", "NAME", "STNAME", "POPESTIMATE2024"].map(col);

  const dir = mkdtempSync(join(tmpdir(), "gaz-")), zip = join(dir, "gaz.zip");
  writeFileSync(zip, Buffer.from(await fetchBuf(GAZETTEER)));
  const gaz = decode(execFileSync("unzip", ["-p", zip], { maxBuffer: 1 << 30 })).trim().split(/\r?\n/);
  const gh = gaz[0].split("\t").map(s => s.trim()), gi = (k: string) => gh.indexOf(k);
  const where = new Map<string, [number, number]>();
  for (const line of gaz.slice(1)) {
    const f = line.split("\t").map(s => s.trim());
    where.set(f[gi("GEOID")], [Math.round(+f[gi("INTPTLONG")] * 1000) / 1000, Math.round(+f[gi("INTPTLAT")] * 1000) / 1000]);
  }

  const statePop: Record<string, number> = {};
  type Row = { name: string; state: string; pop: number; ll: [number, number] };
  const places: Row[] = [];
  const seen = new Set<string>();
  for (const line of est.slice(1)) {
    const f = csvRow(line);
    if (f[SUMLEV] === "040") { statePop[f[STNAME]] = +f[POP]; continue; }
    if (f[SUMLEV] !== "162") continue;
    const geoid = f[STATE] + f[PLACE];
    if (seen.has(geoid)) continue;
    seen.add(geoid);
    const ll = where.get(geoid);
    if (!ll) { console.warn(`no location for ${f[NAME]}, ${f[STNAME]}`); continue; }
    places.push({ name: cleanName(f[NAME]), state: f[STNAME], pop: +f[POP], ll });
  }
  for (const x of EXTRA) {
    if (places.some(p => p.name === x.name && p.state === x.state)) continue;
    const ll = where.get(x.geoid);
    if (!ll) throw new Error(`no location for ${x.name}`);
    places.push({ name: x.name, state: x.state, pop: x.pop, ll });
  }

  const keep = new Set<Row>();
  for (const p of places) if (p.pop >= MIN_POP) keep.add(p);
  for (const s of [...STATES.map(s => s.name), DC]) {
    const mine = places.filter(p => p.state === s).sort((a, b) => b.pop - a.pop);
    if (!mine.length) throw new Error(`no places in ${s}`);
    keep.add(mine[0]);
    const st = STATES.find(x => x.name === s);
    if (st) {
      const cap = mine.find(p => p.name === st.capital);
      if (!cap) throw new Error(`can't find the capital of ${s}, ${st.capital}`);
      keep.add(cap);
    }
  }
  const list = [...keep].sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name));
  const body = list.map(p => `  ${JSON.stringify(p)}`).join(",\n");
  const states = Object.entries(statePop).filter(([k]) => STATES.some(s => s.name === k) || k === DC).sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${v}`).join(",\n");
  writeFileSync(new URL("../src/data/us.gen.ts", import.meta.url),
    `/* Generated by scripts/build-us.ts on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.
   Sources: US Census Bureau Vintage 2024 population estimates (July 2024) and 2024 Gazetteer place locations.
   ${EXTRA.map(x => `${x.name}: ${x.source}.`).join(" ")} */

export interface UsCity { name: string; state: string; pop: number; ll: [number, number] }

/** Every city of ${MIN_POP.toLocaleString("en-US")} or more, plus each state's capital and largest city. Largest first. */
export const US_CITIES: UsCity[] = [
${body}
];

/** State populations, July 2024. */
export const STATE_POP: Record<string, number> = {
${states}
};
`);
  console.log(`${list.length} cities; ${Object.keys(statePop).length} states`);
}

void main();
