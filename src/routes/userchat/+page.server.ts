import type { PageServerLoad } from "./$types";
import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			packages: [] as {
				package_id: number;
				package_name: string;
				price: number;
				destination_line: string;
				duration_days: number | null;
			}[],
		};
	}

	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			price: schema.packageTable.price,
			duration_days: schema.packageTable.duration_days,
			country: schema.destination.country_name,
			city: schema.destination.city_name,
		})
		.from(schema.packageTable)
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(statusActiveOrNull())
		.orderBy(desc(schema.packageTable.created_at))
		.limit(200);

	return {
		packages: rows.map((r) => ({
			package_id: r.package_id,
			package_name: r.package_name,
			price: r.price,
			duration_days: r.duration_days,
			destination_line: [r.city, r.country].filter(Boolean).join(", ") || r.country,
		})),
	};
};
