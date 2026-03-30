import type { PageServerLoad } from "./$types";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

type PackageCategory = (typeof schema.PACKAGE_CATEGORY)[number];

type PromoSlideItem = {
	title: string;
	desc: string | null;
	image: string;
};

type PromoCarouselItem = {
	title: string;
	price: string;
	badge: string;
	image: string;
};

type DestinationItem = {
	name: string;
	image: string | null;
};

type DestinationPackageItem = {
	name: string;
	price: string;
};

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

async function loadPackagesForCategory(category: PackageCategory): Promise<
	{
		package_id: number;
		package_name: string;
		description: string | null;
		category: PackageCategory;
		price: number;
		destination_country: string;
		destination_city: string | null;
		image_url: string | null;
	}[]
> {
	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			description: schema.packageTable.description,
			category: schema.packageTable.category,
			price: schema.packageTable.price,
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
		description: r.description,
		category: r.category,
		price: r.price,
		destination_country: r.destination_country,
		destination_city: r.destination_city,
		image_url: firstImageByPackage.get(r.package_id) ?? r.destination_cover ?? null,
	}));
}

export const load: PageServerLoad = async () => {
	const [promoPackages, starPackages, destinations, packagesForDest] = await Promise.all([
		loadPackagesForCategory("PROMO"),
		loadPackagesForCategory("STAR"),
		db
			.select({
				destination_id: schema.destination.destination_id,
				country_name: schema.destination.country_name,
				city_name: schema.destination.city_name,
				continent: schema.destination.continent,
				image_cover: schema.destination.image_cover,
			})
			.from(schema.destination)
			.orderBy(desc(schema.destination.created_at)),
		db
			.select({
				package_id: schema.packageTable.package_id,
				destination_id: schema.packageTable.destination_id,
				package_name: schema.packageTable.package_name,
				category: schema.packageTable.category,
				price: schema.packageTable.price,
				duration_days: schema.packageTable.duration_days,
				destination_country: schema.destination.country_name,
				destination_city: schema.destination.city_name,
			})
			.from(schema.packageTable)
			.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
			.where(statusActiveOrNull()),
	]);

	// One row per package destination (country hub vs city are different IDs)
	const packagesByDestinationId: Record<number, DestinationPackageItem[]> = {};

	for (const p of packagesForDest) {
		const id = p.destination_id;
		if (!packagesByDestinationId[id]) packagesByDestinationId[id] = [];

		const price = `₱${Number(p.price).toLocaleString("en-PH")}`;
		packagesByDestinationId[id].push({
			name: p.package_name,
			price,
		});
	}

	return {
		promoPackages,
		starPackages,
		destinations,
		packagesByDestinationId,
	};
};

