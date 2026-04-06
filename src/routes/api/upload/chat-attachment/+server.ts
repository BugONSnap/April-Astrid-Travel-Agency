import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { uploadFileToCloudinary } from "$lib/server/cloudinaryUpload";

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get("file");
	const purpose = formData.get("purpose");

	if (!(file instanceof File)) {
		return json({ error: "No file uploaded" }, { status: 400 });
	}

	if (!purpose || typeof purpose !== "string") {
		return json({ error: "Purpose is required (image, document, or verification)" }, { status: 400 });
	}

	const validPurposes = ["image", "document", "verification"];
	if (!validPurposes.includes(purpose)) {
		return json({ error: "Invalid purpose. Must be: image, document, or verification" }, { status: 400 });
	}

	try {
		const result = await uploadFileToCloudinary(file, {
			folder: "travel-agency/chat-attachments",
			maxBytes: 10 * 1024 * 1024, // 10MB
			purpose,
		});

		return json({
			...result,
			file_url: result.secure_url,
			file_name: file.name,
			file_type: file.type,
			file_size: file.size,
			attachment_purpose: purpose,
		}, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upload failed";
		return json({ error: message }, { status: 400 });
	}
};