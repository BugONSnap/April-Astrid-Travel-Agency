import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"],
	["image/gif", ".gif"],
]);

const PUBLIC_PREFIX = "/uploads/destinations";

function uploadDir(): string {
	return join(process.cwd(), "static", "uploads", "destinations");
}

export async function ensureDestinationUploadDir(): Promise<void> {
	await mkdir(uploadDir(), { recursive: true });
}

/** Public URL path (served from `static/`) e.g. `/uploads/destinations/abc.jpg` */
export async function saveDestinationCoverFile(file: File): Promise<string> {
	if (file.size === 0) throw new Error("Choose an image file");
	if (file.size > MAX_BYTES) throw new Error("Image must be at most 3 MB");

	const ext = ALLOWED.get(file.type);
	if (!ext) throw new Error("Use JPEG, PNG, WebP, or GIF");

	await ensureDestinationUploadDir();

	const name = `${randomBytes(8).toString("hex")}${ext}`;
	const absPath = join(uploadDir(), name);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(absPath, buffer);

	return `${PUBLIC_PREFIX}/${name}`;
}

/** Only removes files we stored under `/uploads/destinations/`. */
export async function removeStoredDestinationCover(publicPath: string | null | undefined): Promise<void> {
	if (!publicPath || !publicPath.startsWith(`${PUBLIC_PREFIX}/`)) return;

	const rel = publicPath.slice(1); // drop leading '/'
	const abs = join(process.cwd(), "static", rel);
	await unlink(abs).catch(() => undefined);
}

