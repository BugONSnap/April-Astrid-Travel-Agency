import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// Allow client-side navigations to refresh auth state on demand.
	depends("app:auth");
	return { user: locals.user };
};
