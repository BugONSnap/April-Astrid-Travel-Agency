import { fail, redirect } from "@sveltejs/kit";
import { and, asc, desc, eq, inArray, isNull, notInArray, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
	removeStoredProfilePicture,
	saveProfilePictureFile,
} from "$lib/server/profilePictureUpload";
import { hashPassword, verifyPassword } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

const { EMPLOYMENT_STATUS } = schema;

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

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

	const profileRows = await db
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

	const row = profileRows[0];
	if (!row) {
		throw redirect(303, "/login");
	}

	const bookingRows = await db
		.select({
			booking_id: schema.booking.booking_id,
			booking_date: schema.booking.booking_date,
			travel_date: schema.booking.travel_date,
			number_of_people: schema.booking.number_of_people,
			total_price: schema.booking.total_price,
			booking_status: schema.booking.booking_status,
			payment_status: schema.booking.payment_status,
			package_id: schema.packageTable.package_id,
			package_name: schema.packageTable.package_name,
			destination_country: schema.destination.country_name,
			destination_city: schema.destination.city_name,
		})
		.from(schema.booking)
		.innerJoin(schema.packageTable, eq(schema.booking.package_id, schema.packageTable.package_id))
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(eq(schema.booking.user_id, locals.user.user_id))
		.orderBy(desc(schema.booking.booking_date));

	const paymentRows = await db
		.select({
			payment_id: schema.payment.payment_id,
			booking_id: schema.payment.booking_id,
			amount: schema.payment.amount,
			payment_method: schema.payment.payment_method,
			payment_status: schema.payment.payment_status,
			transaction_reference: schema.payment.transaction_reference,
			payment_date: schema.payment.payment_date,
			package_name: schema.packageTable.package_name,
			destination_country: schema.destination.country_name,
			destination_city: schema.destination.city_name,
		})
		.from(schema.payment)
		.innerJoin(schema.booking, eq(schema.payment.booking_id, schema.booking.booking_id))
		.innerJoin(schema.packageTable, eq(schema.booking.package_id, schema.packageTable.package_id))
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(eq(schema.booking.user_id, locals.user.user_id))
		.orderBy(desc(schema.payment.payment_date));

	const bookmarks = await db
		.select({
			bookmark_id: schema.bookmark.bookmark_id,
			created_at: schema.bookmark.created_at,
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
		.from(schema.bookmark)
		.innerJoin(schema.packageTable, eq(schema.bookmark.package_id, schema.packageTable.package_id))
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(eq(schema.bookmark.user_id, locals.user.user_id))
		.orderBy(desc(schema.bookmark.created_at));

	const bookmarkedIds = bookmarks.map((b) => b.package_id);
	const exploreRows = await db
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
		.where(
			and(
				statusActiveOrNull(),
				bookmarkedIds.length ? notInArray(schema.packageTable.package_id, bookmarkedIds) : undefined,
			),
		)
		.orderBy(desc(schema.packageTable.created_at))
		.limit(12);

	const packageIdsForImages = Array.from(new Set([...bookmarkedIds, ...exploreRows.map((p) => p.package_id)]));
	const firstImageByPackage = new Map<number, string>();
	if (packageIdsForImages.length) {
		const imgs = await db
			.select({
				package_id: schema.packageImage.package_id,
				image_url: schema.packageImage.image_url,
			})
			.from(schema.packageImage)
			.where(inArray(schema.packageImage.package_id, packageIdsForImages))
			.orderBy(asc(schema.packageImage.image_id));

		for (const im of imgs) {
			if (!firstImageByPackage.has(im.package_id)) firstImageByPackage.set(im.package_id, im.image_url);
		}
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
		bookings: bookingRows.map((b) => ({
			booking_id: b.booking_id,
			title: b.destination_city ? `${b.destination_country}, ${b.destination_city}` : b.destination_country,
			package_name: b.package_name,
			destination: b.destination_city ? b.destination_city : b.destination_country,
			booking_date: b.booking_date,
			travel_date: b.travel_date,
			number_of_people: b.number_of_people,
			total_price: b.total_price,
			booking_status: b.booking_status,
			payment_status: b.payment_status,
		})),
		savedTours: bookmarks.map((b) => ({
			bookmark_id: b.bookmark_id,
			package_id: b.package_id,
			package_name: b.package_name,
			category: b.category,
			description: b.description,
			price: b.price,
			duration_days: b.duration_days,
			destination_country: b.destination_country,
			destination_city: b.destination_city,
			image_url: firstImageByPackage.get(b.package_id) ?? b.destination_cover ?? null,
			created_at: b.created_at,
		})),
		paymentsDue: bookingRows
			.filter((b) => b.payment_status === "UNPAID" && b.booking_status !== "CANCELLED")
			.map((b) => ({
				booking_id: b.booking_id,
				package_name: b.package_name,
				destination_country: b.destination_country,
				destination_city: b.destination_city,
				total_price: b.total_price,
				travel_date: b.travel_date,
			})),
		paymentHistory: paymentRows.map((p) => ({
			payment_id: p.payment_id,
			booking_id: p.booking_id,
			amount: p.amount,
			payment_method: p.payment_method,
			payment_status: p.payment_status,
			transaction_reference: p.transaction_reference,
			payment_date: p.payment_date,
			package_name: p.package_name,
			destination_country: p.destination_country,
			destination_city: p.destination_city,
		})),
		explore: exploreRows.map((p) => ({
			package_id: p.package_id,
			package_name: p.package_name,
			category: p.category,
			description: p.description,
			price: p.price,
			duration_days: p.duration_days,
			destination_country: p.destination_country,
			destination_city: p.destination_city,
			image_url: firstImageByPackage.get(p.package_id) ?? p.destination_cover ?? null,
		})),
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

		return { success: true as const, action: "updateProfile" as const };
	},

	addBookmark: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, "/login");
		const data = await request.formData();
		const packageIdRaw = data.get("package_id");
		const package_id = packageIdRaw ? Number.parseInt(String(packageIdRaw), 10) : NaN;
		if (!Number.isFinite(package_id)) return fail(400, { message: "Invalid package_id" });

		const existing = await db
			.select({ bookmark_id: schema.bookmark.bookmark_id })
			.from(schema.bookmark)
			.where(and(eq(schema.bookmark.user_id, locals.user.user_id), eq(schema.bookmark.package_id, package_id)))
			.limit(1);
		if (existing.length === 0) {
			await db.insert(schema.bookmark).values({
				user_id: locals.user.user_id,
				package_id,
			});
		}
		return { success: true as const, action: "addBookmark" as const };
	},

	removeBookmark: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, "/login");
		const data = await request.formData();
		const bookmarkIdRaw = data.get("bookmark_id");
		const bookmark_id = bookmarkIdRaw ? Number.parseInt(String(bookmarkIdRaw), 10) : NaN;
		if (!Number.isFinite(bookmark_id)) return fail(400, { message: "Invalid bookmark_id" });

		await db
			.delete(schema.bookmark)
			.where(and(eq(schema.bookmark.bookmark_id, bookmark_id), eq(schema.bookmark.user_id, locals.user.user_id)));
		return { success: true as const, action: "removeBookmark" as const };
	},

	makePayment: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, "/login");
		const data = await request.formData();
		const bookingIdRaw = data.get("booking_id");
		const booking_id = bookingIdRaw ? Number.parseInt(String(bookingIdRaw), 10) : NaN;
		if (!Number.isFinite(booking_id)) return fail(400, { message: "Invalid booking_id" });

		const method = optText(data.get("payment_method")) ?? "Manual";
		const reference = optText(data.get("transaction_reference"));

		const rows = await db
			.select({
				booking_id: schema.booking.booking_id,
				user_id: schema.booking.user_id,
				total_price: schema.booking.total_price,
				booking_status: schema.booking.booking_status,
				payment_status: schema.booking.payment_status,
			})
			.from(schema.booking)
			.where(eq(schema.booking.booking_id, booking_id))
			.limit(1);
		const b = rows[0];
		if (!b || b.user_id !== locals.user.user_id) return fail(404, { message: "Booking not found" });
		if (b.booking_status === "CANCELLED") return fail(400, { message: "Booking is cancelled" });
		if (b.payment_status === "PAID") return fail(400, { message: "Already paid" });

		await db.insert(schema.payment).values({
			booking_id,
			amount: b.total_price,
			payment_method: method,
			payment_status: "PAID",
			transaction_reference: reference,
		});

		await db
			.update(schema.booking)
			.set({ payment_status: "PAID" })
			.where(eq(schema.booking.booking_id, booking_id));

		return { success: true as const, action: "makePayment" as const };
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, "/login");
		const data = await request.formData();
		const current = String(data.get("current_password") ?? "");
		const next = String(data.get("new_password") ?? "");
		const confirm = String(data.get("confirm_password") ?? "");

		if (next.length < 8) return fail(400, { message: "New password must be at least 8 characters" });
		if (next !== confirm) return fail(400, { message: "Passwords do not match" });

		const rows = await db
			.select({ password: schema.user.password })
			.from(schema.user)
			.where(eq(schema.user.user_id, locals.user.user_id))
			.limit(1);
		const hash = rows[0]?.password;
		if (!hash) return fail(400, { message: "User not found" });

		const ok = await verifyPassword(current, hash);
		if (!ok) return fail(400, { message: "Current password is incorrect" });

		await db
			.update(schema.user)
			.set({ password: await hashPassword(next) })
			.where(eq(schema.user.user_id, locals.user.user_id));

		return { success: true as const, action: "changePassword" as const };
	},
};
