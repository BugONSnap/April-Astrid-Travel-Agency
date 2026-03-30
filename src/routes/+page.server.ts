import type { PageServerLoad } from "./$types";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

type Category = (typeof schema.PACKAGE_CATEGORY)[number];

async function loadPackagesForCategory(category: Category) {
	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			description: schema.packageTable.description,
			price: schema.packageTable.price,
			destination_city: schema.destination.city_name,
			destination_country: schema.destination.country_name,
			destination_cover: schema.destination.image_cover,
		})
		.from(schema.packageTable)
		.leftJoin(
			schema.destination,
			eq(schema.packageTable.destination_id, schema.destination.destination_id),
		)
		.where(
			and(
				eq(schema.packageTable.category, category),
				or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status)),
			),
		)
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
			.where(inArray(schema.packageImage.package_id, ids));
		for (const im of imgs) {
			if (!firstImageByPackage.has(im.package_id)) {
				firstImageByPackage.set(im.package_id, im.image_url);
			}
		}
	}

	return rows.map((r) => ({
		package_id: r.package_id,
		package_name: r.package_name,
		description: r.description,
		price: r.price,
		destination_city: r.destination_city,
		destination_country: r.destination_country,
		image_url: firstImageByPackage.get(r.package_id) ?? r.destination_cover ?? null,
	}));
}

export const load: PageServerLoad = async () => {
	const [promoPackages, starPackages, featuredPackages, destinations] = await Promise.all([
		loadPackagesForCategory("PROMO"),
		loadPackagesForCategory("STAR"),
		loadPackagesForCategory("FEATURED"),
		db
			.select({
				destination_id: schema.destination.destination_id,
				country_name: schema.destination.country_name,
				city_name: schema.destination.city_name,
				continent: schema.destination.continent,
				description: schema.destination.description,
				image_cover: schema.destination.image_cover,
			})
			.from(schema.destination)
			.orderBy(desc(schema.destination.created_at)),
	]);

	return {
		promoPackages,
		starPackages,
		featuredPackages,
		destinations,
	};
};
