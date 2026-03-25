import { json, type RequestHandler } from "@sveltejs/kit";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { conversation, message, user } from "$lib/server/db/schema";

function toInt(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

type ChatScope = "conversations" | "user-conversation" | "messages";

export const GET: RequestHandler = async ({ url, locals }) => {
	const scope = url.searchParams.get("scope") as ChatScope | null;

	if (!scope) {
		return json({ error: "Missing scope query parameter." }, { status: 400 });
	}

	if (scope === "conversations") {
		if (!locals.user || (locals.user.role !== "ADMIN" && locals.user.role !== "SUPERADMIN")) {
			return json({ error: "Forbidden." }, { status: 403 });
		}

		const rows = await db
			.select({
				conversation_id: conversation.conversation_id,
				user_id: conversation.user_id,
				admin_id: conversation.admin_id,
				status: conversation.status,
				created_at: conversation.created_at,
				first_name: user.first_name,
				last_name: user.last_name,
			})
			.from(conversation)
			.leftJoin(user, eq(user.user_id, conversation.user_id))
			.orderBy(desc(conversation.created_at));

		return json(rows);
	}

	if (scope === "user-conversation") {
		const requestedUserId = toInt(url.searchParams.get("userId"));
		const userId = locals.user?.user_id ?? requestedUserId;

		if (!userId) {
			return json({ error: "Missing userId." }, { status: 400 });
		}

		const existing = await db
			.select()
			.from(conversation)
			.where(eq(conversation.user_id, userId))
			.limit(1);

		if (existing[0]) {
			return json(existing[0]);
		}

		const [newConversation] = await db
			.insert(conversation)
			.values({
				user_id: userId,
			})
			.returning();

		return json(newConversation, { status: 201 });
	}

	if (scope === "messages") {
		const conversationId = toInt(url.searchParams.get("conversationId"));

		if (!conversationId) {
			return json({ error: "Missing conversationId." }, { status: 400 });
		}

		const rows = await db
			.select()
			.from(message)
			.where(eq(message.conversation_id, conversationId))
			.orderBy(asc(message.sent_at));

		return json(rows);
	}

	return json({ error: "Invalid scope." }, { status: 400 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as {
		conversationId?: number;
		senderId?: number;
		text?: string;
	};

	const conversationId = body.conversationId;
	const senderId = locals.user?.user_id ?? body.senderId;
	const text = body.text?.trim();

	if (!conversationId || !senderId || !text) {
		return json(
			{ error: "conversationId, senderId (or logged-in session), and text are required." },
			{ status: 400 },
		);
	}

	const convo = await db
		.select()
		.from(conversation)
		.where(eq(conversation.conversation_id, conversationId))
		.limit(1);

	const activeConversation = convo[0];
	if (!activeConversation) {
		return json({ error: "Conversation not found." }, { status: 404 });
	}

	if (locals.user?.role === "USER" && locals.user.user_id !== activeConversation.user_id) {
		return json({ error: "Forbidden." }, { status: 403 });
	}

	if (locals.user?.role === "ADMIN" || locals.user?.role === "SUPERADMIN") {
		if (!activeConversation.admin_id) {
			await db
				.update(conversation)
				.set({ admin_id: locals.user.user_id })
				.where(eq(conversation.conversation_id, conversationId));
		}
	}

	const [createdMessage] = await db
		.insert(message)
		.values({
			conversation_id: conversationId,
			sender_id: senderId,
			message_text: text,
		})
		.returning();

	return json(createdMessage, { status: 201 });
};
