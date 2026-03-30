/**
 * Six-continent grouping for travel UI: Africa, Asia, Europe, North America, South America, Oceania.
 * Countries not listed fall through to `null` (caller may bucket as "Other").
 */

export const CONTINENT_ORDER = [
	"Africa",
	"Asia",
	"Europe",
	"North America",
	"South America",
	"Oceania",
] as const;

export type Continent = (typeof CONTINENT_ORDER)[number];

/**
 * 2×3 picker layout:
 * ASIA · OCEANIA · NORTH AMERICA
 * EUROPE · SOUTH AMERICA · AFRICA
 */
export const CONTINENT_GRID_ROWS: readonly (readonly Continent[])[] = [
	["Asia", "Oceania", "North America"],
	["Europe", "South America", "Africa"],
];

/** Short uppercase labels for continent tiles */
export const CONTINENT_DISPLAY_LABEL: Record<Continent, string> = {
	Asia: "ASIA",
	Oceania: "OCEANIA",
	"North America": "NORTH AMERICA",
	Europe: "EUROPE",
	"South America": "SOUTH AMERICA",
	Africa: "AFRICA",
};

const AFRICA = new Set([
	"Algeria",
	"Angola",
	"Benin",
	"Botswana",
	"Burkina Faso",
	"Burundi",
	"Cabo Verde",
	"Cameroon",
	"Central African Republic",
	"Chad",
	"Comoros",
	"Congo",
	"DR Congo",
	"DRC",
	"Djibouti",
	"Egypt",
	"Equatorial Guinea",
	"Eritrea",
	"Eswatini",
	"Ethiopia",
	"Gabon",
	"Gambia",
	"Ghana",
	"Guinea",
	"Guinea-Bissau",
	"Ivory Coast",
	"Côte d'Ivoire",
	"Kenya",
	"Lesotho",
	"Liberia",
	"Libya",
	"Madagascar",
	"Malawi",
	"Mali",
	"Mauritania",
	"Mauritius",
	"Morocco",
	"Mozambique",
	"Namibia",
	"Niger",
	"Nigeria",
	"Rwanda",
	"São Tomé and Príncipe",
	"Senegal",
	"Seychelles",
	"Sierra Leone",
	"Somalia",
	"South Africa",
	"South Sudan",
	"Sudan",
	"Tanzania",
	"Tanzania, United Republic of",
	"Togo",
	"Tunisia",
	"Uganda",
	"Zambia",
	"Zimbabwe",
]);

const ASIA = new Set([
	"Afghanistan",
	"Armenia",
	"Azerbaijan",
	"Bahrain",
	"Bangladesh",
	"Bhutan",
	"Brunei",
	"Cambodia",
	"China",
	"East Timor",
	"Timor-Leste",
	"Georgia",
	"Hong Kong",
	"India",
	"Indonesia",
	"Iran",
	"Iraq",
	"Israel",
	"Japan",
	"Jordan",
	"Kazakhstan",
	"Kuwait",
	"Kyrgyzstan",
	"Laos",
	"Lebanon",
	"Macau",
	"Macao",
	"Malaysia",
	"Maldives",
	"Mongolia",
	"Myanmar",
	"Burma",
	"Nepal",
	"North Korea",
	"Korea, North",
	"Oman",
	"Pakistan",
	"Palestine",
	"Philippines",
	"Qatar",
	"Saudi Arabia",
	"Singapore",
	"South Korea",
	"Korea",
	"South Korea, Republic of",
	"Korea, South",
	"Sri Lanka",
	"Syria",
	"Taiwan",
	"Taiwan, Province of China",
	"Tajikistan",
	"Thailand",
	"Turkey",
	"Türkiye",
	"Turkmenistan",
	"United Arab Emirates",
	"UAE",
	"Uzbekistan",
	"Vietnam",
	"Viet Nam",
	"Yemen",
]);

const EUROPE = new Set([
	"Albania",
	"Andorra",
	"Austria",
	"Belarus",
	"Belgium",
	"Bosnia and Herzegovina",
	"Bosnia",
	"Bulgaria",
	"Croatia",
	"Cyprus",
	"Czech Republic",
	"Czechia",
	"Denmark",
	"Estonia",
	"Finland",
	"France",
	"Germany",
	"Greece",
	"Hungary",
	"Iceland",
	"Ireland",
	"Italy",
	"Kosovo",
	"Latvia",
	"Liechtenstein",
	"Lithuania",
	"Luxembourg",
	"Malta",
	"Moldova",
	"Monaco",
	"Montenegro",
	"Netherlands",
	"Holland",
	"North Macedonia",
	"Macedonia",
	"Norway",
	"Poland",
	"Portugal",
	"Romania",
	"Russia",
	"Russian Federation",
	"San Marino",
	"Serbia",
	"Slovakia",
	"Slovenia",
	"Spain",
	"Sweden",
	"Switzerland",
	"Ukraine",
	"United Kingdom",
	"UK",
	"Great Britain",
	"England",
	"Scotland",
	"Wales",
	"Northern Ireland",
	"Vatican",
	"Vatican City",
]);

const NORTH_AMERICA = new Set([
	"Antigua and Barbuda",
	"Bahamas",
	"Barbados",
	"Belize",
	"Bermuda",
	"Canada",
	"Costa Rica",
	"Cuba",
	"Dominica",
	"Dominican Republic",
	"El Salvador",
	"Greenland",
	"Grenada",
	"Guatemala",
	"Haiti",
	"Honduras",
	"Jamaica",
	"Mexico",
	"Montserrat",
	"Nicaragua",
	"Panama",
	"Saint Kitts and Nevis",
	"Saint Lucia",
	"Saint Vincent and the Grenadines",
	"Trinidad and Tobago",
	"USA",
	"US",
	"United States",
	"United States of America",
	"U.S.",
	"U.S.A.",
]);

const SOUTH_AMERICA = new Set([
	"Argentina",
	"Bolivia",
	"Brazil",
	"Chile",
	"Colombia",
	"Ecuador",
	"French Guiana",
	"Guyana",
	"Paraguay",
	"Peru",
	"Suriname",
	"Uruguay",
	"Venezuela",
]);

const OCEANIA = new Set([
	"Australia",
	"Cook Islands",
	"Fiji",
	"Guam",
	"Kiribati",
	"Marshall Islands",
	"Micronesia",
	"Nauru",
	"New Caledonia",
	"New Zealand",
	"Niue",
	"Northern Mariana Islands",
	"Palau",
	"Papua New Guinea",
	"Samoa",
	"Solomon Islands",
	"Tonga",
	"Tuvalu",
	"Vanuatu",
]);

export function continentForCountry(countryName: string): Continent | null {
	const n = countryName.trim();
	if (!n) return null;
	if (AFRICA.has(n)) return "Africa";
	if (ASIA.has(n)) return "Asia";
	if (EUROPE.has(n)) return "Europe";
	if (NORTH_AMERICA.has(n)) return "North America";
	if (SOUTH_AMERICA.has(n)) return "South America";
	if (OCEANIA.has(n)) return "Oceania";
	return null;
}

/** Admin dropdown + DB values: six continents plus explicit Other. */
export const DESTINATION_CONTINENT_OPTIONS = [...CONTINENT_ORDER, "Other"] as const;

export type StoredDestinationContinent = (typeof DESTINATION_CONTINENT_OPTIONS)[number];

const ALLOWED_STORED_CONTINENT = new Set<string>(DESTINATION_CONTINENT_OPTIONS);

export function isStoredDestinationContinent(v: string): v is StoredDestinationContinent {
	return ALLOWED_STORED_CONTINENT.has(v);
}

/** Resolved bucket for UI: same six continents, or Other when unset/unknown. */
export type ResolvedDestinationContinent = Continent | "Other";

/**
 * Prefer DB `continent`; when null/invalid, infer from country name; else Other.
 */
export function resolveDestinationContinent(
	stored: string | null | undefined,
	countryName: string,
): ResolvedDestinationContinent {
	const t = stored?.trim() ?? "";
	if (t && isStoredDestinationContinent(t)) {
		if (t === "Other") return "Other";
		return t;
	}
	return continentForCountry(countryName) ?? "Other";
}

/** Display order for horizontal destination sections (e.g. packages page). */
export const CONTINENT_CAROUSEL_ORDER: readonly Continent[] = [
	"Asia",
	"Oceania",
	"North America",
	"Europe",
	"South America",
	"Africa",
];
