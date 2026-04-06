import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq, isNull, or } from "drizzle-orm";
import {
	formatBookingRequestSummary,
	type PackageBookingRequestPayloadV1,
} from "$lib/chat/bookingRequestPayload";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { decryptPayload, encryptPayload, type EncryptedPayload } from "$lib/payloadEncryption";

function toInt(v: unknown): number | null {
	if (v == null) return null;
	const n = Number.parseInt(String(v), 10);
	return Number.isFinite(n) ? n : null;
}

function statusActiveOrNull() {
	return or(eq(schema.packageTable.status, "active"), isNull(schema.packageTable.status));
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== "USER") {
		return json(await encryptPayload(JSON.stringify({ error: "Please log in as a customer." })), { status: 401 });
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

	const packageId = toInt(body.packageId);
	const numberOfPeople = toInt(body.numberOfPeople);
	const note = typeof body.note === "string" ? body.note.trim() : "";
	const travelRaw = body.travelDate;

	if (!packageId || !numberOfPeople || numberOfPeople < 1) {
		return json(await encryptPayload(JSON.stringify({ error: "packageId and numberOfPeople are required." })), { status: 400 });
	}

	const pkgRows = await db
		.select({
			package_name: schema.packageTable.package_name,
			price: schema.packageTable.price,
			duration_days: schema.packageTable.duration_days,
			country: schema.destination.country_name,
			city: schema.destination.city_name,
		})
		.from(schema.packageTable)
		.innerJoin(schema.destination, eq(schema.packageTable.destination_id, schema.destination.destination_id))
		.where(and(eq(schema.packageTable.package_id, packageId), statusActiveOrNull()))
		.limit(1);

	const pkg = pkgRows[0];
	if (!pkg) {
		return json(await encryptPayload(JSON.stringify({ error: "Package not found or inactive." })), { status: 404 });
	}

	const destLabel = [pkg.city, pkg.country].filter(Boolean).join(", ") || pkg.country;
	let travelDate: string | null = null;
	if (typeof travelRaw === "string" && travelRaw.trim()) {
		const d = new Date(`${travelRaw.trim()}T12:00:00`);
		if (!Number.isNaN(d.getTime())) {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			travelDate = `${y}-${m}-${day}`;
		}
	}

	const payload: PackageBookingRequestPayloadV1 = {
		v: 1,
		kind: "package",
		packageId,
		packageName: pkg.package_name,
		listedPrice: Number(pkg.price) || 0,
		destinationLine: destLabel,
		durationDays: pkg.duration_days,
		numberOfPeople,
		travelDate,
		note: note || null,
	};

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
		return json(await encryptPayload(JSON.stringify({ error: "Could not open chat." })), { status: 500 });
	}

	const [createdMessage] = await db
		.insert(schema.message)
		.values({
			conversation_id: convoId,
			sender_id: locals.user.user_id,
			message_text: JSON.stringify(payload),
			message_kind: "booking_request",
			request_status: "PENDING",
		})
		.returning();

	return json(
		await encryptPayload(JSON.stringify({
			ok: true,
			conversationId: convoId,
			messageId: createdMessage?.message_id ?? null,
			summary: formatBookingRequestSummary(payload),
			sync: { pollRecommendedMs: 12_000 },
		})),
		{ status: 201 },
	);
};
