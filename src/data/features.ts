/* Hand-checked geography: which countries touch each sea, river, mountain range, line on the map and so on.
   Each list was checked against Wikipedia's article for the feature; tests/geometry.test.ts checks the
   lines of latitude and longitude against real map shapes. Use the display names from countries.ts. */
import type { Category } from "./types";

export interface Feature {
  id: string;
  q: string;
  note?: string;
  cat: Category;
  members: string[];
  /** right, but few would think of it here: always Silverback */
  trick?: string[];
}

const L = (s: string) => s.split(",").map(x => x.trim());

export const FEATURES: Feature[] = [
  // Coasts & seas
  { id: "sea-mediterranean", cat: "Coasts & seas", q: "Name a country with a Mediterranean coastline",
    members: L("Spain, France, Monaco, Italy, Malta, Slovenia, Croatia, Bosnia and Herzegovina, Montenegro, Albania, Greece, Turkey, Cyprus, Syria, Lebanon, Israel, Palestine, Egypt, Libya, Tunisia, Algeria, Morocco"),
    trick: L("Bosnia and Herzegovina, Slovenia") },
  { id: "sea-baltic", cat: "Coasts & seas", q: "Name a country on the Baltic Sea",
    members: L("Sweden, Finland, Russia, Estonia, Latvia, Lithuania, Poland, Germany, Denmark") },
  { id: "sea-red", cat: "Coasts & seas", q: "Name a country with a Red Sea coastline", note: "The Gulf of Aqaba counts.",
    members: L("Egypt, Sudan, Eritrea, Djibouti, Saudi Arabia, Yemen, Jordan, Israel"), trick: L("Jordan, Israel") },
  { id: "sea-caspian", cat: "Coasts & seas", q: "Name a country on the Caspian Sea",
    members: L("Russia, Kazakhstan, Turkmenistan, Iran, Azerbaijan") },
  { id: "sea-black", cat: "Coasts & seas", q: "Name a country on the Black Sea",
    members: L("Turkey, Bulgaria, Romania, Ukraine, Russia, Georgia") },
  { id: "sea-persian-gulf", cat: "Coasts & seas", q: "Name a country on the Persian Gulf",
    members: L("Iran, Iraq, Kuwait, Saudi Arabia, Bahrain, Qatar, United Arab Emirates, Oman"), trick: L("Oman") },
  { id: "sea-north", cat: "Coasts & seas", q: "Name a country on the North Sea",
    members: L("United Kingdom, Norway, Denmark, Germany, Netherlands, Belgium, France") },
  { id: "sea-adriatic", cat: "Coasts & seas", q: "Name a country on the Adriatic Sea",
    members: L("Italy, Slovenia, Croatia, Bosnia and Herzegovina, Montenegro, Albania") },
  { id: "sea-south-china", cat: "Coasts & seas", q: "Name a country on the South China Sea", note: "The Gulf of Thailand counts.",
    members: L("China, Taiwan, Philippines, Malaysia, Brunei, Indonesia, Singapore, Vietnam, Cambodia, Thailand") },
  { id: "sea-arctic", cat: "Coasts & seas", q: "Name a country with an Arctic Ocean coastline", note: "Greenland counts for Denmark.",
    members: L("Russia, Canada, United States, Norway, Denmark, Iceland"), trick: L("Denmark") },
  { id: "sea-pacific-americas", cat: "Coasts & seas", q: "Name a country in the Americas with a Pacific coastline",
    members: L("Canada, United States, Mexico, Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica, Panama, Colombia, Ecuador, Peru, Chile"),
    trick: L("Honduras") },
  { id: "sea-atlantic-africa", cat: "Coasts & seas", q: "Name an African country with an Atlantic coastline", note: "Island nations count.",
    members: L("Morocco, Mauritania, Senegal, Gambia, Guinea-Bissau, Guinea, Sierra Leone, Liberia, Ivory Coast, Ghana, Togo, Benin, Nigeria, Cameroon, Equatorial Guinea, Gabon, Congo, DR Congo, Angola, Namibia, South Africa, Cape Verde, São Tomé and Príncipe"),
    trick: L("DR Congo") },
  { id: "sea-indian-africa", cat: "Coasts & seas", q: "Name an African country with an Indian Ocean coastline", note: "Island nations count; the Red Sea and Gulf of Aden don't.",
    members: L("South Africa, Mozambique, Tanzania, Kenya, Somalia, Madagascar, Mauritius, Seychelles, Comoros") },

  // Lines on the map
  { id: "line-equator", cat: "Lines on the map", q: "Name a country the equator passes through", note: "Territorial waters count.",
    members: L("Ecuador, Colombia, Brazil, São Tomé and Príncipe, Gabon, Congo, DR Congo, Uganda, Kenya, Somalia, Maldives, Indonesia, Kiribati"),
    trick: L("Maldives") },
  { id: "line-cancer", cat: "Lines on the map", q: "Name a country the Tropic of Cancer crosses",
    members: L("Mexico, Bahamas, Mauritania, Mali, Algeria, Niger, Chad, Libya, Egypt, Saudi Arabia, United Arab Emirates, Oman, India, Bangladesh, Myanmar, China, Taiwan"),
    // Chad's northern tip at Tibesti pokes about 1 km over the line; most lists leave it out, so it's a trick answer
    trick: L("Chad") },
  { id: "line-capricorn", cat: "Lines on the map", q: "Name a country the Tropic of Capricorn crosses",
    members: L("Chile, Argentina, Paraguay, Brazil, Namibia, Botswana, South Africa, Mozambique, Madagascar, Australia") },
  { id: "line-prime-meridian", cat: "Lines on the map", q: "Name a country the Prime Meridian passes through", note: "0° longitude, through Greenwich.",
    members: L("United Kingdom, France, Spain, Algeria, Mali, Burkina Faso, Togo, Ghana") },
  { id: "line-arctic-circle", cat: "Lines on the map", q: "Name a country the Arctic Circle crosses", note: "Greenland counts for Denmark, and Iceland's island of Grímsey counts.",
    members: L("Norway, Sweden, Finland, Russia, United States, Canada, Denmark, Iceland"), trick: L("Iceland") },

  // Rivers & ranges
  { id: "river-danube", cat: "Rivers & ranges", q: "Name a country the Danube flows through", note: "Bordering the river counts.",
    members: L("Germany, Austria, Slovakia, Hungary, Croatia, Serbia, Romania, Bulgaria, Moldova, Ukraine"), trick: L("Moldova") },
  { id: "river-rhine", cat: "Rivers & ranges", q: "Name a country the Rhine flows through", note: "Bordering the river counts.",
    members: L("Switzerland, Liechtenstein, Austria, Germany, France, Netherlands") },
  { id: "river-nile", cat: "Rivers & ranges", q: "Name a country in the Nile basin", note: "The eleven countries the Nile and its headwaters drain.",
    members: L("Egypt, Sudan, South Sudan, Ethiopia, Eritrea, Uganda, Kenya, Tanzania, Rwanda, Burundi, DR Congo") },
  { id: "river-niger", cat: "Rivers & ranges", q: "Name a country the Niger River flows through", note: "Bordering the river counts.",
    members: L("Guinea, Mali, Niger, Benin, Nigeria") },
  { id: "river-mekong", cat: "Rivers & ranges", q: "Name a country the Mekong flows through", note: "Bordering the river counts.",
    members: L("China, Myanmar, Laos, Thailand, Cambodia, Vietnam") },
  { id: "river-zambezi", cat: "Rivers & ranges", q: "Name a country the Zambezi flows through", note: "Bordering the river counts.",
    members: L("Zambia, Angola, Namibia, Botswana, Zimbabwe, Mozambique"), trick: L("Botswana") },
  { id: "range-andes", cat: "Rivers & ranges", q: "Name a country the Andes run through",
    members: L("Venezuela, Colombia, Ecuador, Peru, Bolivia, Chile, Argentina") },
  { id: "range-alps", cat: "Rivers & ranges", q: "Name a country the Alps run through",
    members: L("France, Monaco, Italy, Switzerland, Liechtenstein, Germany, Austria, Slovenia") },
  { id: "range-himalayas", cat: "Rivers & ranges", q: "Name a country the Himalayas run through",
    members: L("India, Nepal, Bhutan, China, Pakistan") },
  { id: "range-carpathians", cat: "Rivers & ranges", q: "Name a country the Carpathian Mountains run through",
    members: L("Czechia, Slovakia, Poland, Hungary, Ukraine, Romania, Serbia") },
  { id: "desert-sahara", cat: "Land & islands", q: "Name a country the Sahara covers part of",
    members: L("Morocco, Algeria, Tunisia, Libya, Egypt, Sudan, Chad, Niger, Mali, Mauritania") },
  { id: "forest-amazon", cat: "Land & islands", q: "Name a country with part of the Amazon rainforest", note: "French Guiana counts for France.",
    members: L("Brazil, Peru, Colombia, Venezuela, Ecuador, Bolivia, Guyana, Suriname, France"), trick: L("France") },

  // Land & islands
  { id: "island-caribbean", cat: "Land & islands", q: "Name a Caribbean island country", note: "The Bahamas counts.",
    members: L("Cuba, Jamaica, Haiti, Dominican Republic, Bahamas, Barbados, Trinidad and Tobago, Antigua and Barbuda, Dominica, Grenada, Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines") },
  { id: "island-africa", cat: "Land & islands", q: "Name an African island country",
    members: L("Madagascar, Mauritius, Seychelles, Comoros, Cape Verde, São Tomé and Príncipe") },
  { id: "island-shared", cat: "Land & islands", q: "Name a country that shares an island with another country",
    note: "Hispaniola, Borneo, Timor, New Guinea, Ireland, Tierra del Fuego, Saint Martin, Usedom, Hans Island, Märket and more.",
    members: L("Haiti, Dominican Republic, Indonesia, Malaysia, Brunei, East Timor, Papua New Guinea, Ireland, United Kingdom, Chile, Argentina, France, Netherlands, Germany, Poland, Canada, Denmark, Sweden, Finland"),
    trick: L("France, Netherlands, Germany, Poland, Canada, Denmark, Sweden, Finland, Chile, Argentina") },

  // Regions
  { id: "region-central-america", cat: "Regions", q: "Name a country in Central America", note: "Mexico doesn't count here.",
    members: L("Belize, Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica, Panama") },
  { id: "region-southeast-asia", cat: "Regions", q: "Name a country in Southeast Asia",
    members: L("Brunei, Cambodia, East Timor, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand, Vietnam") },
  { id: "region-central-asia", cat: "Regions", q: "Name a country in Central Asia",
    members: L("Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Uzbekistan") },
  { id: "region-nordic", cat: "Regions", q: "Name a Nordic country",
    members: L("Denmark, Finland, Iceland, Norway, Sweden") },
  { id: "region-west-africa", cat: "Regions", q: "Name a country in West Africa",
    members: L("Benin, Burkina Faso, Cape Verde, Gambia, Ghana, Guinea, Guinea-Bissau, Ivory Coast, Liberia, Mali, Mauritania, Niger, Nigeria, Senegal, Sierra Leone, Togo") },
  { id: "region-eu", cat: "Regions", q: "Name a member of the European Union",
    members: L("Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden") },
  { id: "region-asean", cat: "Regions", q: "Name a member of ASEAN", note: "The Association of Southeast Asian Nations.",
    members: L("Brunei, Cambodia, East Timor, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand, Vietnam") },
  { id: "region-pacific-islands", cat: "Regions", q: "Name a Pacific island country", note: "Australia and New Zealand don't count.",
    members: L("Fiji, Kiribati, Marshall Islands, Micronesia, Nauru, Palau, Papua New Guinea, Samoa, Solomon Islands, Tonga, Tuvalu, Vanuatu") },

  // Language & money (official languages; checked by hand rather than taken from the open data, which is loose here)
  { id: "lang-spanish", cat: "Language & money", q: "Name a country where Spanish is an official language",
    members: L("Spain, Mexico, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, Panama, Cuba, Dominican Republic, Colombia, Venezuela, Ecuador, Peru, Bolivia, Chile, Argentina, Uruguay, Paraguay, Equatorial Guinea"),
    trick: L("Equatorial Guinea") },
  { id: "lang-portuguese", cat: "Language & money", q: "Name a country where Portuguese is an official language",
    members: L("Portugal, Brazil, Angola, Mozambique, Cape Verde, Guinea-Bissau, São Tomé and Príncipe, East Timor, Equatorial Guinea"),
    trick: L("Equatorial Guinea") },
  { id: "lang-french", cat: "Language & money", q: "Name a country where French is an official language",
    members: L("France, Belgium, Switzerland, Luxembourg, Monaco, Canada, Haiti, Benin, Burkina Faso, Burundi, Cameroon, Central African Republic, Chad, Comoros, Congo, DR Congo, Djibouti, Equatorial Guinea, Gabon, Guinea, Ivory Coast, Madagascar, Mali, Niger, Rwanda, Senegal, Seychelles, Togo, Vanuatu") },
  { id: "lang-arabic", cat: "Language & money", q: "Name a country where Arabic is an official language",
    members: L("Algeria, Bahrain, Chad, Comoros, Djibouti, Egypt, Iraq, Jordan, Kuwait, Lebanon, Libya, Mauritania, Morocco, Oman, Palestine, Qatar, Saudi Arabia, Somalia, Sudan, Syria, Tunisia, United Arab Emirates, Yemen") },
  { id: "lang-german", cat: "Language & money", q: "Name a country where German is an official language", note: "National level only.",
    members: L("Germany, Austria, Switzerland, Liechtenstein, Luxembourg, Belgium") },
  { id: "money-euro", cat: "Language & money", q: "Name a country that uses the euro", note: "Countries using it without joining the eurozone count.",
    members: L("Austria, Belgium, Bulgaria, Croatia, Cyprus, Estonia, Finland, France, Germany, Greece, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Portugal, Slovakia, Slovenia, Spain, Andorra, Monaco, San Marino, Vatican City, Montenegro, Kosovo"),
    trick: L("Montenegro, Kosovo") },
  { id: "money-franc", cat: "Language & money", q: "Name a country whose currency is a franc", note: "CFA, Swiss, Congolese and other francs all count.",
    members: L("Switzerland, Liechtenstein, Benin, Burkina Faso, Ivory Coast, Guinea-Bissau, Mali, Niger, Senegal, Togo, Cameroon, Central African Republic, Chad, Congo, Equatorial Guinea, Gabon, DR Congo, Rwanda, Burundi, Guinea, Djibouti, Comoros") },
  { id: "money-peso", cat: "Language & money", q: "Name a country whose currency is a peso",
    members: L("Mexico, Argentina, Chile, Colombia, Cuba, Dominican Republic, Uruguay, Philippines") },
  { id: "money-dinar", cat: "Language & money", q: "Name a country whose currency is a dinar",
    members: L("Algeria, Bahrain, Iraq, Jordan, Kuwait, Libya, Serbia, Tunisia") },
  { id: "money-rupee", cat: "Language & money", q: "Name a country whose currency is a rupee",
    members: L("India, Pakistan, Nepal, Sri Lanka, Mauritius, Seychelles, Bhutan"), trick: L("Bhutan") },
  { id: "money-pound", cat: "Language & money", q: "Name a country whose currency is a pound",
    members: L("United Kingdom, Egypt, Lebanon, Syria, Sudan, South Sudan") },
  { id: "money-dollar", cat: "Language & money", q: "Name a country whose currency is a dollar", note: "Their own dollar or someone else's.",
    members: L("United States, Canada, Australia, New Zealand, Singapore, Brunei, Taiwan, Jamaica, Bahamas, Barbados, Belize, Guyana, Suriname, Trinidad and Tobago, Antigua and Barbuda, Dominica, Grenada, Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines, Liberia, Namibia, Zimbabwe, Ecuador, El Salvador, Panama, East Timor, Fiji, Solomon Islands, Kiribati, Tuvalu, Nauru, Marshall Islands, Micronesia, Palau") }
];

/** Land borders through overseas territories, which the open data leaves out. Each one is a trick answer. */
export const OVERSEAS_BORDERS: [a: string, b: string, via: string][] = [
  ["France", "Brazil", "French Guiana"], ["France", "Suriname", "French Guiana"], ["France", "Netherlands", "Saint Martin"]
];
