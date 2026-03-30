/**
 * Display helpers for the country/city destination model:
 * — country hub: no city (empty/null) → show country only
 * — city row: show "City, Country"
 */

export function destinationCardLabel(args: {
	country_name: string;
	city_name: string | null | undefined;
}): string {
	const country = args.country_name?.trim() ?? "";
	const city = args.city_name?.trim() ?? "";
	return city ? `${city}, ${country}` : country;
}

/** Package / hero line from joined destination fields. */
export function packageDestinationCaption(
	destination_city: string | null | undefined,
	destination_country: string | null | undefined,
): string {
	const country = destination_country?.trim() ?? "";
	if (!country) return "";
	const city = destination_city?.trim() ?? "";
	return city ? `${city}, ${country}` : country;
}

/** Sort: country A–Z, then country hub (no city) before cities, then city A–Z. */
export function compareDestinationsHubFirst<
	T extends { country_name: string; city_name: string | null | undefined },
>(a: T, b: T): number {
	const byCountry = a.country_name.localeCompare(b.country_name, "en");
	if (byCountry !== 0) return byCountry;
	const ac = a.city_name?.trim() || "";
	const bc = b.city_name?.trim() || "";
	if (!ac && bc) return -1;
	if (ac && !bc) return 1;
	return ac.localeCompare(bc, "en");
}
