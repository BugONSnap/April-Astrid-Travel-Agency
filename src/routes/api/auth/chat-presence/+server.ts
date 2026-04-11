import { json, type RequestHandler } from "@sveltejs/kit";
import { encryptPayload } from "$lib/payloadEncryption";

// Simple in-memory store for online status (user_id -> timestamp of last activity)
const onlineStatus = new Map<number, number>();

// Track typing status (conversation_id -> timestamp of last typing event)
const typingStatus = new Map<number, number>();

export const GET: RequestHandler = async ({ url, locals }) => {
	const conversationId = Number.parseInt(url.searchParams.get("conversationId") ?? "", 10);

	if (!conversationId || Number.isNaN(conversationId)) {
		return json(await encryptPayload(JSON.stringify({ error: "Missing or invalid conversationId." })), { status: 400 });
	}

	// Check if user is typing (within last 5 seconds)
	const lastTypingTime = typingStatus.get(conversationId) ?? 0;
	const isTyping = Date.now() - lastTypingTime < 5000;

	// For now, consider admin online if they've been active in last 30 seconds
	// In a production app, this would use a proper session/presence system
	const isOnline = true; // Default to online for now

	return json(
		await encryptPayload(
			JSON.stringify({
				isTyping,
				isOnline,
			}),
		),
	);
};

// Helper to update online status (called from other endpoints)
export function setUserOnline(userId: number) {
	onlineStatus.set(userId, Date.now());
}

// Helper to check if user is online
export function isUserOnline(userId: number): boolean {
	const lastActivityTime = onlineStatus.get(userId) ?? 0;
	return Date.now() - lastActivityTime < 30000; // Consider online if active in last 30 seconds
}

// Helper to report typing
export function setTyping(conversationId: number) {
	typingStatus.set(conversationId, Date.now());
}

// Cleanup old entries periodically
if (typeof global !== "undefined") {
	setInterval(() => {
		const now = Date.now();
		const timeout = 30000; // 30 seconds

		// Clean typing status
		for (const [key, time] of typingStatus.entries()) {
			if (now - time > timeout) {
				typingStatus.delete(key);
			}
		}

		// Clean online status
		for (const [key, time] of onlineStatus.entries()) {
			if (now - time > timeout) {
				onlineStatus.delete(key);
			}
		}
	}, 10000); // Run cleanup every 10 seconds
}
