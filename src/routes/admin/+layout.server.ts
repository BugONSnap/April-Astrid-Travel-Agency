import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { isStaffRole } from "$lib/server/auth";

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !isStaffRole(locals.user.role)) {
		throw redirect(303, "/login");
	}

	return { user: locals.user };
};

