import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

function toInt(v: unknown): number | null {
	if (v == null) return null;
	const n = Number.parseInt(String(v), 10);
	return Number.isFinite(n) ? n : null;
}

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

/** User posts a structured booking *request* into chat (no booking row until admin confirms). */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== "USER") {
		return json({ error: "Please log in as a customer." }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body) {
		return json({ error: "Invalid JSON." }, { status: 400 });
	}

	const packageId = toInt(body.packageId);
	const numberOfPeople = toInt(body.numberOfPeople);
	const note = typeof body.note === "string" ? body.note.trim() : "";
	const travelRaw = body.travelDate;

	if (!packageId || !numberOfPeople || numberOfPeople < 1) {
		return json({ error: "packageId and numberOfPeople are required." }, { status: 400 });
	}

	const pkgRows = await db
		.select({
			package_name: schema.packageTable.package_name,
			price: schema.packageTable.price,
			country: schema.destination.country_name,
			city: schema.destination.city_name,
		})
		.from(schema.packageTable)
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(and(eq(schema.packageTable.package_id, packageId), statusActiveOrNull()))
		.limit(1);

	const pkg = pkgRows[0];
	if (!pkg) {
		return json({ error: "Package not found or inactive." }, { status: 404 });
	}

	let travelLine = "Preferred travel date: TBD";
	if (typeof travelRaw === "string" && travelRaw.trim()) {
		const d = new Date(`${travelRaw.trim()}T12:00:00`);
		if (!Number.isNaN(d.getTime())) {
			travelLine = `Preferred travel date: ${d.toLocaleDateString("en-PH", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})}`;
		}
	}

	const destLabel = [pkg.city, pkg.country].filter(Boolean).join(", ") || pkg.country;
	const lines = [
		"📋 Booking request (package)",
		`• Package: ${pkg.package_name}`,
		`• Destination: ${destLabel}`,
		`• Listed price: ₱${Number(pkg.price).toLocaleString("en-PH")}`,
		`• Guests: ${numberOfPeople}`,
		`• ${travelLine}`,
	];
	if (note) lines.push(`• Note: ${note}`);
	lines.push("", "— Awaiting staff confirmation in this chat.");

	const text = lines.join("\n");

	const existing = await db
		.select()
		.from(schema.conversation)
		.where(eq(schema.conversation.user_id, locals.user.user_id))
		.limit(1);

	let convoId = existing[0]?.conversation_id;
	if (!convoId) {
		const [created] = await db
			.insert(schema.conversation)
			.values({ user_id: locals.user.user_id })
			.returning();
		convoId = created?.conversation_id;
	}
	if (!convoId) {
		return json({ error: "Could not open chat." }, { status: 500 });
	}

	const [createdMessage] = await db
		.insert(schema.message)
		.values({
			conversation_id: convoId,
			sender_id: locals.user.user_id,
			message_text: text,
			message_kind: "text",
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
