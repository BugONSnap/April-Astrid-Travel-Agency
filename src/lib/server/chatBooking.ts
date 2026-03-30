import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";

export type BookingFromChatParams = {
	conversationId: number;
	customerUserId: number;
	adminUserId: number;
	kind: "PACKAGE" | "SERVICE";
	packageId?: number;
	serviceTitle?: string;
	numberOfPeople: number;
	travelDate: Date | null;
	totalPrice: number;
	bookingStatus: (typeof schema.BOOKING_STATUS)[number];
};

export function formatBookingNoticeMessage(params: {
	bookingId: number;
	title: string;
	numberOfPeople: number;
	travelDate: Date | null;
	totalPrice: number;
	status: string;
}): string {
	const travel = params.travelDate
		? params.travelDate.toLocaleDateString("en-PH", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: "TBD";
	const price = `₱${Number(params.totalPrice).toLocaleString("en-PH")}`;
	return [
		"✅ Booking recorded",
		"",
		`Reference #${params.bookingId}`,
		`• ${params.title}`,
		`• Travel: ${travel}`,
		`• Guests: ${params.numberOfPeople}`,
		`• Total: ${price}`,
		`• Status: ${params.status}`,
		"",
		"View details under My Bookings on your profile.",
	].join("\n");
}

export async function createBookingFromChatAndNotify(
	params: BookingFromChatParams,
): Promise<{ booking_id: number; message_id: number }> {
	const isPackage = params.kind === "PACKAGE";
	if (isPackage && (!params.packageId || params.packageId < 1)) {
		throw new Error("Invalid package");
	}
	if (!isPackage && !params.serviceTitle?.trim()) {
		throw new Error("Service title required");
	}

	let title = "";
	if (isPackage) {
		const pk = await db
			.select({ package_name: schema.packageTable.package_name })
			.from(schema.packageTable)
			.where(eq(schema.packageTable.package_id, params.packageId!))
			.limit(1);
		title = pk[0]?.package_name ?? "Package";
	} else {
		title = params.serviceTitle!.trim();
	}

	const [inserted] = await db
		.insert(schema.booking)
		.values({
			user_id: params.customerUserId,
			package_id: isPackage ? params.packageId! : null,
			conversation_id: params.conversationId,
			booking_kind: params.kind,
			service_title: isPackage ? null : params.serviceTitle!.trim(),
			travel_date: params.travelDate,
			number_of_people: params.numberOfPeople,
			total_price: params.totalPrice,
			booking_status: params.bookingStatus,
			payment_status: "UNPAID",
		})
		.returning({ booking_id: schema.booking.booking_id });

	const bookingId = inserted?.booking_id;
	if (!bookingId) throw new Error("Failed to create booking");

	const text = formatBookingNoticeMessage({
		bookingId,
		title,
		numberOfPeople: params.numberOfPeople,
		travelDate: params.travelDate,
		totalPrice: params.totalPrice,
		status: params.bookingStatus,
	});

	const [msg] = await db
		.insert(schema.message)
		.values({
			conversation_id: params.conversationId,
			sender_id: params.adminUserId,
			message_text: text,
			message_kind: "booking_notice",
			booking_id: bookingId,
		})
		.returning({ message_id: schema.message.message_id });

	if (!msg?.message_id) throw new Error("Failed to create message");

	return { booking_id: bookingId, message_id: msg.message_id };
}
