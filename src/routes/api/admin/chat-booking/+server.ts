import { json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { createBookingFromChatAndNotify } from "$lib/server/chatBooking";
import { decryptPayload, encryptPayload, type EncryptedPayload } from "$lib/payloadEncryption";

function toInt(v: unknown): number | null {
	if (v == null) return null;
	const n = Number.parseInt(String(v), 10);
	return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || (locals.user.role !== "ADMIN" && locals.user.role !== "SUPERADMIN")) {
		return json(await encryptPayload(JSON.stringify({ error: "Forbidden." })), { status: 403 });
	}

	const encryptedBody = (await request.json().catch(() => null)) as EncryptedPayload | null;
	if (!encryptedBody) {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid request." })), { status: 400 });
	}

	let body: Record<string, unknown>;
	try {
		body = JSON.parse(await decryptPayload(encryptedBody));
	} catch (e) {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid encrypted payload." })), { status: 400 });
	}

	const conversationId = toInt(body.conversationId);
	const kind = body.kind === "SERVICE" ? "SERVICE" : "PACKAGE";
	const packageId = toInt(body.packageId);
	const serviceTitle =
		typeof body.serviceTitle === "string" ? body.serviceTitle.trim() : "";
	const numberOfPeople = toInt(body.numberOfPeople);
	const totalPrice = toInt(body.totalPrice);
	const travelRaw = body.travelDate;
	const bookingStatusRaw = body.bookingStatus;

	if (!conversationId || !numberOfPeople || numberOfPeople < 1 || !totalPrice || totalPrice < 0) {
		return json(await encryptPayload(JSON.stringify({ error: "conversationId, numberOfPeople, and totalPrice are required." })), { status: 400 });
	}

	let bookingStatus: (typeof schema.BOOKING_STATUS)[number] = "CONFIRMED";
	if (
		typeof bookingStatusRaw === "string" &&
		schema.BOOKING_STATUS.includes(bookingStatusRaw as (typeof schema.BOOKING_STATUS)[number])
	) {
		bookingStatus = bookingStatusRaw as (typeof schema.BOOKING_STATUS)[number];
	}

	let travelDate: Date | null = null;
	if (typeof travelRaw === "string" && travelRaw.trim()) {
		const d = new Date(`${travelRaw.trim()}T12:00:00`);
		travelDate = Number.isNaN(d.getTime()) ? null : d;
	}

	const convRows = await db
		.select()
		.from(schema.conversation)
		.where(eq(schema.conversation.conversation_id, conversationId))
		.limit(1);
	const conv = convRows[0];
	if (!conv) {
		return json(await encryptPayload(JSON.stringify({ error: "Conversation not found." })), { status: 404 });
	}

	if (!locals.user.user_id) {
		return json(await encryptPayload(JSON.stringify({ error: "Unauthorized." })), { status: 401 });
	}

	try {
		const result = await createBookingFromChatAndNotify({
			conversationId,
			customerUserId: conv.user_id,
			adminUserId: locals.user.user_id,
			kind,
			packageId: kind === "PACKAGE" ? packageId ?? undefined : undefined,
			serviceTitle: kind === "SERVICE" ? serviceTitle : undefined,
			numberOfPeople,
			travelDate,
			totalPrice,
			bookingStatus,
		});

		if (!conv.admin_id) {
			await db
				.update(schema.conversation)
				.set({ admin_id: locals.user.user_id })
				.where(eq(schema.conversation.conversation_id, conversationId));
		}

		return json(await encryptPayload(JSON.stringify(result)), { status: 201 });
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Could not create booking.";
		return json(await encryptPayload(JSON.stringify({ error: msg })), { status: 400 });
	}
};
