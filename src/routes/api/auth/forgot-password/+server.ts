import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { env } from "process";
import { decryptPayload, encryptPayload } from "$lib/payloadEncryption";

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export const POST: RequestHandler = async ({ request }) => {
	try {
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

		const { email } = JSON.parse(bodyJson) as { email?: unknown };
		if (typeof email !== "string" || email.trim() === "") {
			return json(await encryptPayload(JSON.stringify({ message: "Email is required" })), { status: 400 });
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
			return json(await encryptPayload(JSON.stringify({ ok: true })));
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

		return json(await encryptPayload(JSON.stringify({
			ok: true,
			resetToken: debugReturnToken ? resetToken : undefined,
		})));
	} catch (err) {
		console.error("[forgot-password] error:", err);
		return json(
			await encryptPayload(JSON.stringify({
				message: "Internal error",
				details: env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined,
			})),
			{ status: 500 },
		);
	}
};

