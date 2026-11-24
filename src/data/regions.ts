/* States, provinces and other regions inside a country. r(name, wiki title?, aliases?) */
import type { Region } from "./types";

const r = (name: string, wiki = name, aliases: string[] = []): Region => ({ name, wiki, aliases });
const list = (s: string): Region[] => s.split(";").map(x => {
  const [name, wiki, al] = x.split("|");
  return r(name.trim(), wiki?.trim() || name.trim(), al ? al.split(",").map(a => a.trim()) : []);
});

export const US_STATES = list(`Alabama;Alaska;Arizona;Arkansas;California|California|Cali;Colorado;Connecticut;Delaware;Florida;
  Georgia|Georgia (U.S. state)|Georgia State;Hawaii|Hawaii|Hawai'i;Idaho;Illinois;Indiana;Iowa;Kansas;Kentucky;Louisiana;Maine;
  Maryland;Massachusetts;Michigan;Minnesota;Mississippi;Missouri;Montana;Nebraska;Nevada;New Hampshire;New Jersey;New Mexico;
  New York|New York (state)|New York State,NY;North Carolina;North Dakota;Ohio;Oklahoma;Oregon;Pennsylvania;Rhode Island;
  South Carolina;South Dakota;Tennessee;Texas;Utah;Vermont;Virginia;Washington|Washington (state)|Washington State;
  West Virginia;Wisconsin;Wyoming`);

export const CANADA = list(`Ontario;Quebec|Quebec|Québec;British Columbia|British Columbia|BC;Alberta;Nova Scotia;Manitoba;Saskatchewan;
  Newfoundland and Labrador|Newfoundland and Labrador|Newfoundland,Labrador;Yukon|Yukon|Yukon Territory;New Brunswick;
  Prince Edward Island|Prince Edward Island|PEI;Northwest Territories|Northwest Territories|NWT;Nunavut`);

export const AUSTRALIA = list(`New South Wales|New South Wales|NSW;Victoria|Victoria (state);Queensland|Queensland|QLD;
  Western Australia|Western Australia|WA;South Australia|South Australia|SA;Tasmania|Tasmania|Tassie;
  Northern Territory|Northern Territory|NT;Australian Capital Territory|Australian Capital Territory|ACT`);

export const GERMANY = list(`Bavaria|Bavaria|Bayern;Baden-Württemberg;Berlin;Brandenburg;Bremen|Bremen (state);Hamburg;Hesse|Hesse|Hessen;
  Lower Saxony|Lower Saxony|Niedersachsen;Mecklenburg-Vorpommern|Mecklenburg-Vorpommern|Mecklenburg-Western Pomerania,Mecklenburg;
  North Rhine-Westphalia|North Rhine-Westphalia|Nordrhein-Westfalen,NRW;Rhineland-Palatinate|Rhineland-Palatinate|Rheinland-Pfalz;
  Saarland;Saxony|Saxony|Sachsen;Saxony-Anhalt|Saxony-Anhalt|Sachsen-Anhalt;Schleswig-Holstein;Thuringia|Thuringia|Thüringen`);

export const INDIA = list(`Andhra Pradesh;Arunachal Pradesh;Assam;Bihar;Chhattisgarh;Goa;Gujarat;Haryana;Himachal Pradesh;Jharkhand;
  Karnataka;Kerala;Madhya Pradesh;Maharashtra;Manipur;Meghalaya;Mizoram;Nagaland;Odisha|Odisha|Orissa;Punjab|Punjab, India;
  Rajasthan;Sikkim;Tamil Nadu;Telangana;Tripura;Uttar Pradesh|Uttar Pradesh|UP;Uttarakhand|Uttarakhand|Uttaranchal;West Bengal`);

export const BRAZIL = list(`Acre|Acre (state);Alagoas;Amapá;Amazonas|Amazonas (Brazilian state);Bahia;Ceará;Espírito Santo|Espírito Santo;
  Goiás;Maranhão;Mato Grosso;Mato Grosso do Sul;Minas Gerais;Pará;Paraíba;Paraná|Paraná (state);Pernambuco;Piauí;
  Rio de Janeiro|Rio de Janeiro (state)|Rio;Rio Grande do Norte;Rio Grande do Sul;Rondônia;Roraima;Santa Catarina|Santa Catarina (state);
  São Paulo|São Paulo (state);Sergipe;Tocantins;Federal District|Federal District (Brazil)|Distrito Federal`);

export const MEXICO = list(`Aguascalientes;Baja California;Baja California Sur;Campeche;Chiapas;Chihuahua|Chihuahua (state);
  Coahuila;Colima;Durango;Guanajuato;Guerrero;Hidalgo|Hidalgo (state);Jalisco;State of Mexico|State of Mexico|Estado de México,Edomex;
  Michoacán;Morelos;Nayarit;Nuevo León;Oaxaca;Puebla|Puebla (state);Querétaro;Quintana Roo;San Luis Potosí;Sinaloa;Sonora;
  Tabasco;Tamaulipas;Tlaxcala;Veracruz;Yucatán|Yucatán (state)|Yucatan;Zacatecas;Mexico City|Mexico City|CDMX,Ciudad de México`);

/** Every region set, keyed by the country it belongs to. */
export const REGION_SETS: Record<string, Region[]> = {
  "United States": US_STATES, "Canada": CANADA, "Australia": AUSTRALIA, "Germany": GERMANY,
  "India": INDIA, "Brazil": BRAZIL, "Mexico": MEXICO
};
