import "dotenv/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Cookies } from "@sveltejs/kit";
import { env } from "process";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
const SALT_ROUNDS = 10;

export type PublicUser = {
	user_id: number;
	email: string;
	first_name: string;
	last_name: string;
	role: "USER" | "ADMIN" | "SUPERADMIN";
	/** Public URL path e.g. `/uploads/profiles/…` */
	profile_picture: string | null;
};

export function isStaffRole(
	role: string,
): role is "ADMIN" | "SUPERADMIN" {
	return role === "ADMIN" || role === "SUPERADMIN";
}

function getAuthSecret(): string {
	const secret = env.AUTH_SECRET?.trim();
	if (!secret || secret.length < 16) {
		throw new Error(
			"AUTH_SECRET must be set in .env (min 16 characters). Used to sign session cookies.",
		);
	}
	return secret;
}

export async function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
	plain: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}

export function createSessionToken(userId: number): string {
	const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
	const payload = JSON.stringify({ uid: userId, exp });
	const b64 = Buffer.from(payload, "utf8").toString("base64url");
	const sig = createHmac("sha256", getAuthSecret())
		.update(b64)
		.digest("base64url");
	return `${b64}.${sig}`;
}

export function readSessionToken(token: string): number | null {
	const parts = token.split(".");
	if (parts.length !== 2) return null;
	const [b64, sig] = parts;
	if (!b64 || !sig) return null;

	const expected = createHmac("sha256", getAuthSecret())
		.update(b64)
		.digest("base64url");

	const sigBuf = Buffer.from(sig, "utf8");
	const expBuf = Buffer.from(expected, "utf8");
	if (sigBuf.length !== expBuf.length) return null;
	if (!timingSafeEqual(sigBuf, expBuf)) return null;

	let payload: { uid?: number; exp?: number };
	try {
		payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
	} catch {
		return null;
	}
	if (typeof payload.uid !== "number" || typeof payload.exp !== "number")
		return null;
	if (payload.exp < Math.floor(Date.now() / 1000)) return null;
	return payload.uid;
}

export function setSessionCookie(cookies: Cookies, userId: number): void {
	const token = createSessionToken(userId);
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: SESSION_MAX_AGE_SEC,
		secure: env.NODE_ENV === "production",
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
}

export async function getPublicUserById(
	userId: number,
): Promise<PublicUser | null> {
	const rows = await db
		.select({
			user_id: schema.user.user_id,
			email: schema.user.email,
			first_name: schema.user.first_name,
			last_name: schema.user.last_name,
			role: schema.user.role,
			profile_picture: schema.user.profile_picture,
		})
		.from(schema.user)
		.where(eq(schema.user.user_id, userId))
		.limit(1);

	const row = rows[0];
	return row ?? null;
}

export async function getUserFromSessionCookie(
	token: string | undefined,
): Promise<PublicUser | null> {
	if (!token) return null;
	const userId = readSessionToken(token);
	if (userId == null) return null;
	return getPublicUserById(userId);
}
