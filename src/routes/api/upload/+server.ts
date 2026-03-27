import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { uploadImageToCloudinary } from "$lib/server/cloudinaryUpload";

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get("file");
	const folder = formData.get("folder");

	if (!(file instanceof File)) {
		return json({ error: "No file uploaded" }, { status: 400 });
	}

	try {
		const result = await uploadImageToCloudinary(file, {
			folder: typeof folder === "string" && folder.trim() ? folder.trim() : undefined,
		});
		return json(result, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upload failed";
		return json({ error: message }, { status: 400 });
	}
};

