import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
	setSessionCookie,
	verifyPassword,
} from "$lib/server/auth";
import { decryptPayload, encryptPayload } from "$lib/payloadEncryption";

export const POST: RequestHandler = async ({ request, cookies }) => {
	let encryptedBody: unknown;
	try {
		encryptedBody = await request.json();
	} catch {
		return json(await encryptPayload(JSON.stringify({ message: "Invalid JSON body" })), { status: 400 });
	}

	if (!encryptedBody || typeof encryptedBody !== "object") {
		return json(await encryptPayload(JSON.stringify({ message: "Invalid body" })), { status: 400 });
	}

	let bodyJson: string;
	try {
		bodyJson = await decryptPayload(encryptedBody as { iv: string; ciphertext: string });
	} catch {
		return json(await encryptPayload(JSON.stringify({ message: "Invalid encrypted payload" })), { status: 400 });
	}

	const { email, password } = JSON.parse(bodyJson) as Record<string, unknown>;

	if (typeof email !== "string" || typeof password !== "string") {
		return json(await encryptPayload(JSON.stringify({ message: "Email and password are required" })), { status: 400 });
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail || !password) {
		return json(await encryptPayload(JSON.stringify({ message: "Email and password are required" })), { status: 400 });
	}

	const rows = await db
		.select({
			user_id: schema.user.user_id,
			email: schema.user.email,
			password: schema.user.password,
			first_name: schema.user.first_name,
			last_name: schema.user.last_name,
			role: schema.user.role,
			profile_picture: schema.user.profile_picture,
		})
		.from(schema.user)
		.where(eq(schema.user.email, normalizedEmail))
		.limit(1);

	const found = rows[0];
	if (!found) {
		return json({ message: "Invalid email or password" }, { status: 401 });
	}

	const ok = await verifyPassword(password, found.password);
	if (!ok) {
		return json(await encryptPayload(JSON.stringify({ message: "Invalid email or password" })), { status: 401 });
	}

	try {
		setSessionCookie(cookies, found.user_id);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Could not create session";
		console.error("[login] session cookie:", err);
		return json(await encryptPayload(JSON.stringify({ message })), { status: 500 });
	}

	const { password: _p, ...user } = found;
	return json(await encryptPayload(JSON.stringify({ user })));
};
