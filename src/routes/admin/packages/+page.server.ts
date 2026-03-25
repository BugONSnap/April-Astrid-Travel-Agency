import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

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

function optInt(v: FormDataEntryValue | null): number | null {
	const s = optString(v);
	if (s == null) return null;
	const n = Number.parseInt(s, 10);
	return Number.isNaN(n) ? null : n;
}

function parseImageUrls(v: FormDataEntryValue | null): string[] {
	const raw = optString(v);
	if (!raw) return [];
	// allow comma-separated or newline-separated
	return raw
		.split(/[\n,]/g)
		.map((s) => s.trim())
		.filter(Boolean);
}

export const load: PageServerLoad = async () => {
	const destinations = await db
		.select({
			destination_id: schema.destination.destination_id,
			country_name: schema.destination.country_name,
			city_name: schema.destination.city_name,
		})
		.from(schema.destination)
		.orderBy(desc(schema.destination.created_at));

	const packages = await db
		.select({
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			destination_id: schema.packageTable.destination_id,
			destination_city: schema.destination.city_name,
			destination_country: schema.destination.country_name,
			category: schema.packageTable.category,
			status: schema.packageTable.status,
			price: schema.packageTable.price,
			duration_days: schema.packageTable.duration_days,
			max_people: schema.packageTable.max_people,
			description: schema.packageTable.description,
			inclusions: schema.packageTable.inclusions,
			exclusions: schema.packageTable.exclusions,
			created_by: schema.packageTable.created_by,
		})
		.from(schema.packageTable)
		.leftJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.orderBy(desc(schema.packageTable.created_at));

	const packageIds = packages.map((p) => p.package_id);
	const packageImages = packageIds.length
		? await db
				.select({
					package_id: schema.packageImage.package_id,
					image_url: schema.packageImage.image_url,
				})
				.from(schema.packageImage)
				.where(inArray(schema.packageImage.package_id, packageIds))
		: [];

	return {
		packages,
		destinations,
		categories: schema.PACKAGE_CATEGORY,
		packageImages,
	};
};

export const actions: Actions = {
	createPackage: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: "Not authenticated" });

		const data = await request.formData();

		const package_name = reqString(data.get("package_name"), "Package name");
		if (typeof package_name !== "string") return fail(400, { message: package_name.error });

		const destination_idRaw = data.get("destination_id");
		const destination_id = destination_idRaw ? Number.parseInt(String(destination_idRaw), 10) : NaN;
		if (!Number.isFinite(destination_id)) return fail(400, { message: "Invalid destination_id" });

		const category = reqString(data.get("category"), "Category");
		if (typeof category !== "string") return fail(400, { message: category.error });

		if (![...schema.PACKAGE_CATEGORY].includes(category as (typeof schema.PACKAGE_CATEGORY)[number])) {
			return fail(400, { message: "Invalid category" });
		}

		const priceRaw = data.get("price");
		const price = priceRaw ? Number.parseInt(String(priceRaw), 10) : NaN;
		if (!Number.isFinite(price)) return fail(400, { message: "Invalid price" });

		const [created] = await db
			.insert(schema.packageTable)
			.values({
				package_name,
				destination_id,
				category: category as (typeof schema.PACKAGE_CATEGORY)[number],
				description: optString(data.get("description")),
				price,
				duration_days: optInt(data.get("duration_days")),
				max_people: optInt(data.get("max_people")),
				inclusions: optString(data.get("inclusions")),
				exclusions: optString(data.get("exclusions")),
				status: optString(data.get("status")) ?? "active",
				created_by: locals.user.user_id,
			})
			.returning({ package_id: schema.packageTable.package_id });

		const imageUrls = parseImageUrls(data.get("image_urls"));
		for (const url of imageUrls) {
			await db.insert(schema.packageImage).values({
				package_id: created.package_id,
				image_url: url,
			});
		}

		throw redirect(303, "/admin/packages");
	},

	updatePackage: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: "Not authenticated" });

		const data = await request.formData();
		const package_idRaw = data.get("package_id");
		const package_id = package_idRaw ? Number.parseInt(String(package_idRaw), 10) : NaN;
		if (!Number.isFinite(package_id)) return fail(400, { message: "Invalid package_id" });

		const package_name = reqString(data.get("package_name"), "Package name");
		if (typeof package_name !== "string") return fail(400, { message: package_name.error });

		const destination_idRaw = data.get("destination_id");
		const destination_id = destination_idRaw ? Number.parseInt(String(destination_idRaw), 10) : NaN;
		if (!Number.isFinite(destination_id)) return fail(400, { message: "Invalid destination_id" });

		const category = reqString(data.get("category"), "Category");
		if (typeof category !== "string") return fail(400, { message: category.error });
		if (![...schema.PACKAGE_CATEGORY].includes(category as (typeof schema.PACKAGE_CATEGORY)[number])) {
			return fail(400, { message: "Invalid category" });
		}

		const priceRaw = data.get("price");
		const price = priceRaw ? Number.parseInt(String(priceRaw), 10) : NaN;
		if (!Number.isFinite(price)) return fail(400, { message: "Invalid price" });

		await db
			.update(schema.packageTable)
			.set({
				package_name,
				destination_id,
				category: category as (typeof schema.PACKAGE_CATEGORY)[number],
				description: optString(data.get("description")),
				price,
				duration_days: optInt(data.get("duration_days")),
				max_people: optInt(data.get("max_people")),
				inclusions: optString(data.get("inclusions")),
				exclusions: optString(data.get("exclusions")),
				status: optString(data.get("status")) ?? "active",
			})
			.where(eq(schema.packageTable.package_id, package_id));

		// Replace package images
		await db.delete(schema.packageImage).where(eq(schema.packageImage.package_id, package_id));
		const imageUrls = parseImageUrls(data.get("image_urls"));
		for (const url of imageUrls) {
			await db.insert(schema.packageImage).values({
				package_id,
				image_url: url,
			});
		}

		throw redirect(303, "/admin/packages");
	},

	deletePackage: async ({ request }) => {
		const data = await request.formData();
		const package_idRaw = data.get("package_id");
		const package_id = package_idRaw ? Number.parseInt(String(package_idRaw), 10) : NaN;
		if (!Number.isFinite(package_id)) return fail(400, { message: "Invalid package_id" });

		// Delete images first to avoid FK errors
		await db.delete(schema.packageImage).where(eq(schema.packageImage.package_id, package_id));
		await db.delete(schema.packageTable).where(eq(schema.packageTable.package_id, package_id));
		throw redirect(303, "/admin/packages");
	},
};

