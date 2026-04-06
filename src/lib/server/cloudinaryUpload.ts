import type { UploadApiResponse } from "cloudinary";
import { getCloudinary } from "$lib/server/cloudinaryClient";

const DEFAULT_FOLDER = "travel-agency";

const ALLOWED_IMAGES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

const ALLOWED_DOCUMENTS = new Set([
	"application/pdf",
	"text/plain",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type CloudinaryUploadResult = Pick<
	UploadApiResponse,
	"secure_url" | "public_id" | "width" | "height" | "format" | "bytes"
>;

export async function uploadImageToCloudinary(
	file: File,
	opts?: { folder?: string; maxBytes?: number },
): Promise<CloudinaryUploadResult> {
	if (file.size === 0) throw new Error("Choose an image file");
	if (!ALLOWED_IMAGES.has(file.type)) throw new Error("Use JPEG, PNG, WebP, or GIF");

	const maxBytes = opts?.maxBytes ?? 5 * 1024 * 1024;
	if (file.size > maxBytes) throw new Error(`Image must be at most ${Math.round(maxBytes / (1024 * 1024))} MB`);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const cloudinary = getCloudinary();
	const folder = opts?.folder ?? DEFAULT_FOLDER;

	const result = (await new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder,
					resource_type: "image",
				},
				(error, r) => {
					if (error) {
						reject(error);
						return;
					}
					if (!r) {
						reject(new Error("Upload failed"));
						return;
					}
					resolve(r);
				},
			)
			.end(buffer);
	}));

	return {
		secure_url: result.secure_url,
		public_id: result.public_id,
		width: result.width,
		height: result.height,
		format: result.format,
		bytes: result.bytes,
	};
}

export async function uploadFileToCloudinary(
	file: File,
	opts?: { folder?: string; maxBytes?: number; purpose?: string },
): Promise<CloudinaryUploadResult> {
	if (file.size === 0) throw new Error("Choose a file");
	
	const isImage = ALLOWED_IMAGES.has(file.type);
	const isDocument = ALLOWED_DOCUMENTS.has(file.type);
	
	if (!isImage && !isDocument) {
		throw new Error("Use images (JPEG, PNG, WebP, GIF) or documents (PDF, DOC, DOCX, TXT)");
	}

	const maxBytes = opts?.maxBytes ?? 10 * 1024 * 1024; // 10MB for documents
	if (file.size > maxBytes) throw new Error(`File must be at most ${Math.round(maxBytes / (1024 * 1024))} MB`);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const cloudinary = getCloudinary();
	const folder = opts?.folder ?? DEFAULT_FOLDER;
	const resourceType = isImage ? "image" : "raw";

	const result = (await new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder,
					resource_type: resourceType,
				},
				(error, r) => {
					if (error) {
						reject(error);
						return;
					}
					if (!r) {
						reject(new Error("Upload failed"));
						return;
					}
					resolve(r);
				},
			)
			.end(buffer);
	}));

	return {
		secure_url: result.secure_url,
		public_id: result.public_id,
		width: result.width,
		height: result.height,
		format: result.format,
		bytes: result.bytes,
	};
}

export function inferCloudinaryPublicIdFromUrl(url: string, folder = DEFAULT_FOLDER): string | null {
	try {
		const u = new URL(url);
		// common patterns:
		// https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<public_id>.<ext>
		// https://res.cloudinary.com/<cloud>/image/upload/<folder>/<public_id>.<ext>
		// https://res.cloudinary.com/<cloud>/raw/upload/v123/<folder>/<public_id>.<ext>
		// https://res.cloudinary.com/<cloud>/raw/upload/<folder>/<public_id>.<ext>
		const imageIdx = u.pathname.indexOf("/image/upload/");
		const rawIdx = u.pathname.indexOf("/raw/upload/");
		const idx = imageIdx !== -1 ? imageIdx : rawIdx;
		const resourceType = imageIdx !== -1 ? "image" : "raw";
		
		if (idx === -1) return null;
		let rest = u.pathname.slice(idx + `/${resourceType}/upload/`.length);
		if (rest.startsWith("v")) {
			const slash = rest.indexOf("/");
			if (slash !== -1) rest = rest.slice(slash + 1);
		}
		if (!rest.startsWith(`${folder}/`)) return null;
		rest = rest.slice(folder.length + 1);
		const dot = rest.lastIndexOf(".");
		return dot === -1 ? rest : rest.slice(0, dot);
	} catch {
		return null;
	}
}

export async function deleteCloudinaryFileByUrl(url: string, folder = DEFAULT_FOLDER): Promise<void> {
	const publicIdTail = inferCloudinaryPublicIdFromUrl(url, folder);
	if (!publicIdTail) return;
	const cloudinary = getCloudinary();
	
	// Try to delete as image first, then as raw
	try {
		await cloudinary.uploader.destroy(`${folder}/${publicIdTail}`, { resource_type: "image" });
	} catch {
		try {
			await cloudinary.uploader.destroy(`${folder}/${publicIdTail}`, { resource_type: "raw" });
		} catch {
			// Ignore deletion errors
		}
	}
}

