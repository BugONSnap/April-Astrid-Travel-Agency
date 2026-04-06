import { json, type RequestHandler } from "@sveltejs/kit";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { conversation, message, user } from "$lib/server/db/schema";
import { encryptPayload } from "$lib/payloadEncryption";

function toInt(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

type ChatScope = "conversations" | "user-conversation" | "messages";

export const GET: RequestHandler = async ({ url, locals }) => {
	const scope = url.searchParams.get("scope") as ChatScope | null;

	if (!scope) {
		return json(await encryptPayload(JSON.stringify({ error: "Missing scope query parameter." })), { status: 400 });
	}

	if (scope === "conversations") {
		if (!locals.user || (locals.user.role !== "ADMIN" && locals.user.role !== "SUPERADMIN")) {
			return json(await encryptPayload(JSON.stringify({ error: "Forbidden." })), { status: 403 });
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

		return json(await encryptPayload(JSON.stringify(rows)));
	}

	if (scope === "user-conversation") {
		const requestedUserId = toInt(url.searchParams.get("userId"));
		const userId = locals.user?.user_id ?? requestedUserId;

		if (!userId) {
			return json(await encryptPayload(JSON.stringify({ error: "Missing userId." })), { status: 400 });
		}

		const existing = await db
			.select()
			.from(conversation)
			.where(eq(conversation.user_id, userId))
			.limit(1);

		if (existing[0]) {
			return json(await encryptPayload(JSON.stringify(existing[0])));
		}

		const [newConversation] = await db
			.insert(conversation)
			.values({
				user_id: userId,
			})
			.returning();

		return json(await encryptPayload(JSON.stringify(newConversation)), { status: 201 });
	}

	if (scope === "messages") {
		const conversationId = toInt(url.searchParams.get("conversationId"));

		if (!conversationId) {
			return json(await encryptPayload(JSON.stringify({ error: "Missing conversationId." })), { status: 400 });
		}

		const convo = await db
			.select()
			.from(conversation)
			.where(eq(conversation.conversation_id, conversationId))
			.limit(1);
		const c = convo[0];
		if (!c) {
			return json(await encryptPayload(JSON.stringify({ error: "Conversation not found." })), { status: 404 });
		}

		const isAdmin = locals.user?.role === "ADMIN" || locals.user?.role === "SUPERADMIN";
		if (!locals.user) {
			return json(await encryptPayload(JSON.stringify({ error: "Unauthorized." })), { status: 401 });
		}
		if (!isAdmin && locals.user.user_id !== c.user_id) {
			return json(await encryptPayload(JSON.stringify({ error: "Forbidden." })), { status: 403 });
		}

		const rows = await db
			.select()
			.from(message)
			.where(eq(message.conversation_id, conversationId))
			.orderBy(asc(message.sent_at));

		return json(await encryptPayload(JSON.stringify(rows)));
	}

	return json(await encryptPayload(JSON.stringify({ error: "Invalid scope." })), { status: 400 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const encryptedBody = (await request.json().catch(() => null)) as { iv?: string; ciphertext?: string } | null;
	if (!encryptedBody) {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid request." })), { status: 400 });
	}

	let body: { 
		conversationId?: number; 
		senderId?: number; 
		text?: string;
		messageKind?: string;
		fileUrl?: string;
		fileName?: string;
		fileType?: string;
		fileSize?: number;
		attachmentPurpose?: string;
	};
	try {
		const { decryptPayload } = await import("$lib/payloadEncryption");
		body = JSON.parse(await decryptPayload(encryptedBody as { iv: string; ciphertext: string }));
	} catch {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid encrypted payload." })), { status: 400 });
	}

	const conversationId = body.conversationId;
	const senderId = locals.user?.user_id ?? body.senderId;
	const text = body.text?.trim();
	const messageKind = body.messageKind || "text";
	const fileUrl = body.fileUrl;
	const fileName = body.fileName;
	const fileType = body.fileType;
	const fileSize = body.fileSize;
	const attachmentPurpose = body.attachmentPurpose;

	if (!conversationId || !senderId) {
		return json(
			await encryptPayload(JSON.stringify({ error: "conversationId and senderId (or logged-in session) are required." })),
			{ status: 400 },
		);
	}

	// For attachment messages, text is optional but messageKind must be valid
	if (messageKind !== "text" && !["image", "document", "verification"].includes(messageKind)) {
		return json(
			await encryptPayload(JSON.stringify({ error: "Invalid message kind. Must be text, image, document, or verification." })),
			{ status: 400 },
		);
	}

	// For attachment messages, require attachment data
	if (messageKind !== "text" && (!fileUrl || !fileName || !fileType)) {
		return json(
			await encryptPayload(JSON.stringify({ error: "Attachment messages require fileUrl, fileName, and fileType." })),
			{ status: 400 },
		);
	}

	// For text messages, require text
	if (messageKind === "text" && !text) {
		return json(
			await encryptPayload(JSON.stringify({ error: "Text messages require text content." })),
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
		return json(await encryptPayload(JSON.stringify({ error: "Conversation not found." })), { status: 404 });
	}

	if (locals.user?.role === "USER" && locals.user.user_id !== activeConversation.user_id) {
		return json(await encryptPayload(JSON.stringify({ error: "Forbidden." })), { status: 403 });
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
			message_text: text || "",
			message_kind: messageKind,
			file_url: fileUrl,
			file_name: fileName,
			file_type: fileType,
			file_size: fileSize,
			attachment_purpose: attachmentPurpose,
		})
		.returning();

	return json(await encryptPayload(JSON.stringify(createdMessage)), { status: 201 });
};
