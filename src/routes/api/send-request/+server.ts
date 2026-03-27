import { json, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

type Payload = {
	service?: string;
	data?: Record<string, string>;
};

function safeText(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function formatRequest(service: string, data: Record<string, string>) {
	const lines = Object.entries(data)
		.map(([k, v]) => [k.trim(), safeText(v)].filter(Boolean).join(": "))
		.filter(Boolean);

	return [`Service request: ${service}`, "", ...lines].join("\n");
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: "Unauthorized." }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as Payload | null;
	if (!body) {
		return json({ error: "Invalid JSON body." }, { status: 400 });
	}

	const service = safeText(body.service);
	const data = body.data && typeof body.data === "object" ? body.data : null;

	if (!service || !data) {
		return json({ error: "service and data are required." }, { status: 400 });
	}

	// Create or reuse the user's support conversation.
	const existing = await db
		.select()
		.from(conversation)
		.where(eq(conversation.user_id, locals.user.user_id))
		.limit(1);

	let convoId = existing[0]?.conversation_id;
	if (!convoId) {
		const [created] = await db
			.insert(conversation)
			.values({ user_id: locals.user.user_id })
			.returning();
		convoId = created?.conversation_id;
	}

	if (!convoId) {
		return json({ error: "Could not create conversation." }, { status: 500 });
	}

	const text = formatRequest(service, data);
	const [createdMessage] = await db
		.insert(message)
		.values({
			conversation_id: convoId,
			sender_id: locals.user.user_id,
			message_text: text,
		})
		.returning();

	return json(
		{
			ok: true,
			conversationId: convoId,
			messageId: createdMessage?.message_id ?? null,
		},
		{ status: 201 },
	);
};

