import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { count, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

function reqString(v: FormDataEntryValue | null, label: string): string | { error: string } {
	const s = v == null ? "" : String(v).trim();
	if (!s) return { error: `${label} is required` };
	return s;
}

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			booking_id: schema.booking.booking_id,
			user_id: schema.booking.user_id,
			first_name: schema.user.first_name,
			last_name: schema.user.last_name,
			email: schema.user.email,
			package_id: schema.booking.package_id,
			package_name: schema.packageTable.package_name,
			booking_kind: schema.booking.booking_kind,
			service_title: schema.booking.service_title,
			booking_date: schema.booking.booking_date,
			travel_date: schema.booking.travel_date,
			number_of_people: schema.booking.number_of_people,
			total_price: schema.booking.total_price,
			booking_status: schema.booking.booking_status,
			payment_status: schema.booking.payment_status,
		})
		.from(schema.booking)
		.leftJoin(schema.user, eq(schema.booking.user_id, schema.user.user_id))
		.leftJoin(
			schema.packageTable,
			eq(schema.booking.package_id, schema.packageTable.package_id),
		)
		.orderBy(desc(schema.booking.booking_date));

	return {
		bookings: rows,
		bookingStatuses: schema.BOOKING_STATUS,
		paymentStatuses: schema.PAYMENT_STATUS,
	};
};

export const actions: Actions = {
		updateBooking: async ({ request }) => {
			const data = await request.formData();
			const booking_idRaw = data.get("booking_id");
			const booking_id = booking_idRaw ? Number.parseInt(String(booking_idRaw), 10) : NaN;
			if (!Number.isFinite(booking_id)) return fail(400, { message: "Invalid booking_id" });

			const booking_statusRaw = reqString(data.get("booking_status"), "Booking status");
			if (typeof booking_statusRaw !== "string") return fail(400, { message: booking_statusRaw.error });

			const payment_statusRaw = reqString(data.get("payment_status"), "Payment status");
			if (typeof payment_statusRaw !== "string") return fail(400, { message: payment_statusRaw.error });

			if (![...schema.BOOKING_STATUS].includes(booking_statusRaw as (typeof schema.BOOKING_STATUS)[number])) {
				return fail(400, { message: "Invalid booking_status" });
			}
			if (![...schema.PAYMENT_STATUS].includes(payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number])) {
				return fail(400, { message: "Invalid payment_status" });
			}

			const [existingBooking] = await db
				.select({ total_price: schema.booking.total_price })
				.from(schema.booking)
				.where(eq(schema.booking.booking_id, booking_id))
				.limit(1);
			if (!existingBooking) return fail(404, { message: "Booking not found" });

			await db
				.update(schema.booking)
				.set({
					booking_status: booking_statusRaw as (typeof schema.BOOKING_STATUS)[number],
					payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number],
				})
				.where(eq(schema.booking.booking_id, booking_id));

			// Keep payment table consistent if records already exist.
			await db
				.update(schema.payment)
				.set({
					payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number],
				})
				.where(eq(schema.payment.booking_id, booking_id));

			// Ledger: if marked PAID and there is no payment row yet, create one (admin Payments page).
			if (payment_statusRaw === "PAID") {
				const [cntRow] = await db
					.select({ n: count() })
					.from(schema.payment)
					.where(eq(schema.payment.booking_id, booking_id));
				const n = Number(cntRow?.n ?? 0);
				if (n === 0) {
					await db.insert(schema.payment).values({
						booking_id,
						amount: existingBooking.total_price,
						payment_status: "PAID",
						payment_method: "Recorded in Bookings",
						transaction_reference: `BOOKING-${booking_id}`,
					});
				}
			}

			throw redirect(303, "/admin/bookings");
		},
};

