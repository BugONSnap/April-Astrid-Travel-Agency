import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
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

function reqInt(v: FormDataEntryValue | null, label: string): number | { error: string } {
	const s = v == null ? "" : String(v).trim();
	if (!s) return { error: `${label} is required` };
	const n = Number.parseInt(s, 10);
	if (!Number.isFinite(n)) return { error: `Invalid ${label}` };
	return n;
}

export const load: PageServerLoad = async () => {
	const bookings = await db
		.select({
			booking_id: schema.booking.booking_id,
			first_name: schema.user.first_name,
			last_name: schema.user.last_name,
			email: schema.user.email,
			package_name: schema.packageTable.package_name,
			booking_kind: schema.booking.booking_kind,
			service_title: schema.booking.service_title,
			booking_status: schema.booking.booking_status,
			payment_status: schema.booking.payment_status,
		})
		.from(schema.booking)
		.leftJoin(schema.user, eq(schema.booking.user_id, schema.user.user_id))
		.leftJoin(schema.packageTable, eq(schema.booking.package_id, schema.packageTable.package_id))
		.orderBy(desc(schema.booking.booking_date));

	const payments = await db
		.select({
			payment_id: schema.payment.payment_id,
			booking_id: schema.payment.booking_id,
			amount: schema.payment.amount,
			payment_method: schema.payment.payment_method,
			payment_status: schema.payment.payment_status,
			transaction_reference: schema.payment.transaction_reference,
			payment_date: schema.payment.payment_date,
			first_name: schema.user.first_name,
			last_name: schema.user.last_name,
			email: schema.user.email,
			package_name: schema.packageTable.package_name,
		})
		.from(schema.payment)
		.leftJoin(schema.booking, eq(schema.payment.booking_id, schema.booking.booking_id))
		.leftJoin(schema.user, eq(schema.booking.user_id, schema.user.user_id))
		.leftJoin(schema.packageTable, eq(schema.booking.package_id, schema.packageTable.package_id))
		.orderBy(desc(schema.payment.payment_date));

	return {
		payments,
		bookings,
		paymentStatuses: schema.PAYMENT_STATUS,
	};
};

export const actions: Actions = {
	createPayment: async ({ request }) => {
		const data = await request.formData();

		const booking_idRaw = data.get("booking_id");
		const booking_id = booking_idRaw ? Number.parseInt(String(booking_idRaw), 10) : NaN;
		if (!Number.isFinite(booking_id)) return fail(400, { message: "Invalid booking_id" });

		const amountMaybe = reqInt(data.get("amount"), "amount");
		if (typeof amountMaybe !== "number") return fail(400, { message: amountMaybe.error });

		const payment_statusRaw = reqString(data.get("payment_status"), "payment_status");
		if (typeof payment_statusRaw !== "string") return fail(400, { message: payment_statusRaw.error });
		if (![...schema.PAYMENT_STATUS].includes(payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number])) {
			return fail(400, { message: "Invalid payment_status" });
		}

		await db.insert(schema.payment).values({
			booking_id,
			amount: amountMaybe,
			payment_method: optString(data.get("payment_method")),
			payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number],
			transaction_reference: optString(data.get("transaction_reference")),
		});

		await db
			.update(schema.booking)
			.set({ payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number] })
			.where(eq(schema.booking.booking_id, booking_id));

		throw redirect(303, "/admin/payments");
	},

	updatePayment: async ({ request }) => {
		const data = await request.formData();

		const payment_idRaw = data.get("payment_id");
		const payment_id = payment_idRaw ? Number.parseInt(String(payment_idRaw), 10) : NaN;
		if (!Number.isFinite(payment_id)) return fail(400, { message: "Invalid payment_id" });

		const amountMaybe = reqInt(data.get("amount"), "amount");
		if (typeof amountMaybe !== "number") return fail(400, { message: amountMaybe.error });

		const payment_statusRaw = reqString(data.get("payment_status"), "payment_status");
		if (typeof payment_statusRaw !== "string") return fail(400, { message: payment_statusRaw.error });
		if (![...schema.PAYMENT_STATUS].includes(payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number])) {
			return fail(400, { message: "Invalid payment_status" });
		}

		// Keep booking payment status in sync
		const [existing] = await db
			.select({ booking_id: schema.payment.booking_id })
			.from(schema.payment)
			.where(eq(schema.payment.payment_id, payment_id))
			.limit(1);

		await db
			.update(schema.payment)
			.set({
				amount: amountMaybe,
				payment_method: optString(data.get("payment_method")),
				payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number],
				transaction_reference: optString(data.get("transaction_reference")),
			})
			.where(eq(schema.payment.payment_id, payment_id));

		if (existing?.booking_id) {
			await db
				.update(schema.booking)
				.set({
					payment_status: payment_statusRaw as (typeof schema.PAYMENT_STATUS)[number],
				})
				.where(eq(schema.booking.booking_id, existing.booking_id));
		}

		throw redirect(303, "/admin/payments");
	},

	deletePayment: async ({ request }) => {
		const data = await request.formData();
		const payment_idRaw = data.get("payment_id");
		const payment_id = payment_idRaw ? Number.parseInt(String(payment_idRaw), 10) : NaN;
		if (!Number.isFinite(payment_id)) return fail(400, { message: "Invalid payment_id" });

		await db.delete(schema.payment).where(eq(schema.payment.payment_id, payment_id));
		throw redirect(303, "/admin/payments");
	},
};

