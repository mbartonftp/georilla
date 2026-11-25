/* Hand-checked facts for the USA game: the 50 states, their capitals and neighbours, and the national parks.
   City populations and locations come from the US Census Bureau, via scripts/build-us.ts into us.gen.ts. */
import type { LonLat } from "./types";

export type CensusRegion = "Northeast" | "Midwest" | "South" | "West";

export interface UsState {
  name: string;
  abbr: string;
  capital: string;
  /** year it joined the Union (ratified the Constitution, for the original thirteen) */
  admitted: number;
  region: CensusRegion;
  /** neighbours on land, by abbreviation */
  land: string[];
  /** neighbours across a lake or river mouth only (Michigan and Illinois meet in Lake Michigan) */
  water: string[];
}

const REGION: Record<string, CensusRegion> = { NE: "Northeast", MW: "Midwest", S: "South", W: "West" };

/* name | abbr | capital | admitted | Census region | land neighbours | water-only neighbours */
const ROWS = `
Alabama|AL|Montgomery|1819|S|FL,GA,MS,TN|
Alaska|AK|Juneau|1959|W||
Arizona|AZ|Phoenix|1912|W|CA,NV,UT,NM|
Arkansas|AR|Little Rock|1836|S|LA,MS,MO,OK,TN,TX|
California|CA|Sacramento|1850|W|AZ,NV,OR|
Colorado|CO|Denver|1876|W|KS,NE,NM,OK,UT,WY|
Connecticut|CT|Hartford|1788|NE|MA,NY,RI|
Delaware|DE|Dover|1787|S|MD,NJ,PA|
Florida|FL|Tallahassee|1845|S|AL,GA|
Georgia|GA|Atlanta|1788|S|AL,FL,NC,SC,TN|
Hawaii|HI|Honolulu|1959|W||
Idaho|ID|Boise|1890|W|MT,NV,OR,UT,WA,WY|
Illinois|IL|Springfield|1818|MW|IN,IA,KY,MO,WI|MI
Indiana|IN|Indianapolis|1816|MW|IL,KY,MI,OH|
Iowa|IA|Des Moines|1846|MW|IL,MN,MO,NE,SD,WI|
Kansas|KS|Topeka|1861|MW|CO,MO,NE,OK|
Kentucky|KY|Frankfort|1792|S|IL,IN,MO,OH,TN,VA,WV|
Louisiana|LA|Baton Rouge|1812|S|AR,MS,TX|
Maine|ME|Augusta|1820|NE|NH|
Maryland|MD|Annapolis|1788|S|DE,PA,VA,WV|
Massachusetts|MA|Boston|1788|NE|CT,NH,NY,RI,VT|
Michigan|MI|Lansing|1837|MW|IN,OH,WI|IL,MN
Minnesota|MN|St. Paul|1858|MW|IA,ND,SD,WI|MI
Mississippi|MS|Jackson|1817|S|AL,AR,LA,TN|
Missouri|MO|Jefferson City|1821|MW|AR,IL,IA,KS,KY,NE,OK,TN|
Montana|MT|Helena|1889|W|ID,ND,SD,WY|
Nebraska|NE|Lincoln|1867|MW|CO,IA,KS,MO,SD,WY|
Nevada|NV|Carson City|1864|W|AZ,CA,ID,OR,UT|
New Hampshire|NH|Concord|1788|NE|ME,MA,VT|
New Jersey|NJ|Trenton|1787|NE|DE,NY,PA|
New Mexico|NM|Santa Fe|1912|W|AZ,CO,OK,TX|
New York|NY|Albany|1788|NE|CT,MA,NJ,PA,VT|RI
North Carolina|NC|Raleigh|1789|S|GA,SC,TN,VA|
North Dakota|ND|Bismarck|1889|MW|MN,MT,SD|
Ohio|OH|Columbus|1803|MW|IN,KY,MI,PA,WV|
Oklahoma|OK|Oklahoma City|1907|S|AR,CO,KS,MO,NM,TX|
Oregon|OR|Salem|1859|W|CA,ID,NV,WA|
Pennsylvania|PA|Harrisburg|1787|NE|DE,MD,NJ,NY,OH,WV|
Rhode Island|RI|Providence|1790|NE|CT,MA|NY
South Carolina|SC|Columbia|1788|S|GA,NC|
South Dakota|SD|Pierre|1889|MW|IA,MN,MT,NE,ND,WY|
Tennessee|TN|Nashville|1796|S|AL,AR,GA,KY,MS,MO,NC,VA|
Texas|TX|Austin|1845|S|AR,LA,NM,OK|
Utah|UT|Salt Lake City|1896|W|AZ,CO,ID,NV,WY|
Vermont|VT|Montpelier|1791|NE|MA,NH,NY|
Virginia|VA|Richmond|1788|S|KY,MD,NC,TN,WV|
Washington|WA|Olympia|1889|W|ID,OR|
West Virginia|WV|Charleston|1863|S|KY,MD,OH,PA,VA|
Wisconsin|WI|Madison|1848|MW|IL,IA,MI,MN|
Wyoming|WY|Cheyenne|1890|W|CO,ID,MT,NE,SD,UT|`;

const split = (s: string) => (s ? s.split(",").map(x => x.trim()) : []);
export const STATES: UsState[] = ROWS.trim().split("\n").map(line => {
  const [name, abbr, capital, admitted, region, land, water] = line.split("|");
  return { name, abbr, capital, admitted: +admitted, region: REGION[region], land: split(land), water: split(water) };
});
export const STATE = new Map(STATES.map(s => [s.name, s]));
export const STATE_BY_ABBR = new Map(STATES.map(s => [s.abbr, s]));
/** "Washington, D.C." isn't a state, but its city is one of the biggest */
export const DC = "District of Columbia";

/** Total area (land and water), largest first, from the Census Bureau. */
export const LARGEST_BY_AREA = split("Alaska, Texas, California, Montana, New Mexico, Arizona, Nevada, Colorado, Wyoming, Oregon");
export const SMALLEST_BY_AREA = split("Rhode Island, Delaware, Connecticut, New Jersey, New Hampshire, Vermont, Massachusetts, Hawaii, Maryland, West Virginia");

export interface Park {
  name: string;
  wiki: string;
  /** states (or territories) it lies in, by abbreviation; the first is where the map points */
  states: string[];
  ll: LonLat;
  aliases: string[];
}

/* The 63 national parks. name | Wikipedia title | states | longitude, latitude | aliases */
const PARK_ROWS = `
Acadia|Acadia National Park|ME|-68.21,44.35|
American Samoa|National Park of American Samoa|AS|-170.68,-14.25|National Park of American Samoa
Arches|Arches National Park|UT|-109.59,38.73|
Badlands|Badlands National Park|SD|-102.34,43.75|
Big Bend|Big Bend National Park|TX|-103.25,29.25|
Biscayne|Biscayne National Park|FL|-80.21,25.49|
Black Canyon of the Gunnison|Black Canyon of the Gunnison National Park|CO|-107.72,38.57|Black Canyon
Bryce Canyon|Bryce Canyon National Park|UT|-112.18,37.59|Bryce
Canyonlands|Canyonlands National Park|UT|-109.93,38.2|
Capitol Reef|Capitol Reef National Park|UT|-111.17,38.37|
Carlsbad Caverns|Carlsbad Caverns National Park|NM|-104.44,32.17|Carlsbad
Channel Islands|Channel Islands National Park|CA|-119.42,34.01|
Congaree|Congaree National Park|SC|-80.78,33.78|
Crater Lake|Crater Lake National Park|OR|-122.13,42.94|
Cuyahoga Valley|Cuyahoga Valley National Park|OH|-81.55,41.24|Cuyahoga
Death Valley|Death Valley National Park|CA,NV|-116.82,36.5|
Denali|Denali National Park and Preserve|AK|-151.19,63.33|Mount McKinley
Dry Tortugas|Dry Tortugas National Park|FL|-82.87,24.63|
Everglades|Everglades National Park|FL|-80.9,25.32|
Gates of the Arctic|Gates of the Arctic National Park and Preserve|AK|-153.3,67.78|
Gateway Arch|Gateway Arch National Park|MO|-90.19,38.62|St. Louis Arch
Glacier|Glacier National Park (U.S.)|MT|-113.79,48.7|
Glacier Bay|Glacier Bay National Park and Preserve|AK|-136.9,58.5|
Grand Canyon|Grand Canyon National Park|AZ|-112.14,36.06|
Grand Teton|Grand Teton National Park|WY|-110.8,43.73|Grand Tetons,Tetons
Great Basin|Great Basin National Park|NV|-114.26,38.98|
Great Sand Dunes|Great Sand Dunes National Park and Preserve|CO|-105.51,37.73|
Great Smoky Mountains|Great Smoky Mountains National Park|TN,NC|-83.53,35.68|Smoky Mountains,Great Smokies,Smokies,Smoky Mountain
Guadalupe Mountains|Guadalupe Mountains National Park|TX|-104.87,31.92|
Haleakalā|Haleakalā National Park|HI|-156.17,20.72|
Hawaiʻi Volcanoes|Hawaiʻi Volcanoes National Park|HI|-155.2,19.38|Hawaii Volcanoes,Volcanoes
Hot Springs|Hot Springs National Park|AR|-93.05,34.52|
Indiana Dunes|Indiana Dunes National Park|IN|-87.05,41.65|
Isle Royale|Isle Royale National Park|MI|-88.55,48.1|
Joshua Tree|Joshua Tree National Park|CA|-115.9,33.79|
Katmai|Katmai National Park and Preserve|AK|-155.06,58.5|
Kenai Fjords|Kenai Fjords National Park|AK|-149.65,59.92|
Kings Canyon|Kings Canyon National Park|CA|-118.55,36.8|
Kobuk Valley|Kobuk Valley National Park|AK|-159.28,67.55|
Lake Clark|Lake Clark National Park and Preserve|AK|-153.42,60.97|
Lassen Volcanic|Lassen Volcanic National Park|CA|-121.51,40.49|Lassen
Mammoth Cave|Mammoth Cave National Park|KY|-86.1,37.18|
Mesa Verde|Mesa Verde National Park|CO|-108.46,37.18|
Mount Rainier|Mount Rainier National Park|WA|-121.75,46.85|Rainier,Mt Rainier
New River Gorge|New River Gorge National Park and Preserve|WV|-81.08,38.07|
North Cascades|North Cascades National Park|WA|-121.2,48.7|
Olympic|Olympic National Park|WA|-123.5,47.97|
Petrified Forest|Petrified Forest National Park|AZ|-109.78,35.07|
Pinnacles|Pinnacles National Park|CA|-121.18,36.48|
Redwood|Redwood National and State Parks|CA|-124.0,41.3|Redwoods
Rocky Mountain|Rocky Mountain National Park|CO|-105.58,40.4|Rocky Mountains,Rockies
Saguaro|Saguaro National Park|AZ|-110.5,32.25|
Sequoia|Sequoia National Park|CA|-118.57,36.43|
Shenandoah|Shenandoah National Park|VA|-78.35,38.53|
Theodore Roosevelt|Theodore Roosevelt National Park|ND|-103.45,46.97|
Virgin Islands|Virgin Islands National Park|VI|-64.73,18.33|
Voyageurs|Voyageurs National Park|MN|-92.88,48.5|
White Sands|White Sands National Park|NM|-106.17,32.78|
Wind Cave|Wind Cave National Park|SD|-103.48,43.57|
Wrangell–St. Elias|Wrangell–St. Elias National Park and Preserve|AK|-142.98,61.71|Wrangell St Elias,Wrangell
Yellowstone|Yellowstone National Park|WY,MT,ID|-110.5,44.6|
Yosemite|Yosemite National Park|CA|-119.54,37.87|
Zion|Zion National Park|UT|-113.03,37.3|`;

export const PARKS: Park[] = PARK_ROWS.trim().split("\n").map(line => {
  const [name, wiki, states, ll, aliases] = line.split("|");
  const [lon, lat] = ll.split(",").map(Number);
  return { name, wiki, states: split(states), ll: [lon, lat], aliases: split(aliases) };
});

/** Territories that hold a national park, as named on the map. */
export const TERRITORY: Record<string, string> = { AS: "American Samoa", VI: "United States Virgin Islands" };
export const areaOf = (abbr: string): string => STATE_BY_ABBR.get(abbr)?.name || TERRITORY[abbr] || abbr;

/** Nicknames and short forms people type for cities, keyed by "City, ST". */
export const CITY_ALIASES: Record<string, string[]> = {
  "New York, NY": ["New York City", "NYC", "NY", "Manhattan"],
  "Los Angeles, CA": ["LA", "L.A."],
  "Philadelphia, PA": ["Philly"],
  "San Francisco, CA": ["SF", "San Fran", "Frisco"],
  "Las Vegas, NV": ["Vegas"],
  "Washington, DC": ["Washington, D.C.", "Washington DC", "DC", "D.C."],
  "St. Louis, MO": ["Saint Louis"],
  "St. Paul, MN": ["Saint Paul"],
  "St. Petersburg, FL": ["Saint Petersburg", "St. Pete"],
  "Indianapolis, IN": ["Indy"],
  "Oklahoma City, OK": ["OKC"],
  "Salt Lake City, UT": ["Salt Lake", "SLC"],
  "New Orleans, LA": ["NOLA"],
  "Kansas City, MO": ["KC"],
  "Winston-Salem, NC": ["Winston Salem"],
  "Honolulu, HI": ["Urban Honolulu"],
  "Nashville, TN": ["Nashville-Davidson"],
  "Louisville, KY": ["Louisville-Jefferson County"],
  "Lexington, KY": ["Lexington-Fayette"],
  "Boise, ID": ["Boise City"],
  "Ventura, CA": ["San Buenaventura"]
};

/** English Wikipedia titles for cities whose article isn't "City, State". */
export const CITY_WIKI: Record<string, string> = {
  "New York, NY": "New York City", "Washington, DC": "Washington, D.C."
};

/** "Portland, OR": how cities are keyed, and one of the ways players can type them. */
export const cityKey = (name: string, state: string): string => `${name}, ${state === DC ? "DC" : STATE.get(state)?.abbr ?? state}`;
export const cityWiki = (name: string, state: string): string => CITY_WIKI[cityKey(name, state)] ?? `${name}, ${state}`;
