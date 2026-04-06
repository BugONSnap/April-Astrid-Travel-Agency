import { deleteCloudinaryFileByUrl, uploadImageToCloudinary } from "$lib/server/cloudinaryUpload";

const MAX_BYTES = 3 * 1024 * 1024;

/** Returns a Cloudinary URL (secure_url). */
export async function saveDestinationCoverFile(file: File): Promise<string> {
	const result = await uploadImageToCloudinary(file, {
		folder: "travel-agency/destinations",
		maxBytes: MAX_BYTES,
	});
	return result.secure_url;
}

/** Best-effort deletion for Cloudinary URLs we issued. */
export async function removeStoredDestinationCover(publicPath: string | null | undefined): Promise<void> {
	if (!publicPath) return;
	await deleteCloudinaryFileByUrl(publicPath, "travel-agency");
}

