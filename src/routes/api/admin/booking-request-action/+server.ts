import { json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { parsePackageBookingRequestPayload } from "$lib/chat/bookingRequestPayload";
import { createBookingFromChatAndNotify } from "$lib/server/chatBooking";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

function toInt(v: unknown): number | null {
	if (v == null) return null;
	const n = Number.parseInt(String(v), 10);
	return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || (locals.user.role !== "ADMIN" && locals.user.role !== "SUPERADMIN")) {
		return json({ error: "Forbidden." }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body) return json({ error: "Invalid JSON." }, { status: 400 });

	const messageId = toInt(body.messageId);
	const action = body.action === "deny" ? "deny" : body.action === "approve" ? "approve" : null;
	if (!messageId || !action) {
		return json({ error: "messageId and action (approve|deny) are required." }, { status: 400 });
	}

	const adminUserId = locals.user.user_id;
	if (!adminUserId) return json({ error: "Unauthorized." }, { status: 401 });

	const [row] = await db
		.select()
		.from(schema.message)
		.where(eq(schema.message.message_id, messageId))
		.limit(1);

	if (!row) return json({ error: "Message not found." }, { status: 404 });
	if (row.message_kind !== "booking_request") {
		return json({ error: "Not a booking request message." }, { status: 400 });
	}

	const status = row.request_status ?? "PENDING";
	if (status !== "PENDING") {
		return json({ error: `This request was already ${status}.` }, { status: 409 });
	}

	const [conv] = await db
		.select()
		.from(schema.conversation)
		.where(eq(schema.conversation.conversation_id, row.conversation_id))
		.limit(1);
	if (!conv) return json({ error: "Conversation not found." }, { status: 404 });

	const payload = parsePackageBookingRequestPayload(row.message_text);
	if (!payload) {
		return json({ error: "Could not read booking request data." }, { status: 400 });
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
				"Your package booking request was declined. If you have questions or want a different option, reply here and we’ll help.",
			message_kind: "text",
		});

		return json({ ok: true, action: "denied" }, { status: 200 });
	}

	// approve
	const travelDate = payload.travelDate
		? new Date(`${payload.travelDate}T12:00:00`)
		: null;
	const travelDateNorm = travelDate && !Number.isNaN(travelDate.getTime()) ? travelDate : null;

	const totalPrice = Math.max(0, Math.round(payload.listedPrice * payload.numberOfPeople));

	const result = await createBookingFromChatAndNotify({
		conversationId: row.conversation_id,
		customerUserId: conv.user_id,
		adminUserId,
		kind: "PACKAGE",
		packageId: payload.packageId,
		numberOfPeople: payload.numberOfPeople,
		travelDate: travelDateNorm,
		totalPrice,
		bookingStatus: "CONFIRMED",
	});

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
			booking_id: result.booking_id,
		})
		.where(eq(schema.message.message_id, messageId));

	return json(
		{
			ok: true,
			action: "approved",
			booking_id: result.booking_id,
			message_id: result.message_id,
		},
		{ status: 200 },
	);
};
