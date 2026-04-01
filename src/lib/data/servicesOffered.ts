/** Titles aligned with `src/routes/servoffered/+page.svelte` — used for admin chat SERVICE dropdown. */
export const SERVICES_OFFERED_TITLES = [
	"DFA Passport Appointment",
	"Tourist Visa Assistance",
	"International & Domestic Ticketing",
	"Hotel Booking",
	"Travel Insurance",
	"Apostille",
	"Red Ribbon",
] as const;

export type ServicesOfferedTitle = (typeof SERVICES_OFFERED_TITLES)[number];
