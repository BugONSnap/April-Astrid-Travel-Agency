import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { env } from "process";

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return json({ message: "Invalid JSON body" }, { status: 400 });
		}

		if (!body || typeof body !== "object") {
			return json({ message: "Invalid body" }, { status: 400 });
		}

		const { email } = body as { email?: unknown };
		if (typeof email !== "string" || email.trim() === "") {
			return json({ message: "Email is required" }, { status: 400 });
		}

		const normalizedEmail = normalizeEmail(email);

		const users = await db
			.select({ user_id: schema.user.user_id })
			.from(schema.user)
			.where(eq(schema.user.email, normalizedEmail))
			.limit(1);

		const userId = users[0]?.user_id;

		// Always return 200 to avoid email enumeration.
		if (!userId) {
			return json({ ok: true });
		}

		// Create token
		const resetToken = randomBytes(32).toString("hex");
		const tokenHash = hashToken(resetToken);
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour

		// Revoke any existing unused tokens for the user
		await db
			.delete(schema.passwordResetToken)
			.where(
				and(
					eq(schema.passwordResetToken.user_id, userId),
					isNull(schema.passwordResetToken.used_at),
					gt(schema.passwordResetToken.expires_at, now),
				),
			);

		await db.insert(schema.passwordResetToken).values({
			user_id: userId,
			token_hash: tokenHash,
			expires_at: expiresAt,
		});

		// For now there is no email sender in this project.
		// In development, return the token so your popup can immediately proceed.
		const debugReturnToken = env.NODE_ENV !== "production";

		return json({
			ok: true,
			resetToken: debugReturnToken ? resetToken : undefined,
		});
	} catch (err) {
		console.error("[forgot-password] error:", err);
		return json(
			{
				message: "Internal error",
				details: env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined,
			},
			{ status: 500 },
		);
	}
};

