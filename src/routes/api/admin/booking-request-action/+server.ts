import { json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { parseBookingRequestPayload } from "$lib/chat/bookingRequestPayload";
import { createBookingFromChatAndNotify } from "$lib/server/chatBooking";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
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

	const messageId = toInt(body.messageId);
	const action = body.action === "deny" ? "deny" : body.action === "approve" ? "approve" : null;
	if (!messageId || !action) {
		return json(await encryptPayload(JSON.stringify({ error: "messageId and action (approve|deny) are required." })), { status: 400 });
	}

	const adminUserId = locals.user.user_id;
	if (!adminUserId) return json(await encryptPayload(JSON.stringify({ error: "Unauthorized." })), { status: 401 });

	const [row] = await db
		.select()
		.from(schema.message)
		.where(eq(schema.message.message_id, messageId))
		.limit(1);

	if (!row) return json(await encryptPayload(JSON.stringify({ error: "Message not found." })), { status: 404 });
	if (row.message_kind !== "booking_request") {
		return json(await encryptPayload(JSON.stringify({ error: "Not a booking request message." })), { status: 400 });
	}

	const status = row.request_status ?? "PENDING";
	if (status !== "PENDING") {
		return json(await encryptPayload(JSON.stringify({ error: `This request was already ${status}.` })), { status: 409 });
	}

	const [conv] = await db
		.select()
		.from(schema.conversation)
		.where(eq(schema.conversation.conversation_id, row.conversation_id))
		.limit(1);
	if (!conv) return json(await encryptPayload(JSON.stringify({ error: "Conversation not found." })), { status: 404 });

	const payload = parseBookingRequestPayload(row.message_text);
	if (!payload) {
		return json(await encryptPayload(JSON.stringify({ error: "Could not read booking request data." })), { status: 400 });
	}

	if (action === "deny") {
		await db
			.update(schema.message)
			.set({ request_status: "DENIED" })
			.where(eq(schema.message.message_id, messageId));

		await db.insert(schema.message).values({
			conversation_id: row.conversation_id,
			sender_id: adminUserId,
			message_text:
				payload.kind === "service"
					? "Your service request was declined. If you have questions or want a different option, reply here and we’ll help."
					: "Your package booking request was declined. If you have questions or want a different option, reply here and we’ll help.",
			message_kind: "text",
		});

		return json(await encryptPayload(JSON.stringify({ ok: true, action: "denied" })), { status: 200 });
	}

	const travelDate = payload.travelDate
		? new Date(`${payload.travelDate}T12:00:00`)
		: null;
	const travelDateNorm = travelDate && !Number.isNaN(travelDate.getTime()) ? travelDate : null;

	let bookingId: number | null = null;
	if (payload.kind === "package") {
		const result = await createBookingFromChatAndNotify({
			conversationId: row.conversation_id,
			customerUserId: conv.user_id,
			adminUserId,
			kind: "PACKAGE",
			packageId: payload.packageId,
			numberOfPeople: payload.numberOfPeople,
			travelDate: travelDateNorm,
			totalPrice: Math.max(0, Math.round(payload.listedPrice * payload.numberOfPeople)),
			bookingStatus: "CONFIRMED",
		});
		bookingId = result.booking_id;
	} else {
		await db.insert(schema.message).values({
			conversation_id: row.conversation_id,
			sender_id: adminUserId,
			message_text: `Your service request for ${payload.serviceTitle} has been approved. Reply here if you want us to record the service booking or confirm the next step in thread.`,
			message_kind: "text",
		});
	}

	if (!conv.admin_id) {
		await db
			.update(schema.conversation)
			.set({ admin_id: adminUserId })
			.where(eq(schema.conversation.conversation_id, row.conversation_id));
	}

	await db
		.update(schema.message)
		.set({
			request_status: "APPROVED",
			booking_id: bookingId,
		})
		.where(eq(schema.message.message_id, messageId));

	return json(
		await encryptPayload(JSON.stringify({
			ok: true,
			action: "approved",
			booking_id: bookingId,
		})),
		{ status: 200 },
	);
};
