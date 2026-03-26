import type { PageServerLoad } from "./$types";
import { sql, eq, or, gte } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

const BOOKING_STATUS_ORDER = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const PAYMENT_STATUS_ORDER = ["UNPAID", "PAID"] as const;
const TREND_DAYS = 7;

function localISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export const load: PageServerLoad = async () => {
	const usersCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.user).where(eq(schema.user.role, "USER"));

	const adminsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.user).where(
		or(eq(schema.user.role, "ADMIN"), eq(schema.user.role, "SUPERADMIN")),
	);

	const destinationsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.destination);

	const packagesCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.packageTable);

	const bookingsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.booking);

	const paymentsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.payment);

	const openConversationsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.conversation).where(eq(schema.conversation.status, "open"));

	const unreadMessagesCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.message).where(eq(schema.message.is_read, 0));

	const bookingByStatusRows = await db
		.select({
			status: schema.booking.booking_status,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.booking)
		.groupBy(schema.booking.booking_status);

	const bookingMap = new Map(bookingByStatusRows.map((r) => [r.status, r.count]));

	const paymentByStatusRows = await db
		.select({
			status: schema.payment.payment_status,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.payment)
		.groupBy(schema.payment.payment_status);

	const paymentMap = new Map(paymentByStatusRows.map((r) => [r.status, r.count]));

	const trendStart = new Date();
	trendStart.setHours(0, 0, 0, 0);
	trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));

	const dailyBookingRows = await db
		.select({
			day: sql<string>`to_char(date_trunc('day', ${schema.booking.created_at}), 'YYYY-MM-DD')`,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.booking)
		.where(gte(schema.booking.created_at, trendStart))
		.groupBy(sql`date_trunc('day', ${schema.booking.created_at})`);

	const countByDay = new Map(dailyBookingRows.map((r) => [r.day, r.count]));
	const bookingsTrendLabels: string[] = [];
	const bookingsTrendData: number[] = [];
	for (let i = 0; i < TREND_DAYS; i++) {
		const d = new Date(trendStart);
		d.setDate(trendStart.getDate() + i);
		const key = localISODate(d);
		bookingsTrendData.push(countByDay.get(key) ?? 0);
		bookingsTrendLabels.push(
			new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(d),
		);
	}

	return {
		stats: {
			users: usersCount[0]?.count ?? 0,
			admins: adminsCount[0]?.count ?? 0,
			destinations: destinationsCount[0]?.count ?? 0,
			packages: packagesCount[0]?.count ?? 0,
			bookings: bookingsCount[0]?.count ?? 0,
			payments: paymentsCount[0]?.count ?? 0,
			conversationsOpen: openConversationsCount[0]?.count ?? 0,
			unreadMessages: unreadMessagesCount[0]?.count ?? 0,
		},
		charts: {
			bookingStatus: {
				labels: [...BOOKING_STATUS_ORDER],
				data: BOOKING_STATUS_ORDER.map((s) => bookingMap.get(s) ?? 0),
			},
			paymentStatus: {
				labels: [...PAYMENT_STATUS_ORDER],
				data: PAYMENT_STATUS_ORDER.map((s) => paymentMap.get(s) ?? 0),
			},
			bookingsTrend: {
				labels: bookingsTrendLabels,
				data: bookingsTrendData,
			},
		},
	};
};
