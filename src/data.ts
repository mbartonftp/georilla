/* Georilla content: countries, prompts and answer matching. Edit freely.

   Country rows: name | continents | capital(s) | fame 1-5 | tags | aliases
   tags: L landlocked, I no land borders (islands), E equator, M Mediterranean coast, C Caribbean island,
   B Baltic coast, R Red Sea coast, P Pacific coast in the Americas, A Andes, D Danube, S Spanish official,
   O Portuguese official, U uses the euro, T Tropic of Cancer, K Tropic of Capricorn, X Caspian coast */
const RAW = `Afghanistan|AS|Kabul|4|L|
Albania|EU|Tirana|3|M|
Algeria|AF|Algiers|3|MT|
Andorra|EU|Andorra la Vella|2|LU|
Angola|AF|Luanda|3|O|
Antigua and Barbuda|NA|St. John's|1|IC|Antigua
Argentina|SA|Buenos Aires|5|SAK|
Armenia|AS,EU|Yerevan|3|L|
Australia|OC|Canberra|5|IK|
Austria|EU|Vienna|4|LDU|
Azerbaijan|AS,EU|Baku|3|LX|
Bahamas|NA|Nassau|3|ICT|The Bahamas
Bahrain|AS|Manama|2|I|
Bangladesh|AS|Dhaka|3|T|
Barbados|NA|Bridgetown|2|IC|
Belarus|EU|Minsk|3|L|
Belgium|EU|Brussels|4|U|
Belize|NA|Belmopan|2||
Benin|AF|Porto-Novo|1||
Bhutan|AS|Thimphu|2|L|
Bolivia|SA|Sucre;La Paz|3|LSA|
Bosnia and Herzegovina|EU|Sarajevo|2|M|Bosnia;Bosnia-Herzegovina
Botswana|AF|Gaborone|2|LK|
Brazil|SA|Brasília|5|EOK|
Brunei|AS|Bandar Seri Begawan|1||
Bulgaria|EU|Sofia|3|DU|
Burkina Faso|AF|Ouagadougou|2|L|
Burundi|AF|Gitega;Bujumbura|1|L|
Cambodia|AS|Phnom Penh|3||
Cameroon|AF|Yaoundé|2||
Canada|NA|Ottawa|5|P|
Cape Verde|AF|Praia|1|IO|Cabo Verde
Central African Republic|AF|Bangui|1|L|CAR
Chad|AF|N'Djamena|2|L|
Chile|SA|Santiago|4|SPAK|
China|AS|Beijing|5|T|PRC
Colombia|SA|Bogotá|4|ESPA|
Comoros|AF|Moroni|1|I|
Congo|AF|Brazzaville|1|E|Republic of the Congo;Republic of Congo;Congo-Brazzaville
Costa Rica|NA|San José|3|SP|
Croatia|EU|Zagreb|3|MDU|
Cuba|NA|Havana|4|ICS|
Cyprus|EU,AS|Nicosia|3|IMU|
Czechia|EU|Prague|3|L|Czech Republic
DR Congo|AF|Kinshasa|2|E|Democratic Republic of the Congo;Democratic Republic of Congo;DRC;Congo-Kinshasa;Zaire
Denmark|EU|Copenhagen|4|B|
Djibouti|AF|Djibouti|1|R|
Dominica|NA|Roseau|1|IC|
Dominican Republic|NA|Santo Domingo|3|CS|
East Timor|AS|Dili|1|O|Timor-Leste
Ecuador|SA|Quito|3|ESPA|
Egypt|AF|Cairo|5|MRT|
El Salvador|NA|San Salvador|2|SP|
Equatorial Guinea|AF|Malabo|1|SO|
Eritrea|AF|Asmara|1|R|
Estonia|EU|Tallinn|2|BU|
Eswatini|AF|Mbabane;Lobamba|1|L|Swaziland
Ethiopia|AF|Addis Ababa|3|L|
Fiji|OC|Suva|2|I|
Finland|EU|Helsinki|4|BU|
France|EU|Paris|5|MU|
Gabon|AF|Libreville|1|E|
Gambia|AF|Banjul|1||The Gambia
Georgia|AS,EU|Tbilisi|3||
Germany|EU|Berlin|5|BDU|
Ghana|AF|Accra|3||
Greece|EU|Athens|5|MU|
Grenada|NA|St. George's|1|IC|
Guatemala|NA|Guatemala City|2|SP|
Guinea|AF|Conakry|1||
Guinea-Bissau|AF|Bissau|1|O|Guinea Bissau
Guyana|SA|Georgetown|2||
Haiti|NA|Port-au-Prince|3|C|
Honduras|NA|Tegucigalpa|2|SP|
Hungary|EU|Budapest|4|LD|
Iceland|EU|Reykjavík|4|I|
India|AS|New Delhi|5|T|
Indonesia|AS|Jakarta|4|E|
Iran|AS|Tehran|4|X|
Iraq|AS|Baghdad|4||
Ireland|EU|Dublin|4|U|Republic of Ireland;Eire
Israel|AS|Jerusalem|4|MR|
Italy|EU|Rome|5|MU|
Ivory Coast|AF|Yamoussoukro|2||Côte d'Ivoire;Cote d'Ivoire
Jamaica|NA|Kingston|4|IC|
Japan|AS|Tokyo|5|I|
Jordan|AS|Amman|3|R|
Kazakhstan|AS,EU|Astana|3|LX|
Kenya|AF|Nairobi|4|E|
Kiribati|OC|Tarawa;South Tarawa|1|IE|
Kuwait|AS|Kuwait City|3||
Kyrgyzstan|AS|Bishkek|2|L|
Laos|AS|Vientiane|2|L|
Latvia|EU|Riga|2|BU|
Lebanon|AS|Beirut|3|M|
Lesotho|AF|Maseru|1|L|
Liberia|AF|Monrovia|2||
Libya|AF|Tripoli|3|MT|
Liechtenstein|EU|Vaduz|2|L|
Lithuania|EU|Vilnius|2|BU|
Luxembourg|EU|Luxembourg|3|LU|
Madagascar|AF|Antananarivo|3|IK|
Malawi|AF|Lilongwe|2|L|
Malaysia|AS|Kuala Lumpur|3||
Maldives|AS|Malé|2|IE|
Mali|AF|Bamako|2|LT|
Malta|EU|Valletta|3|IMU|
Marshall Islands|OC|Majuro|1|I|
Mauritania|AF|Nouakchott|1|T|
Mauritius|AF|Port Louis|2|I|
Mexico|NA|Mexico City|5|SPT|
Micronesia|OC|Palikir|1|I|Federated States of Micronesia
Moldova|EU|Chișinău|2|LD|
Monaco|EU|Monaco|3|MU|
Mongolia|AS|Ulaanbaatar|3|L|
Montenegro|EU|Podgorica|2|MU|
Morocco|AF|Rabat|4|M|
Mozambique|AF|Maputo|2|OK|
Myanmar|AS|Naypyidaw|3|T|Burma
Namibia|AF|Windhoek|2|K|
Nauru|OC|Yaren|1|I|
Nepal|AS|Kathmandu|3|L|
Netherlands|EU|Amsterdam|4|U|Holland;The Netherlands
New Zealand|OC|Wellington|5|I|
Nicaragua|NA|Managua|2|SP|
Niger|AF|Niamey|2|LT|
Nigeria|AF|Abuja|4||
North Korea|AS|Pyongyang|4||DPRK
North Macedonia|EU|Skopje|2|L|Macedonia
Norway|EU|Oslo|4||
Oman|AS|Muscat|2|T|
Pakistan|AS|Islamabad|4||
Palau|OC|Ngerulmud|1|I|
Panama|NA|Panama City|3|SP|
Papua New Guinea|OC|Port Moresby|2||PNG
Paraguay|SA|Asunción|2|LSK|
Peru|SA|Lima|4|SPA|
Philippines|AS|Manila|4|I|
Poland|EU|Warsaw|4|B|
Portugal|EU|Lisbon|4|OU|
Qatar|AS|Doha|3||
Romania|EU|Bucharest|3|D|
Russia|EU,AS|Moscow|5|BX|Russian Federation
Rwanda|AF|Kigali|2|L|
Saint Kitts and Nevis|NA|Basseterre|1|IC|St Kitts;Saint Kitts
Saint Lucia|NA|Castries|1|IC|
Saint Vincent and the Grenadines|NA|Kingstown|1|IC|Saint Vincent
Samoa|OC|Apia|1|I|
San Marino|EU|San Marino|2|LU|
São Tomé and Príncipe|AF|São Tomé|1|IEO|Sao Tome
Saudi Arabia|AS|Riyadh|4|RT|
Senegal|AF|Dakar|2||
Serbia|EU|Belgrade|3|LD|
Seychelles|AF|Victoria|2|I|
Sierra Leone|AF|Freetown|2||
Singapore|AS|Singapore|4|I|
Slovakia|EU|Bratislava|2|LDU|
Slovenia|EU|Ljubljana|2|MU|
Solomon Islands|OC|Honiara|1|I|
Somalia|AF|Mogadishu|3|E|
South Africa|AF|Pretoria;Cape Town;Bloemfontein|5|K|
South Korea|AS|Seoul|5||Korea;Republic of Korea
South Sudan|AF|Juba|2|L|
Spain|EU|Madrid|5|MSU|
Sri Lanka|AS|Sri Jayawardenepura Kotte;Colombo|3|I|
Sudan|AF|Khartoum|3|R|
Suriname|SA|Paramaribo|1||
Sweden|EU|Stockholm|4|B|
Switzerland|EU|Bern|4|L|
Syria|AS|Damascus|4|M|
Taiwan|AS|Taipei|4|IT|
Tajikistan|AS|Dushanbe|2|L|
Tanzania|AF|Dodoma|3||
Thailand|AS|Bangkok|4||
Togo|AF|Lomé|1||
Tonga|OC|Nukuʻalofa|1|I|
Trinidad and Tobago|NA|Port of Spain|2|IC|Trinidad
Tunisia|AF|Tunis|3|M|
Turkey|AS,EU|Ankara|5|M|Türkiye;Turkiye
Turkmenistan|AS|Ashgabat|2|LX|
Tuvalu|OC|Funafuti|1|I|
Uganda|AF|Kampala|3|LE|
Ukraine|EU|Kyiv|4|D|
United Arab Emirates|AS|Abu Dhabi|4|T|UAE;Emirates
United Kingdom|EU|London|5||UK;Britain;Great Britain
United States|NA|Washington, D.C.|5|P|USA;US;America;United States of America
Uruguay|SA|Montevideo|3|S|
Uzbekistan|AS|Tashkent|2|L|
Vanuatu|OC|Port Vila|1|I|
Vatican City|EU|Vatican City|3|LU|Vatican;Holy See
Venezuela|SA|Caracas|4|SA|
Vietnam|AS|Hanoi|4||Viet Nam
Yemen|AS|Sanaa|3|R|
Zambia|AF|Lusaka|2|L|
Zimbabwe|AF|Harare|3|L|`;

export const BORDERS: Record<string, string[]> = {
  "China": ["Afghanistan","Bhutan","India","Kazakhstan","North Korea","Kyrgyzstan","Laos","Mongolia","Myanmar","Nepal","Pakistan","Russia","Tajikistan","Vietnam"],
  "Russia": ["Norway","Finland","Estonia","Latvia","Lithuania","Poland","Belarus","Ukraine","Georgia","Azerbaijan","Kazakhstan","China","Mongolia","North Korea"],
  "Brazil": ["Argentina","Bolivia","Colombia","France","Guyana","Paraguay","Peru","Suriname","Uruguay","Venezuela"],
  "Germany": ["Denmark","Poland","Czechia","Austria","Switzerland","France","Luxembourg","Belgium","Netherlands"],
  "France": ["Belgium","Luxembourg","Germany","Switzerland","Italy","Monaco","Andorra","Spain","Brazil","Suriname","Netherlands"],
  "DR Congo": ["Angola","Zambia","Tanzania","Burundi","Rwanda","Uganda","South Sudan","Central African Republic","Congo"],
  "Tanzania": ["Kenya","Uganda","Rwanda","Burundi","DR Congo","Zambia","Malawi","Mozambique"],
  "Austria": ["Germany","Czechia","Slovakia","Hungary","Slovenia","Italy","Switzerland","Liechtenstein"],
  "Turkey": ["Greece","Bulgaria","Georgia","Armenia","Azerbaijan","Iran","Iraq","Syria"],
  "Saudi Arabia": ["Jordan","Iraq","Kuwait","Qatar","United Arab Emirates","Oman","Yemen"],
  "Argentina": ["Chile","Bolivia","Paraguay","Brazil","Uruguay"],
  "India": ["Pakistan","China","Nepal","Bhutan","Bangladesh","Myanmar"],
  "Sudan": ["Egypt","Libya","Chad","Central African Republic","South Sudan","Ethiopia","Eritrea"],
  "Hungary": ["Austria","Slovakia","Ukraine","Romania","Serbia","Croatia","Slovenia"],
  "Niger": ["Algeria","Libya","Chad","Nigeria","Benin","Burkina Faso","Mali"],
  "Zambia": ["DR Congo","Tanzania","Malawi","Mozambique","Zimbabwe","Botswana","Namibia","Angola"],
  "Iran": ["Iraq","Turkey","Armenia","Azerbaijan","Turkmenistan","Afghanistan","Pakistan"],
  "Ukraine": ["Russia","Belarus","Poland","Slovakia","Hungary","Romania","Moldova"]
};

export type ContinentCode = "AF" | "AS" | "EU" | "NA" | "SA" | "OC";
export type CustomSet = "canadaStates" | "provinces" | "ausStates";

export interface Country {
  name: string;
  cont: ContinentCode[];
  caps: string[];
  fame: number;
  tags: string;
  aliases: string[];
}

export interface Prompt {
  id: string;
  q: string;
  note?: string;
  f?: (c: Country) => boolean;
  capital?: boolean;
  custom?: CustomSet;
  parent?: string;
  boost?: string[];
}

export interface Answer {
  label: string;
  /** country this answer sits in, for the globe */
  country?: string;
  /** for capital answers: the country it is the capital of */
  sub?: string;
  fame: number;
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

const CAPITAL_ALIASES: Record<string, string[]> = {
  "Kyiv": ["Kiev"], "Washington, D.C.": ["Washington", "Washington DC"], "Ulaanbaatar": ["Ulan Bator"],
  "Naypyidaw": ["Nay Pyi Taw", "Naypyitaw"], "Sanaa": ["Sana'a"], "Astana": ["Nur-Sultan"], "Malé": ["Male"], "Chișinău": ["Chisinau"],
  "Nukuʻalofa": ["Nukualofa"], "Port of Spain": ["Port-of-Spain"], "N'Djamena": ["Ndjamena"]
};

export const COUNTRIES: Country[] = RAW.split("\n").map(l => {
  const [name, cont, caps, fame, tags, al] = l.split("|");
  return { name, cont: cont.split(",") as ContinentCode[], caps: caps.split(";"), fame: +fame, tags: tags || "", aliases: al ? al.split(";") : [] };
});

type CustomRow = [name: string, fame: number, aliases?: string[]];
export const CUSTOM: Record<CustomSet, CustomRow[]> = {
  canadaStates: [["New York",5],["Washington",4,["Washington State"]],["Michigan",4],["Maine",4],["Alaska",4],["Montana",3],["Minnesota",3],["Vermont",3],["North Dakota",3],["Idaho",2],["New Hampshire",2],["Ohio",1],["Pennsylvania",1]],
  provinces: [["Ontario",5],["Quebec",5,["Québec"]],["British Columbia",5,["BC"]],["Alberta",4],["Nova Scotia",3],["Manitoba",3],["Saskatchewan",3],["Newfoundland and Labrador",3,["Newfoundland","Labrador"]],["Yukon",3],["New Brunswick",2],["Prince Edward Island",2,["PEI"]],["Northwest Territories",2,["NWT"]],["Nunavut",2]],
  ausStates: [["New South Wales",5,["NSW"]],["Victoria",4],["Queensland",4],["Western Australia",3,["WA"]],["South Australia",3,["SA"]],["Tasmania",3],["Northern Territory",2,["NT"]],["Australian Capital Territory",1,["ACT"]]]
};
const CUSTOM_PARENT: Record<CustomSet, string> = { canadaStates: "United States", provinces: "Canada", ausStates: "Australia" };

const CONT: Record<ContinentCode, string> = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
const has = (t: string) => (c: Country) => c.tags.includes(t);

export const P: Prompt[] = [];
for (const k of ["AF", "AS", "EU", "SA", "OC", "NA"] as ContinentCode[])
  P.push({ id: "cont-" + k, q: `Name a country in ${CONT[k]}`, note: k === "NA" ? "Central America and the Caribbean count." : "", f: c => c.cont.includes(k) });
for (const k of ["EU", "AF", "SA"] as ContinentCode[])
  P.push({ id: "cap-" + k, q: `Name a capital city in ${CONT[k]}`, f: c => c.cont.includes(k), capital: true });
P.push(
  { id: "L", q: "Name a landlocked country", f: has("L") },
  { id: "I", q: "Name a country with no land borders", note: "Island nations, basically.", f: has("I") },
  { id: "E", q: "Name a country the equator passes through", f: has("E") },
  { id: "M", q: "Name a country with a Mediterranean coastline", f: has("M") },
  { id: "C", q: "Name a Caribbean island country", note: "The Bahamas counts.", f: has("C") },
  { id: "B", q: "Name a country on the Baltic Sea", f: has("B") },
  { id: "R", q: "Name a country with a Red Sea coastline", f: has("R") },
  { id: "P", q: "Name a country in the Americas with a Pacific coastline", f: has("P") },
  { id: "A", q: "Name a country the Andes run through", f: has("A") },
  { id: "D", q: "Name a country the Danube flows through", note: "Bordering the river counts.", f: has("D") },
  { id: "S", q: "Name a country where Spanish is an official language", f: has("S") },
  { id: "O", q: "Name a country where Portuguese is an official language", f: has("O") },
  { id: "U", q: "Name a country that uses the euro", f: has("U") },
  { id: "T", q: "Name a country the Tropic of Cancer crosses", f: has("T") },
  { id: "K", q: "Name a country the Tropic of Capricorn crosses", f: has("K") },
  { id: "X", q: "Name a country on the Caspian Sea", f: has("X") },
  { id: "stan", q: "Name a country ending in “-stan”", f: c => c.name.endsWith("stan") },
  { id: "land", q: "Name a country ending in “-land”", f: c => c.name.endsWith("land") },
  { id: "ia", q: "Name a country ending in “-ia”", f: c => c.name.endsWith("ia") }
);
for (const L of ["B", "S", "M", "C", "G", "N", "P", "T", "A", "L", "K"])
  P.push({ id: "letter-" + L, q: `Name a country starting with “${L}”`, f: c => c.name[0] === L });
const BOOSTS: Record<string, string[]> = { France: ["Brazil", "Suriname", "Netherlands"], Brazil: ["France"] };
for (const k of Object.keys(BORDERS))
  P.push({ id: "border-" + k, q: `Name a country that borders ${k === "DR Congo" ? "the DR Congo" : k}`,
    note: k in BOOSTS ? "Overseas territories count." : "", f: c => BORDERS[k].includes(c.name), boost: BOOSTS[k] });
P.push(
  { id: "us-canada", q: "Name a US state that borders Canada", note: "Water borders on the Great Lakes count.", custom: "canadaStates", parent: CUSTOM_PARENT.canadaStates },
  { id: "provinces", q: "Name a Canadian province or territory", custom: "provinces", parent: CUSTOM_PARENT.provinces },
  { id: "aus", q: "Name an Australian state or territory", custom: "ausStates", parent: CUSTOM_PARENT.ausStates }
);

/** Lower-case, strip accents and punctuation, and even out "St"/"Saint", "the" and "and". */
export const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ʻ|'|’|\./g, "")
  .replace(/[^a-z0-9]+/g, " ").trim().replace(/^the /, "").replace(/^st /, "saint ").replace(/ and /g, " ");

/** Every right answer for a prompt, each tagged with a tier by its fame rank within the set. */
export function answersFor(p: Prompt): Answer[] {
  let items: Omit<Answer, "tier" | "nkeys">[];
  if (p.custom) items = CUSTOM[p.custom].map(([n, f, al]) => ({ label: n, fame: f, keys: [n, ...(al || [])], country: p.parent }));
  else items = COUNTRIES.filter(p.f!).map(c => p.capital
    ? { label: c.caps[0], sub: c.name, country: c.name, fame: c.fame, keys: c.caps.flatMap(x => [x, ...(CAPITAL_ALIASES[x] || [])]) }
    : { label: c.name, country: c.name, fame: c.fame, keys: [c.name, ...c.aliases] });
  items.sort((a, b) => b.fame - a.fame || a.label.localeCompare(b.label));
  const n = items.length, out: Answer[] = items.map(it => ({ ...it, tier: 0, nkeys: it.keys.map(norm) }));
  // tie groups share the average rank, so equally famous answers get the same tier
  let i = 0;
  while (i < n) {
    let j = i; while (j < n && out[j].fame === out[i].fame) j++;
    const avg = (i + j - 1) / 2, pct = n > 1 ? avg / (n - 1) : 0;
    for (let k = i; k < j; k++) out[k].tier = Math.min(4, Math.floor(pct * 5));
    i = j;
  }
  (p.boost || []).forEach(b => { const it = out.find(x => x.label === b); if (it) it.tier = 4; });
  return out;
}

// every known name, to tell "wrong answer" from "not recognised"
const KNOWN = new Map<string, string>();
COUNTRIES.forEach(c => { [c.name, ...c.aliases].forEach(k => KNOWN.set(norm(k), c.name)); c.caps.forEach(k => KNOWN.set(norm(k), k)); });
Object.values(CUSTOM).flat().forEach(([n, , al]) => [n, ...(al || [])].forEach(k => KNOWN.set(norm(k), n)));
Object.entries(CAPITAL_ALIASES).forEach(([cap, al]) => al.forEach(a => KNOWN.set(norm(a), cap)));

/** Which country a known place sits in, so the globe can point at a wrong answer. */
export const PLACE_COUNTRY: Record<string, string> = {};
COUNTRIES.forEach(c => { PLACE_COUNTRY[c.name] = c.name; c.caps.forEach(k => PLACE_COUNTRY[k] = c.name); });
(Object.keys(CUSTOM) as CustomSet[]).forEach(set => CUSTOM[set].forEach(([n]) => PLACE_COUNTRY[n] = CUSTOM_PARENT[set]));

export interface NameEntry { n: string; k: string; alts: string[] }
/** Every display name, for the type-ahead list. It lists all places, so it gives nothing away. */
export const ALL_NAMES: NameEntry[] = [...new Set([...COUNTRIES.map(c => c.name), ...COUNTRIES.flatMap(c => c.caps), ...Object.values(CUSTOM).flat().map(x => x[0])])]
  .map(n => ({ n, k: norm(n), alts: (COUNTRIES.find(c => c.name === n)?.aliases || []).map(norm) }));

/** A short label for the kind of prompt, shown as a chip above it. */
export function category(p: Prompt): string {
  const id = p.id, one = id.length === 1;
  if (id.startsWith("cont-")) return "Continents";
  if (id.startsWith("cap-")) return "Capitals";
  if (id.startsWith("border-")) return "Neighbours";
  if (id.startsWith("letter-") || ["stan", "land", "ia"].includes(id)) return "Wordplay";
  if (one && "MBRXC".includes(id)) return "Coasts & seas";
  if (one && "ETK".includes(id)) return "Lines on the map";
  if (one && "LI".includes(id)) return "Land & islands";
  if (one && "SOU".includes(id)) return "Language & money";
  if (one && "AD".includes(id)) return "Rivers & ranges";
  return "States & provinces";
}

export function lev(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Check a typed guess against a prompt's answers. */
export function judge(items: Answer[], raw: string): Judgement {
  const g = norm(raw); if (!g) return { kind: "empty" };
  const hit = items.find(it => it.nkeys.includes(g));
  if (hit) return { kind: "ok", item: hit };
  if (KNOWN.has(g)) return { kind: "wrong", name: KNOWN.get(g)! };
  // forgive small typos on longer names, only when the closest real name is unambiguous; the player confirms it
  const tol = g.length >= 10 ? 2 : g.length >= 7 ? 1 : 0;
  if (tol) {
    let best = tol + 1, near = new Set<string>();
    for (const [k, v] of KNOWN) { const d = lev(k, g); if (d < best) { best = d; near = new Set([v]); } else if (d === best) near.add(v); }
    if (best <= tol && near.size === 1) {
      const v = [...near][0], nv = norm(v);
      return { kind: "typo", name: v, item: items.find(it => it.nkeys.includes(nv) || it.label === v || it.sub === v) || null };
    }
  }
  return { kind: "unknown" };
}
