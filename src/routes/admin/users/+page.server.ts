import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { hashPassword } from "$lib/server/auth";

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

function optNumber(v: FormDataEntryValue | null): number | null {
	const s = optString(v);
	if (s == null) return null;
	const n = Number.parseInt(s, 10);
	return Number.isNaN(n) ? null : n;
}

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			user_id: schema.user.user_id,
			first_name: schema.user.first_name,
			middle_name: schema.user.middle_name,
			last_name: schema.user.last_name,
			email: schema.user.email,
			role: schema.user.role,
			created_at: schema.user.created_at,
		})
		.from(schema.user)
		.orderBy(desc(schema.user.created_at));

	return {
		users: rows,
		roles: schema.ROLE,
		employmentStatuses: schema.EMPLOYMENT_STATUS,
	};
};

export const actions: Actions = {
	createUser: async ({ request }) => {
		const data = await request.formData();

		const first_name = reqString(data.get("first_name"), "First name");
		if (typeof first_name !== "string") return fail(400, { message: first_name.error });

		const last_name = reqString(data.get("last_name"), "Last name");
		if (typeof last_name !== "string") return fail(400, { message: last_name.error });

		const email = reqString(data.get("email"), "Email");
		if (typeof email !== "string") return fail(400, { message: email.error });

		const password = reqString(data.get("password"), "Password");
		if (typeof password !== "string") return fail(400, { message: password.error });

		const normalizedEmail = email.toLowerCase();
		const role = optString(data.get("role")) ?? "USER";

		const employment_status = optString(data.get("employment_status"));

		// optional: prevent non-enum roles/employment statuses
		if (![...schema.ROLE].includes(role as (typeof schema.ROLE)[number])) {
			return fail(400, { message: "Invalid role" });
		}
		if (
			employment_status != null &&
			![...schema.EMPLOYMENT_STATUS].includes(employment_status as (typeof schema.EMPLOYMENT_STATUS)[number])
		) {
			return fail(400, { message: "Invalid employment status" });
		}

		await db.insert(schema.user).values({
			first_name,
			middle_name: optString(data.get("middle_name")) ?? "",
			last_name,
			email: normalizedEmail,
			password: await hashPassword(password),
			age: optNumber(data.get("age")),
			contact_number: optString(data.get("contact_number")),
			birthdate: optString(data.get("birthdate")) ? new Date(String(data.get("birthdate")) + "T12:00:00") : null,
			gender: optString(data.get("gender")),
			nationality: optString(data.get("nationality")),
			civil_status: optString(data.get("civil_status")),
			employment_status:
				employment_status == null
					? null
					: (employment_status as (typeof schema.EMPLOYMENT_STATUS)[number]),
			home_address: optString(data.get("home_address")),
			profile_picture: optString(data.get("profile_picture")),
			role: role as (typeof schema.ROLE)[number],
		});

		throw redirect(303, "/admin/users");
	},

	updateUser: async ({ request }) => {
		const data = await request.formData();
		const user_idRaw = data.get("user_id");
		const userId = user_idRaw ? Number.parseInt(String(user_idRaw), 10) : NaN;
		if (!Number.isFinite(userId)) return fail(400, { message: "Invalid user_id" });

		const first_name = reqString(data.get("first_name"), "First name");
		if (typeof first_name !== "string") return fail(400, { message: first_name.error });
		const last_name = reqString(data.get("last_name"), "Last name");
		if (typeof last_name !== "string") return fail(400, { message: last_name.error });
		const email = reqString(data.get("email"), "Email");
		if (typeof email !== "string") return fail(400, { message: email.error });

		const role = optString(data.get("role")) ?? "USER";
		if (![...schema.ROLE].includes(role as (typeof schema.ROLE)[number])) {
			return fail(400, { message: "Invalid role" });
		}

		const employment_status = optString(data.get("employment_status"));
		if (
			employment_status != null &&
			![...schema.EMPLOYMENT_STATUS].includes(employment_status as (typeof schema.EMPLOYMENT_STATUS)[number])
		) {
			return fail(400, { message: "Invalid employment status" });
		}

		const passwordMaybe = optString(data.get("password"));

		const setPayload: any = {
			first_name,
			middle_name: optString(data.get("middle_name")) ?? "",
			last_name,
			email: email.toLowerCase(),
			age: optNumber(data.get("age")),
			contact_number: optString(data.get("contact_number")),
			birthdate: optString(data.get("birthdate"))
				? new Date(String(data.get("birthdate")) + "T12:00:00")
				: null,
			gender: optString(data.get("gender")),
			nationality: optString(data.get("nationality")),
			civil_status: optString(data.get("civil_status")),
			employment_status:
				employment_status == null
					? null
					: (employment_status as (typeof schema.EMPLOYMENT_STATUS)[number]),
			home_address: optString(data.get("home_address")),
			profile_picture: optString(data.get("profile_picture")),
			role: role as (typeof schema.ROLE)[number],
		};

		if (passwordMaybe) {
			setPayload.password = await hashPassword(passwordMaybe);
		}

		await db.update(schema.user).set(setPayload).where(eq(schema.user.user_id, userId));

		throw redirect(303, "/admin/users");
	},

	deleteUser: async ({ request }) => {
		const data = await request.formData();
		const user_idRaw = data.get("user_id");
		const userId = user_idRaw ? Number.parseInt(String(user_idRaw), 10) : NaN;
		if (!Number.isFinite(userId)) return fail(400, { message: "Invalid user_id" });

		// Note: might fail if there are foreign key constraints referencing this user.
		await db.delete(schema.user).where(eq(schema.user.user_id, userId));

		throw redirect(303, "/admin/users");
	},
};

