import { json, type RequestHandler } from "@sveltejs/kit";
import { eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { message } from "$lib/server/db/schema";
import { encryptPayload } from "$lib/payloadEncryption";

export const POST: RequestHandler = async ({ request, locals }) => {
	const encryptedBody = (await request.json().catch(() => null)) as { iv?: string; ciphertext?: string } | null;
	if (!encryptedBody) {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid request." })), { status: 400 });
	}

	let body: { messageIds?: number[] };
	try {
		const { decryptPayload } = await import("$lib/payloadEncryption");
		body = JSON.parse(await decryptPayload(encryptedBody as { iv: string; ciphertext: string }));
	} catch {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid encrypted payload." })), { status: 400 });
	}

	const messageIds = body.messageIds || [];
	if (!Array.isArray(messageIds) || messageIds.length === 0) {
		return json(await encryptPayload(JSON.stringify({ error: "No message IDs provided." })), { status: 400 });
	}

	try {
		await db
			.update(message)
			.set({ is_read: 1 })
			.where(inArray(message.message_id, messageIds));

		return json(await encryptPayload(JSON.stringify({ success: true })));
	} catch (error) {
		console.error("Error marking messages as read:", error);
		return json(await encryptPayload(JSON.stringify({ error: "Failed to mark messages as read." })), { status: 500 });
	}
};
