import type { PageServerLoad } from "./$types";
import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { packages: [] as { package_id: number; package_name: string; price: number }[] };
	}

	const rows = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			price: schema.packageTable.price,
		})
		.from(schema.packageTable)
		.where(statusActiveOrNull())
		.orderBy(desc(schema.packageTable.created_at))
		.limit(200);

	return { packages: rows };
};
