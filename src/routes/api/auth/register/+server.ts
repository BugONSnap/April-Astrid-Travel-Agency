import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { hashPassword, setSessionCookie } from "$lib/server/auth";

const MIN_PASSWORD_LEN = 8;

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (!body || typeof body !== "object") {
		return json({ message: "Invalid body" }, { status: 400 });
	}

	const {
		email,
		password,
		first_name,
		last_name,
	} = body as Record<string, unknown>;

	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		typeof first_name !== "string" ||
		typeof last_name !== "string"
	) {
		return json(
			{
				message:
					"email, password, first_name, and last_name are required strings",
			},
			{ status: 400 },
		);
	}

	const normalizedEmail = email.trim().toLowerCase();
	const fn = first_name.trim();
	const ln = last_name.trim();

	if (!normalizedEmail || !fn || !ln) {
		return json(
			{ message: "Email, first name, and last name must not be empty" },
			{ status: 400 },
		);
	}

	if (password.length < MIN_PASSWORD_LEN) {
		return json(
			{ message: `Password must be at least ${MIN_PASSWORD_LEN} characters` },
			{ status: 400 },
		);
	}

	const existing = await db
		.select({ user_id: schema.user.user_id })
		.from(schema.user)
		.where(eq(schema.user.email, normalizedEmail))
		.limit(1);

	if (existing.length > 0) {
		return json({ message: "An account with this email already exists" }, { status: 409 });
	}

	const passwordHash = await hashPassword(password);

	const publicFields = {
		user_id: schema.user.user_id,
		email: schema.user.email,
		first_name: schema.user.first_name,
		last_name: schema.user.last_name,
		role: schema.user.role,
		profile_picture: schema.user.profile_picture,
	} as const;

	const inserted = await db
		.insert(schema.user)
		.values({
			email: normalizedEmail,
			password: passwordHash,
			first_name: fn,
			last_name: ln,
			role: "USER",
		})
		.returning(publicFields);

	// PgBouncer transaction pool mode often omits RETURNING rows even when the insert succeeds.
	let user = inserted[0];
	if (!user) {
		const rows = await db
			.select(publicFields)
			.from(schema.user)
			.where(eq(schema.user.email, normalizedEmail))
			.limit(1);
		user = rows[0];
	}

	if (!user) {
		return json({ message: "Registration failed" }, { status: 500 });
	}

	try {
		setSessionCookie(cookies, user.user_id);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Could not create session";
		console.error("[register] session cookie:", err);
		return json({ message }, { status: 500 });
	}

	return json({ user });
};
