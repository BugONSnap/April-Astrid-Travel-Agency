import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
	removeStoredProfilePicture,
	saveProfilePictureFile,
} from "$lib/server/profilePictureUpload";
import type { Actions, PageServerLoad } from "./$types";

const { EMPLOYMENT_STATUS } = schema;

function formatDateInput(d: Date | null | undefined): string {
	if (!d) return "";
	const dt = d instanceof Date ? d : new Date(d);
	if (Number.isNaN(dt.getTime())) return "";
	const y = dt.getFullYear();
	const m = String(dt.getMonth() + 1).padStart(2, "0");
	const day = String(dt.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function parseBirthdate(s: string): Date | null {
	const t = s.trim();
	if (!t) return null;
	const d = new Date(`${t}T12:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

function parseOptionalInt(s: string): number | null {
	const t = s.trim();
	if (!t) return null;
	const n = Number.parseInt(t, 10);
	return Number.isFinite(n) ? n : null;
}

function optText(v: FormDataEntryValue | null): string | null {
	if (v == null) return null;
	const s = String(v).trim();
	return s === "" ? null : s;
}

function reqText(v: FormDataEntryValue | null, label: string): string | { error: string } {
	if (v == null || String(v).trim() === "") return { error: `${label} is required` };
	return String(v).trim();
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	const rows = await db
		.select({
			first_name: schema.user.first_name,
			middle_name: schema.user.middle_name,
			last_name: schema.user.last_name,
			email: schema.user.email,
			age: schema.user.age,
			contact_number: schema.user.contact_number,
			birthdate: schema.user.birthdate,
			gender: schema.user.gender,
			nationality: schema.user.nationality,
			civil_status: schema.user.civil_status,
			employment_status: schema.user.employment_status,
			home_address: schema.user.home_address,
			profile_picture: schema.user.profile_picture,
		})
		.from(schema.user)
		.where(eq(schema.user.user_id, locals.user.user_id))
		.limit(1);

	const row = rows[0];
	if (!row) {
		throw redirect(303, "/login");
	}

	return {
		profile: {
			first_name: row.first_name ?? "",
			middle_name: row.middle_name ?? "",
			last_name: row.last_name ?? "",
			email: row.email ?? "",
			age: row.age != null ? String(row.age) : "",
			contact_number: row.contact_number ?? "",
			birthdate: formatDateInput(row.birthdate ?? null),
			gender: row.gender ?? "",
			nationality: row.nationality ?? "",
			civil_status: row.civil_status ?? "",
			employment_status: row.employment_status ?? "",
			home_address: row.home_address ?? "",
			profile_picture: row.profile_picture ?? "",
		},
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, "/login");
		}

		const data = await request.formData();

		const currentRows = await db
			.select({ profile_picture: schema.user.profile_picture })
			.from(schema.user)
			.where(eq(schema.user.user_id, locals.user.user_id))
			.limit(1);
		const previousPicture = currentRows[0]?.profile_picture ?? null;

		const first = reqText(data.get("first_name"), "First name");
		if (typeof first !== "string") return fail(400, { message: first.error });

		const last = reqText(data.get("last_name"), "Last name");
		if (typeof last !== "string") return fail(400, { message: last.error });

		const emailRaw = reqText(data.get("email"), "Email");
		if (typeof emailRaw !== "string") return fail(400, { message: emailRaw.error });
		const email = emailRaw.toLowerCase();

		const middle_name = String(data.get("middle_name") ?? "").trim();
		const contact_number = optText(data.get("contact_number"));
		const gender = optText(data.get("gender"));
		const nationality = optText(data.get("nationality"));
		const civil_status = optText(data.get("civil_status"));
		const home_address = optText(data.get("home_address"));

		let profile_picture: string | null = previousPicture;
		const fileEntry = data.get("profile_picture");
		if (fileEntry instanceof File && fileEntry.size > 0) {
			try {
				const newPath = await saveProfilePictureFile(
					locals.user.user_id,
					fileEntry,
				);
				await removeStoredProfilePicture(previousPicture);
				profile_picture = newPath;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Could not save image";
				return fail(400, { message });
			}
		}

		const birthdate = parseBirthdate(String(data.get("birthdate") ?? ""));
		const age = parseOptionalInt(String(data.get("age") ?? ""));

		const empRaw = String(data.get("employment_status") ?? "").trim();
		let employment_status: (typeof EMPLOYMENT_STATUS)[number] | null = null;
		if (empRaw !== "") {
			if (!(EMPLOYMENT_STATUS as readonly string[]).includes(empRaw)) {
				return fail(400, { message: "Invalid employment status" });
			}
			employment_status = empRaw as (typeof EMPLOYMENT_STATUS)[number];
		}

		if (email !== locals.user.email) {
			const taken = await db
				.select({ user_id: schema.user.user_id })
				.from(schema.user)
				.where(eq(schema.user.email, email))
				.limit(1);
			if (taken.length > 0 && taken[0].user_id !== locals.user.user_id) {
				return fail(400, { message: "That email is already in use" });
			}
		}

		await db
			.update(schema.user)
			.set({
				first_name: first,
				middle_name: middle_name === "" ? "" : middle_name,
				last_name: last,
				email,
				age,
				contact_number,
				birthdate,
				gender,
				nationality,
				civil_status,
				employment_status,
				home_address,
				profile_picture,
			})
			.where(eq(schema.user.user_id, locals.user.user_id));

		return { success: true as const };
	},
};
