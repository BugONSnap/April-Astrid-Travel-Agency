import type { PageServerLoad } from "./$types";
import { sql, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

export const load: PageServerLoad = async () => {
	const usersCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.user).where(eq(schema.user.role, "USER"));

	const adminsCount = await db.select({
		count: sql<number>`count(*)`,
	}).from(schema.user).where(eq(schema.user.role, "ADMIN"));

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
	};
};

