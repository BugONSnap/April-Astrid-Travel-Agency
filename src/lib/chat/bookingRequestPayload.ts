export type PackageBookingRequestPayloadV1 = {
	v: 1;
	kind: "package";
	packageId: number;
	packageName: string;
	listedPrice: number;
	destinationLine: string | null;
	durationDays: number | null;
	numberOfPeople: number;
	travelDate: string | null;
	note: string | null;
};

export type ServiceBookingRequestPayloadV1 = {
	v: 1;
	kind: "service";
	serviceTitle: string;
	numberOfPeople: number;
	travelDate: string | null;
	note: string | null;
};

export type BookingRequestPayloadV1 = PackageBookingRequestPayloadV1 | ServiceBookingRequestPayloadV1;

export function parseBookingRequestPayload(raw: string): BookingRequestPayloadV1 | null {
	try {
		const o = JSON.parse(raw) as unknown;
		if (!o || typeof o !== "object") return null;
		const p = o as Partial<BookingRequestPayloadV1>;
		if (p.v !== 1 || typeof p.kind !== "string") return null;

		if (p.kind === "package") {
			if (typeof p.packageId !== "number" || typeof p.packageName !== "string") return null;
			if (typeof p.listedPrice !== "number" || typeof p.numberOfPeople !== "number") return null;
			return {
				v: 1,
				kind: "package",
				packageId: p.packageId,
				packageName: p.packageName,
				listedPrice: p.listedPrice,
				destinationLine: typeof p.destinationLine === "string" ? p.destinationLine : null,
				durationDays: typeof p.durationDays === "number" ? p.durationDays : null,
				numberOfPeople: p.numberOfPeople,
				travelDate: typeof p.travelDate === "string" ? p.travelDate : null,
				note: typeof p.note === "string" ? p.note : null,
			};
		}

		if (p.kind === "service") {
			if (typeof p.serviceTitle !== "string" || p.serviceTitle.trim() === "") return null;
			if (typeof p.numberOfPeople !== "number") return null;
			return {
				v: 1,
				kind: "service",
				serviceTitle: p.serviceTitle.trim(),
				numberOfPeople: p.numberOfPeople,
				travelDate: typeof p.travelDate === "string" ? p.travelDate : null,
				note: typeof p.note === "string" ? p.note : null,
			};
		}

		return null;
	} catch {
		return null;
	}
}

export function parsePackageBookingRequestPayload(raw: string): PackageBookingRequestPayloadV1 | null {
	const payload = parseBookingRequestPayload(raw);
	return payload?.kind === "package" ? payload : null;
}

export function formatBookingRequestSummary(p: BookingRequestPayloadV1): string {
	if (p.kind === "package") {
		const dest = p.destinationLine?.trim() || "—";
		const dur = p.durationDays != null ? `${p.durationDays} days` : "—";
		const travel = p.travelDate
			? new Date(`${p.travelDate}T12:00:00`).toLocaleDateString("en-PH", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
			: "TBD";
		const listed = `₱${Number(p.listedPrice).toLocaleString("en-PH")}`;
		const est = `₱${Math.round(p.listedPrice * p.numberOfPeople).toLocaleString("en-PH")}`;
		const lines = [
			"📋 Package booking request",
			`• Package: ${p.packageName}`,
			`• Destination: ${dest}`,
			`• Duration: ${dur}`,
			`• Listed price (per booking): ${listed}`,
			`• Estimated total (${p.numberOfPeople} guest${p.numberOfPeople === 1 ? "" : "s"}): ${est}`,
			`• Preferred travel: ${travel}`,
		];
		if (p.note?.trim()) lines.push(`• Note: ${p.note.trim()}`);
		lines.push("", "— Awaiting staff review (Approve or Deny in admin chat).");
		return lines.join("\n");
	}

	const travel = p.travelDate
		? new Date(`${p.travelDate}T12:00:00`).toLocaleDateString("en-PH", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
		: "TBD";
	const lines = [
		"📋 Service booking request",
		`• Service: ${p.serviceTitle}`,
		`• Number of people: ${p.numberOfPeople}`,
		`• Preferred travel: ${travel}`,
	];
	if (p.note?.trim()) lines.push(`• Note: ${p.note.trim()}`);
	lines.push("", "— Awaiting staff review (Approve or Deny in admin chat).");
	return lines.join("\n");
}
