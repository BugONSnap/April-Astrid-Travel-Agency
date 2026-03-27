import { deleteCloudinaryImageByUrl, uploadImageToCloudinary } from "$lib/server/cloudinaryUpload";

const MAX_BYTES = 2 * 1024 * 1024;

/** Returns a Cloudinary URL (secure_url). */
export async function saveProfilePictureFile(
	userId: number,
	file: File,
): Promise<string> {
	const result = await uploadImageToCloudinary(file, {
		folder: `travel-agency/profiles/${userId}`,
		maxBytes: MAX_BYTES,
	});
	return result.secure_url;
}

/** Best-effort deletion for Cloudinary URLs we issued. */
export async function removeStoredProfilePicture(
	publicPath: string | null | undefined,
): Promise<void> {
	if (!publicPath) {
		return;
	}
	await deleteCloudinaryImageByUrl(publicPath, "travel-agency");
}
