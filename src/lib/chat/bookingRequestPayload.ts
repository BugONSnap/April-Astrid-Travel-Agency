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

export function parsePackageBookingRequestPayload(raw: string): PackageBookingRequestPayloadV1 | null {
	try {
		const o = JSON.parse(raw) as unknown;
		if (!o || typeof o !== "object") return null;
		const p = o as Partial<PackageBookingRequestPayloadV1>;
		if (p.v !== 1 || p.kind !== "package") return null;
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
	} catch {
		return null;
	}
}

export function formatBookingRequestSummary(p: PackageBookingRequestPayloadV1): string {
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
