import { json, type RequestHandler } from "@sveltejs/kit";
import { encryptPayload } from "$lib/payloadEncryption";

// Track typing status (conversation_id -> timestamp of last typing event)
const typingStatus = new Map<number, number>();

export const POST: RequestHandler = async ({ request, locals }) => {
	const encryptedBody = (await request.json().catch(() => null)) as { iv?: string; ciphertext?: string } | null;
	if (!encryptedBody) {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid request." })), { status: 400 });
	}

	let body: { conversationId?: number; isTyping?: boolean };
	try {
		const { decryptPayload } = await import("$lib/payloadEncryption");
		body = JSON.parse(await decryptPayload(encryptedBody as { iv: string; ciphertext: string }));
	} catch {
		return json(await encryptPayload(JSON.stringify({ error: "Invalid encrypted payload." })), { status: 400 });
	}

	const conversationId = body.conversationId;
	const isTyping = body.isTyping ?? true;

	if (!conversationId) {
		return json(await encryptPayload(JSON.stringify({ error: "Missing conversationId." })), { status: 400 });
	}

	if (isTyping) {
		typingStatus.set(conversationId, Date.now());
	}
	// Note: We don't delete from typingStatus when isTyping is false
	// The presence endpoint will check if the timestamp is recent enough

	return json(await encryptPayload(JSON.stringify({ success: true })));
};
