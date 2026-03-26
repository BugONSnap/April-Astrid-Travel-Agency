import type { PageServerLoad } from "./$types";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

type PackageCategory = (typeof schema.PACKAGE_CATEGORY)[number];

type PackageListItem = {
	package_id: number;
	package_name: string;
	category: PackageCategory;
	description: string | null;
	price: number;
	duration_days: number | null;
	image_url: string | null;
	destination_country: string;
	destination_city: string | null;
};

type DestinationListItem = {
	destination_id: number;
	country_name: string;
	city_name: string | null;
	description: string | null;
	image_cover: string | null;
};

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

async function loadPackagesByCategory(category: PackageCategory): Promise<PackageListItem[]> {
	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			category: schema.packageTable.category,
			description: schema.packageTable.description,
			price: schema.packageTable.price,
			duration_days: schema.packageTable.duration_days,
			destination_country: schema.destination.country_name,
			destination_city: schema.destination.city_name,
			destination_cover: schema.destination.image_cover,
		})
		.from(schema.packageTable)
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(and(statusActiveOrNull(), eq(schema.packageTable.category, category)))
		.orderBy(desc(schema.packageTable.created_at));

	const ids = rows.map((r) => r.package_id);

	const firstImageByPackage = new Map<number, string>();
	if (ids.length) {
		const imgs = await db
			.select({
				package_id: schema.packageImage.package_id,
				image_url: schema.packageImage.image_url,
			})
			.from(schema.packageImage)
			.where(inArray(schema.packageImage.package_id, ids))
			.orderBy(asc(schema.packageImage.image_id));

		for (const im of imgs) {
			if (!firstImageByPackage.has(im.package_id)) firstImageByPackage.set(im.package_id, im.image_url);
		}
	}

	return rows.map((r) => ({
		package_id: r.package_id,
		package_name: r.package_name,
		category: r.category,
		description: r.description,
		price: r.price,
		duration_days: r.duration_days,
		destination_country: r.destination_country,
		destination_city: r.destination_city,
		image_url: firstImageByPackage.get(r.package_id) ?? r.destination_cover ?? null,
	}));
}

async function loadAllActivePackages(): Promise<PackageListItem[]> {
	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			category: schema.packageTable.category,
			description: schema.packageTable.description,
			price: schema.packageTable.price,
			duration_days: schema.packageTable.duration_days,
			destination_country: schema.destination.country_name,
			destination_city: schema.destination.city_name,
			destination_cover: schema.destination.image_cover,
		})
		.from(schema.packageTable)
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(statusActiveOrNull())
		.orderBy(desc(schema.packageTable.created_at));

	const ids = rows.map((r) => r.package_id);

	const firstImageByPackage = new Map<number, string>();
	if (ids.length) {
		const imgs = await db
			.select({
				package_id: schema.packageImage.package_id,
				image_url: schema.packageImage.image_url,
			})
			.from(schema.packageImage)
			.where(inArray(schema.packageImage.package_id, ids))
			.orderBy(asc(schema.packageImage.image_id));

		for (const im of imgs) {
			if (!firstImageByPackage.has(im.package_id)) firstImageByPackage.set(im.package_id, im.image_url);
		}
	}

	return rows.map((r) => ({
		package_id: r.package_id,
		package_name: r.package_name,
		category: r.category,
		description: r.description,
		price: r.price,
		duration_days: r.duration_days,
		destination_country: r.destination_country,
		destination_city: r.destination_city,
		image_url: firstImageByPackage.get(r.package_id) ?? r.destination_cover ?? null,
	}));
}

function inferRegion(countryName: string): "Asia" | "Europe" | "America" | null {
	// Simple mapping to keep the existing UI (Asia/Europe/America carousels).
	// If new countries are added that don't match this list, they won't appear in these carousels.
	const asia = new Set([
		"Japan",
		"China",
		"South Korea",
		"Korea",
		"Singapore",
		"Thailand",
		"Vietnam",
		"Philippines",
		"Taiwan",
		"Malaysia",
		"Indonesia",
	]);

	const europe = new Set([
		"France",
		"Italy",
		"Switzerland",
		"Spain",
		"Germany",
		"UK",
		"United Kingdom",
		"Netherlands",
	]);

	const america = new Set(["USA", "United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile"]);

	if (asia.has(countryName)) return "Asia";
	if (europe.has(countryName)) return "Europe";
	if (america.has(countryName)) return "America";
	return null;
}

export const load: PageServerLoad = async () => {
	const [promoPackages, packages, destinations] = await Promise.all([
		loadPackagesByCategory("PROMO"),
		loadAllActivePackages(),
		db
			.select({
				destination_id: schema.destination.destination_id,
				country_name: schema.destination.country_name,
				city_name: schema.destination.city_name,
				description: schema.destination.description,
				image_cover: schema.destination.image_cover,
			})
			.from(schema.destination)
			.orderBy(desc(schema.destination.created_at)),
	]);

	const countries = Array.from(new Set(packages.map((p) => p.destination_country))).sort();

	const destinationsByRegion: Record<"Asia" | "Europe" | "America", DestinationListItem[]> = {
		Asia: [],
		Europe: [],
		America: [],
	};

	for (const d of destinations) {
		const region = inferRegion(d.country_name);
		if (!region) continue;
		destinationsByRegion[region].push({
			destination_id: d.destination_id,
			country_name: d.country_name,
			city_name: d.city_name,
			description: d.description,
			image_cover: d.image_cover,
		});
	}

	return {
		promoPackages,
		packages,
		countries,
		destinationsByRegion,
	};
};

