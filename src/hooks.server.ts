import type { Handle } from "@sveltejs/kit";
import {
	getUserFromSessionCookie,
	SESSION_COOKIE_NAME,
} from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.user = await getUserFromSessionCookie(token ?? undefined);
	return resolve(event);
};
