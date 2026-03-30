import type { Actions, PageServerLoad } from "./$types";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fail, redirect } from "@sveltejs/kit";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
	removeStoredDestinationCover,
	saveDestinationCoverFile,
} from "$lib/server/destinationCoverUpload";
import { DESTINATION_CONTINENT_OPTIONS, isStoredDestinationContinent } from "$lib/geo/countryContinent";

const STATIC_DEST_FS = join(process.cwd(), "static", "uploads", "destinations");
const STATIC_DEST_URL_PREFIX = "/uploads/destinations/";

async function listStaticDestinationCoverUrls(): Promise<string[]> {
	try {
		const names = await readdir(STATIC_DEST_FS);
		return names
			.filter((n) => /\.(jpe?g|png|webp|gif|avif)$/i.test(n) && !n.startsWith("."))
			.sort((a, b) => a.localeCompare(b))
			.map((n) => `${STATIC_DEST_URL_PREFIX}${n}`);
	} catch {
		return [];
	}
}

/** Validates form value is a real file under static/uploads/destinations. */
function resolveValidatedStaticCoverUrl(raw: FormDataEntryValue | null): string | null {
	if (raw == null) return null;
	const s = String(raw).trim();
	if (!s.startsWith(STATIC_DEST_URL_PREFIX)) return null;
	const base = s.slice(STATIC_DEST_URL_PREFIX.length);
	if (!base || base.includes("..") || base.includes("/") || base.includes("\\")) return null;
	if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(base)) return null;
	const abs = join(STATIC_DEST_FS, base);
	if (!existsSync(abs)) return null;
	return `${STATIC_DEST_URL_PREFIX}${base}`;
}

function optString(v: FormDataEntryValue | null): string | null {
	if (v == null) return null;
	const s = String(v).trim();
	return s === "" ? null : s;
}

function reqString(v: FormDataEntryValue | null, label: string): string | { error: string } {
	const s = v == null ? "" : String(v).trim();
	if (!s) return { error: `${label} is required` };
	return s;
}

function reqContinent(v: FormDataEntryValue | null): string | { error: string } {
	const s = reqString(v, "Continent");
	if (typeof s !== "string") return s;
	if (!isStoredDestinationContinent(s)) return { error: "Invalid continent" };
	return s;
}

export const load: PageServerLoad = async ({ url }) => {
	const rows = await db
		.select({
			destination_id: schema.destination.destination_id,
			country_name: schema.destination.country_name,
			city_name: schema.destination.city_name,
			continent: schema.destination.continent,
			description: schema.destination.description,
			image_cover: schema.destination.image_cover,
			created_at: schema.destination.created_at,
		})
		.from(schema.destination)
		.orderBy(desc(schema.destination.created_at));

	const countryHubs = await db
		.select({
			destination_id: schema.destination.destination_id,
			country_name: schema.destination.country_name,
			continent: schema.destination.continent,
			image_cover: schema.destination.image_cover,
		})
		.from(schema.destination)
		.where(isNull(schema.destination.city_name))
		.orderBy(asc(schema.destination.country_name));

	const createParam = url.searchParams.get("create");
	const initialCreate =
		createParam === "country" ? "country" : createParam === "city" ? "city" : null;

	const staticDestinationCovers = await listStaticDestinationCoverUrls();

	return {
		destinations: rows,
		countryHubs,
		continentOptions: [...DESTINATION_CONTINENT_OPTIONS],
		initialCreate,
		staticDestinationCovers,
	};
};

export const actions: Actions = {
	createDestination: async ({ request }) => {
		const data = await request.formData();
		const country_name = reqString(data.get("country_name"), "Country name");
		if (typeof country_name !== "string") return fail(400, { message: country_name.error });
		const continent = reqContinent(data.get("continent"));
		if (typeof continent !== "string") return fail(400, { message: continent.error });

		let image_cover: string | null = null;
		const fileEntry = data.get("image_cover_file");
		if (fileEntry instanceof File && fileEntry.size > 0) {
			try {
				image_cover = await saveDestinationCoverFile(fileEntry);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Could not upload image";
				return fail(400, { message });
			}
		} else {
			image_cover = resolveValidatedStaticCoverUrl(data.get("image_cover_static"));
		}

		await db.insert(schema.destination).values({
			country_name,
			city_name: optString(data.get("city_name")),
			continent,
			description: optString(data.get("description")),
			image_cover,
		});

		throw redirect(303, "/admin/destinations");
	},

	createCountry: async ({ request }) => {
		const data = await request.formData();
		const country_name = reqString(data.get("country_name"), "Country name");
		if (typeof country_name !== "string") return fail(400, { message: country_name.error });
		const continent = reqContinent(data.get("continent"));
		if (typeof continent !== "string") return fail(400, { message: continent.error });

		let image_cover: string | null = null;
		const fileEntry = data.get("image_cover_file");
		if (fileEntry instanceof File && fileEntry.size > 0) {
			try {
				image_cover = await saveDestinationCoverFile(fileEntry);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Could not upload image";
				return fail(400, { message });
			}
		} else {
			image_cover = resolveValidatedStaticCoverUrl(data.get("image_cover_static"));
		}

		await db.insert(schema.destination).values({
			country_name,
			city_name: null,
			continent,
			description: optString(data.get("description")),
			image_cover,
		});

		throw redirect(303, "/admin/destinations");
	},

	addCityToCountry: async ({ request }) => {
		const data = await request.formData();
		const parentRaw = data.get("parent_destination_id");
		const parentId = parentRaw ? Number.parseInt(String(parentRaw), 10) : NaN;
		if (!Number.isFinite(parentId)) return fail(400, { message: "Invalid parent destination" });

		const city_name = reqString(data.get("city_name"), "City name");
		if (typeof city_name !== "string") return fail(400, { message: city_name.error });

		const parentRows = await db
			.select({
				country_name: schema.destination.country_name,
				continent: schema.destination.continent,
				city_name: schema.destination.city_name,
				image_cover: schema.destination.image_cover,
				description: schema.destination.description,
			})
			.from(schema.destination)
			.where(eq(schema.destination.destination_id, parentId))
			.limit(1);

		const parent = parentRows[0];
		if (!parent) return fail(400, { message: "Country not found" });
		if (parent.city_name != null && String(parent.city_name).trim() !== "") {
			return fail(400, {
				message: "Pick a country entry (leave city empty on the country row), not a city destination.",
			});
		}
		if (!parent.continent || !isStoredDestinationContinent(parent.continent)) {
			return fail(400, { message: "Parent country is missing a valid continent" });
		}

		let image_cover: string | null = parent.image_cover;
		const fileEntry = data.get("image_cover_file");
		if (fileEntry instanceof File && fileEntry.size > 0) {
			try {
				image_cover = await saveDestinationCoverFile(fileEntry);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Could not upload image";
				return fail(400, { message });
			}
		}

		await db.insert(schema.destination).values({
			country_name: parent.country_name,
			city_name,
			continent: parent.continent,
			description: optString(data.get("description")) ?? parent.description,
			image_cover,
		});

		throw redirect(303, "/admin/destinations");
	},

	updateDestination: async ({ request }) => {
		const data = await request.formData();
		const destination_idRaw = data.get("destination_id");
		const destinationId = destination_idRaw ? Number.parseInt(String(destination_idRaw), 10) : NaN;
		if (!Number.isFinite(destinationId)) return fail(400, { message: "Invalid destination_id" });

		const country_name = reqString(data.get("country_name"), "Country name");
		if (typeof country_name !== "string") return fail(400, { message: country_name.error });
		const continent = reqContinent(data.get("continent"));
		if (typeof continent !== "string") return fail(400, { message: continent.error });

		const currentRows = await db
			.select({ image_cover: schema.destination.image_cover })
			.from(schema.destination)
			.where(eq(schema.destination.destination_id, destinationId))
			.limit(1);
		const previousImageCover = currentRows[0]?.image_cover ?? null;

		let image_cover = previousImageCover;
		const fileEntry = data.get("image_cover_file");
		if (fileEntry instanceof File && fileEntry.size > 0) {
			try {
				const newPath = await saveDestinationCoverFile(fileEntry);
				await removeStoredDestinationCover(previousImageCover);
				image_cover = newPath;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Could not upload image";
				return fail(400, { message });
			}
		} else {
			const staticUrl = resolveValidatedStaticCoverUrl(data.get("image_cover_static"));
			if (staticUrl) {
				await removeStoredDestinationCover(previousImageCover);
				image_cover = staticUrl;
			}
		}

		await db
			.update(schema.destination)
			.set({
				country_name,
				city_name: optString(data.get("city_name")),
				continent,
				description: optString(data.get("description")),
				image_cover,
			})
			.where(eq(schema.destination.destination_id, destinationId));

		throw redirect(303, "/admin/destinations");
	},

	deleteDestination: async ({ request }) => {
		const data = await request.formData();
		const destination_idRaw = data.get("destination_id");
		const destinationId = destination_idRaw ? Number.parseInt(String(destination_idRaw), 10) : NaN;
		if (!Number.isFinite(destinationId)) return fail(400, { message: "Invalid destination_id" });

		const currentRows = await db
			.select({ image_cover: schema.destination.image_cover })
			.from(schema.destination)
			.where(eq(schema.destination.destination_id, destinationId))
			.limit(1);
		const previousImageCover = currentRows[0]?.image_cover ?? null;
		await removeStoredDestinationCover(previousImageCover);

		await db.delete(schema.destination).where(eq(schema.destination.destination_id, destinationId));
		throw redirect(303, "/admin/destinations");
	},
};

