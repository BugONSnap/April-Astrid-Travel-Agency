import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq, isNull, gt } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { hashPassword } from "$lib/server/auth";
import { env } from "process";

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

		const { token, newPassword } = body as {
			token?: unknown;
			newPassword?: unknown;
		};

		if (typeof token !== "string" || token.trim() === "") {
			return json({ message: "Reset token is required" }, { status: 400 });
		}
		if (typeof newPassword !== "string" || newPassword.trim().length < 8) {
			return json(
				{ message: "Password must be at least 8 characters" },
				{ status: 400 },
			);
		}

		const tokenHash = hashToken(token);
		const now = new Date();

		const rows = await db
			.select({
				user_id: schema.passwordResetToken.user_id,
			})
			.from(schema.passwordResetToken)
			.where(
				and(
					eq(schema.passwordResetToken.token_hash, tokenHash),
					isNull(schema.passwordResetToken.used_at),
					gt(schema.passwordResetToken.expires_at, now),
				),
			)
			.limit(1);

		const userId = rows[0]?.user_id;
		if (!userId) {
			return json({ message: "Invalid or expired reset token" }, { status: 400 });
		}

		const hashed = await hashPassword(newPassword);

		// Avoid `db.transaction` because some Drizzle drivers/configs might not
		// support it consistently; keep it simple and reliable.
		await db.update(schema.user).set({ password: hashed }).where(eq(schema.user.user_id, userId));

		await db
			.update(schema.passwordResetToken)
			.set({ used_at: new Date() })
			.where(eq(schema.passwordResetToken.token_hash, tokenHash));

		return json({ ok: true });
	} catch (err) {
		console.error("[reset-password] error:", err);
		return json(
			{
				message: "Internal error",
				details: env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined,
			},
			{ status: 500 },
		);
	}
};

