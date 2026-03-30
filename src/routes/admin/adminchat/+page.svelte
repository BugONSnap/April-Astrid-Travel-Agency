<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { page } from "$app/stores";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	type ChatRow = {
		message_id: number;
		sender_id: number;
		message_text: string;
		message_kind?: string | null;
		booking_id?: number | null;
	};

	let conversations: Array<{
		conversation_id: number;
		user_id: number;
		first_name: string | null;
		last_name: string | null;
	}> = $state([]);
	let selected: (typeof conversations)[0] | null = $state(null);
	let messages: ChatRow[] = $state([]);
	let input = $state("");
	let loadError = $state("");

	let bookingKind = $state<"PACKAGE" | "SERVICE">("PACKAGE");
	let packageId = $state("");
	let serviceTitle = $state("");
	let pax = $state(1);
	let travelDate = $state("");
	let totalPrice = $state("");
	let bookingStatus = $state("CONFIRMED");
	let bookingBusy = $state(false);
	let bookingErr = $state("");

	let adminId = $state(0);
	$effect(() => {
		adminId = (get(page).data.user?.user_id as number | undefined) ?? 0;
	});

	function displayName(c: (typeof conversations)[0]) {
		const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
		return n || `User #${c.user_id}`;
	}

	async function loadConversations() {
		loadError = "";
		try {
			const res = await fetch("/api/auth/chat?scope=conversations");
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				loadError = typeof err.error === "string" ? err.error : `Could not load inbox (${res.status})`;
				conversations = [];
				return;
			}
			const d = await res.json();
			conversations = Array.isArray(d) ? d : [];
		} catch {
			loadError = "Network error loading conversations.";
			conversations = [];
		}
	}

	async function openChat(conv: (typeof conversations)[0]) {
		selected = conv;
		try {
			const res = await fetch(
				`/api/auth/chat?scope=messages&conversationId=${conv.conversation_id}`,
			);
			if (!res.ok) {
				messages = [];
				return;
			}
			messages = await res.json();
		} catch {
			messages = [];
		}
	}

	async function send() {
		if (!input.trim() || !selected) return;

		await fetch("/api/auth/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				conversationId: selected.conversation_id,
				senderId: adminId,
				text: input.trim(),
			}),
		});

		input = "";
		await openChat(selected);
	}

	async function sendBookingConfirmation() {
		if (!selected) return;
		bookingErr = "";
		const priceNum = Number.parseInt(String(totalPrice).replace(/\D/g, ""), 10);
		if (!Number.isFinite(priceNum) || priceNum < 0) {
			bookingErr = "Enter a valid total price.";
			return;
		}
		if (bookingKind === "PACKAGE" && !packageId) {
			bookingErr = "Select a package.";
			return;
		}
		if (bookingKind === "SERVICE" && !serviceTitle.trim()) {
			bookingErr = "Enter a service title (e.g. Visa assistance).";
			return;
		}

		bookingBusy = true;
		try {
			const body: Record<string, unknown> = {
				conversationId: selected.conversation_id,
				kind: bookingKind,
				numberOfPeople: pax,
				travelDate: travelDate.trim() || null,
				totalPrice: priceNum,
				bookingStatus,
			};
			if (bookingKind === "PACKAGE") {
				body.packageId = Number.parseInt(packageId, 10);
			} else {
				body.serviceTitle = serviceTitle.trim();
			}

			const res = await fetch("/api/admin/chat-booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				bookingErr = typeof j.error === "string" ? j.error : "Could not create booking.";
				return;
			}
			packageId = "";
			serviceTitle = "";
			travelDate = "";
			totalPrice = "";
			await openChat(selected);
		} catch {
			bookingErr = "Network error.";
		} finally {
			bookingBusy = false;
		}
	}

	onMount(loadConversations);
</script>

<svelte:head>
	<title>Admin · Support inbox</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Messaging</p>
			<h1 class="ap-title">Support inbox</h1>
			<p class="ap-sub">
				Reply to customers here. Use <strong>Record booking</strong> to create a reservation and send a confirmation
				message in-thread (tours/packages or Services Offered–style service bookings).
			</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	{#if loadError}
		<p class="ap-card ap-empty" role="alert">{loadError}</p>
	{/if}

	<div class="ap-chat">
		<div class="ap-chat-inbox">
			<h2 class="ap-chat-inbox-title">Inbox</h2>
			{#if conversations.length === 0 && !loadError}
				<p class="ap-chat-empty">No conversations yet.</p>
			{/if}
			{#each conversations as c}
				<button
					type="button"
					class="ap-chat-thread-btn"
					class:ap-chat-thread-btn--active={selected?.conversation_id === c.conversation_id}
					onclick={() => openChat(c)}
				>
					{displayName(c)}
					<span class="ap-muted" style="display: block; margin-top: 0.25rem;">User #{c.user_id}</span>
				</button>
			{/each}
		</div>

		<div class="ap-chat-main">
			<div class="ap-chat-banner">
				{selected ? `Thread · ${displayName(selected)}` : "Select a conversation"}
			</div>

			{#if selected}
				<div class="admin-booking-panel">
					<p class="admin-booking-title">Record booking &amp; send confirmation</p>
					<div class="admin-booking-grid">
						<label class="admin-booking-field">
							<span>Type</span>
							<select bind:value={bookingKind} class="ap-select">
								<option value="PACKAGE">Tour / package</option>
								<option value="SERVICE">Service (visa, ticketing, etc.)</option>
							</select>
						</label>
						{#if bookingKind === "PACKAGE"}
							<label class="admin-booking-field">
								<span>Package</span>
								<select bind:value={packageId} class="ap-select">
									<option value="">Choose…</option>
									{#each data.packages as p}
										<option value={String(p.package_id)}>
											{p.package_name} — ₱{p.price.toLocaleString("en-PH")}
										</option>
									{/each}
								</select>
							</label>
						{:else}
							<label class="admin-booking-field ap-span-2">
								<span>Service title</span>
								<input class="ap-input" bind:value={serviceTitle} placeholder="e.g. Tourist visa assistance" />
							</label>
						{/if}
						<label class="admin-booking-field">
							<span>Guests</span>
							<input class="ap-input" type="number" min="1" bind:value={pax} />
						</label>
						<label class="admin-booking-field">
							<span>Travel date</span>
							<input class="ap-input" type="date" bind:value={travelDate} />
						</label>
						<label class="admin-booking-field">
							<span>Total (₱)</span>
							<input class="ap-input" type="number" min="0" bind:value={totalPrice} placeholder="Amount" />
						</label>
						<label class="admin-booking-field">
							<span>Booking status</span>
							<select bind:value={bookingStatus} class="ap-select">
								<option value="CONFIRMED">CONFIRMED</option>
								<option value="PENDING">PENDING</option>
							</select>
						</label>
					</div>
					{#if bookingErr}
						<p class="admin-booking-err" role="alert">{bookingErr}</p>
					{/if}
					<button
						type="button"
						class="ap-btn ap-btn--primary"
						onclick={sendBookingConfirmation}
						disabled={bookingBusy}
					>
						{bookingBusy ? "Saving…" : "Create booking & send notice"}
					</button>
				</div>
			{/if}

			<div class="ap-chat-messages">
				{#each messages as m (m.message_id)}
					<div
						class="ap-chat-bubble"
						class:ap-chat-bubble--booking={m.message_kind === "booking_notice"}
						class:ap-chat-bubble--me={adminId !== 0 && m.sender_id === adminId}
						class:ap-chat-bubble--them={adminId === 0 || m.sender_id !== adminId}
					>
						<pre class="ap-chat-pre">{m.message_text}</pre>
					</div>
				{/each}
			</div>
			<div class="ap-chat-input-row">
				<input
					class="ap-input ap-chat-input"
					bind:value={input}
					placeholder={selected ? "Type a reply…" : "Select a thread first"}
					disabled={!selected}
					onkeydown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							send();
						}
					}}
				/>
				<button
					type="button"
					class="ap-btn ap-btn--primary"
					onclick={send}
					disabled={!selected || !input.trim()}
				>
					Send
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.admin-booking-panel {
		padding: 1rem 1.15rem;
		border-bottom: 1px solid var(--ap-border, rgba(127, 29, 29, 0.12));
		background: linear-gradient(180deg, rgba(196, 30, 58, 0.06), transparent);
	}
	.admin-booking-title {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--ap-ink, #111827);
	}
	.admin-booking-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.65rem;
		margin-bottom: 0.75rem;
	}
	@media (max-width: 640px) {
		.admin-booking-grid {
			grid-template-columns: 1fr;
		}
	}
	.admin-booking-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--ap-muted, #52525b);
	}
	.admin-booking-field.ap-span-2 {
		grid-column: span 2;
	}
	@media (max-width: 640px) {
		.admin-booking-field.ap-span-2 {
			grid-column: span 1;
		}
	}
	.admin-booking-err {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: #b91c1c;
	}
	.ap-chat-bubble--booking {
		border: 1px solid rgba(22, 163, 74, 0.35);
		background: linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(255, 255, 255, 0.95)) !important;
		color: #14532d !important;
		max-width: 95% !important;
	}
	.ap-chat-pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.45;
	}
</style>
