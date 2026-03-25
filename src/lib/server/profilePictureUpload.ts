import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"],
	["image/gif", ".gif"],
]);

const PUBLIC_PREFIX = "/uploads/profiles";

function uploadDir(): string {
	return join(process.cwd(), "static", "uploads", "profiles");
}

export async function ensureProfileUploadDir(): Promise<void> {
	await mkdir(uploadDir(), { recursive: true });
}

/** Public URL path (served from `static/`) e.g. `/uploads/profiles/12-abc.jpg` */
export async function saveProfilePictureFile(
	userId: number,
	file: File,
): Promise<string> {
	if (file.size === 0) {
		throw new Error("Choose an image file");
	}
	if (file.size > MAX_BYTES) {
		throw new Error("Image must be at most 2 MB");
	}
	const ext = ALLOWED.get(file.type);
	if (!ext) {
		throw new Error("Use JPEG, PNG, WebP, or GIF");
	}

	await ensureProfileUploadDir();
	const name = `${userId}-${randomBytes(8).toString("hex")}${ext}`;
	const absPath = join(uploadDir(), name);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(absPath, buffer);

	return `${PUBLIC_PREFIX}/${name}`;
}

/** Only removes files we stored under `/uploads/profiles/`. */
export async function removeStoredProfilePicture(
	publicPath: string | null | undefined,
): Promise<void> {
	if (!publicPath || !publicPath.startsWith(`${PUBLIC_PREFIX}/`)) {
		return;
	}
	const rel = publicPath.slice(1);
	const abs = join(process.cwd(), "static", rel);
	await unlink(abs).catch(() => undefined);
}
