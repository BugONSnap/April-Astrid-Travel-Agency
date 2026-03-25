import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
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

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			destination_id: schema.destination.destination_id,
			country_name: schema.destination.country_name,
			city_name: schema.destination.city_name,
			description: schema.destination.description,
			image_cover: schema.destination.image_cover,
			created_at: schema.destination.created_at,
		})
		.from(schema.destination)
		.orderBy(desc(schema.destination.created_at));

	return { destinations: rows };
};

export const actions: Actions = {
	createDestination: async ({ request }) => {
		const data = await request.formData();
		const country_name = reqString(data.get("country_name"), "Country name");
		if (typeof country_name !== "string") return fail(400, { message: country_name.error });

		await db.insert(schema.destination).values({
			country_name,
			city_name: optString(data.get("city_name")),
			description: optString(data.get("description")),
			image_cover: optString(data.get("image_cover")),
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

		await db
			.update(schema.destination)
			.set({
				country_name,
				city_name: optString(data.get("city_name")),
				description: optString(data.get("description")),
				image_cover: optString(data.get("image_cover")),
			})
			.where(eq(schema.destination.destination_id, destinationId));

		throw redirect(303, "/admin/destinations");
	},

	deleteDestination: async ({ request }) => {
		const data = await request.formData();
		const destination_idRaw = data.get("destination_id");
		const destinationId = destination_idRaw ? Number.parseInt(String(destination_idRaw), 10) : NaN;
		if (!Number.isFinite(destinationId)) return fail(400, { message: "Invalid destination_id" });

		await db.delete(schema.destination).where(eq(schema.destination.destination_id, destinationId));
		throw redirect(303, "/admin/destinations");
	},
};

