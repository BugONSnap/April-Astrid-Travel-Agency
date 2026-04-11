<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { page } from "$app/stores";
	import {
		formatBookingRequestSummary,
		parseBookingRequestPayload,
	} from "$lib/chat/bookingRequestPayload";
	import { encryptPayload, decryptPayload } from "$lib/payloadEncryption";
	import type { PageProps } from "./$types";
	import { tick } from "svelte";

	
	let { data }: PageProps = $props();

	type ChatRow = {
		message_id: number;
		sender_id: number;
		message_text: string;
		sent_at: string;
		message_kind?: string | null;
		booking_id?: number | null;
		request_status?: string | null;
		file_url?: string | null;
		file_name?: string | null;
		file_type?: string | null;
		file_size?: number | null;
		attachment_purpose?: string | null;
		is_seen?: boolean;
	};

	let conversations: Array<{
		conversation_id: number;
		user_id: number;
		first_name: string | null;
		last_name: string | null;
		unread_count?: number;
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
	let requestActionBusy = $state<{ id: number; action: "approve" | "deny" } | null>(null);

	let adminId = $state(0);
	let selectedFile: File | null = $state(null);
	let isUploading = $state(false);
	let sendingQRs = $state(false);
	let isTyping = $state(false);
	let isOnline = $state(false);
	let bottomChatEl: HTMLDivElement | null = $state(null);
	let lastSendTime = $state(0);
	$effect(() => {
		adminId = (get(page).data.user?.user_id as number | undefined) ?? 0;
	});

	function scrollToBottom() {
		if (!bottomChatEl) return;
		setTimeout(() => {
			bottomChatEl?.scrollIntoView({ behavior: "smooth", block: "end" });
		}, 0);
	}

	async function markMessagesAsRead() {
		if (!selected) return;
		try {
			const unreadMessageIds = messages
				.filter((m) => m.sender_id !== adminId && !m.is_seen)
				.map((m) => m.message_id);

			if (unreadMessageIds.length === 0) return;

			const body = { messageIds: unreadMessageIds };
			const encryptedBody = await encryptPayload(JSON.stringify(body));

			const res = await fetch("/api/auth/chat-mark-read", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});

			if (res.ok) {
				for (const id of unreadMessageIds) {
					const msg = messages.find((m) => m.message_id === id);
					if (msg) msg.is_seen = true;
				}
				messages = messages;
			}
		} catch {
			// Silently fail on mark as read
		}
	}

	function displayName(c: (typeof conversations)[0]) {
		const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
		return n || `User #${c.user_id}`;
	}

	async function loadConversations() {
		loadError = "";
		try {
			const res = await fetch("/api/auth/chat?scope=conversations");
			if (!res.ok) {
				const encryptedErrText = await res.text();
				let err: any = {};
				try {
					const encryptedErr = JSON.parse(encryptedErrText);
					err = JSON.parse(await decryptPayload(encryptedErr));
				} catch {
					err = {};
				}
				loadError = typeof err.error === "string" ? err.error : `Could not load inbox (${res.status})`;
				conversations = [];
				return;
			}
			const encryptedDataText = await res.text();
			const encryptedData = JSON.parse(encryptedDataText);
			const dataStr = await decryptPayload(encryptedData);
			const d = JSON.parse(dataStr);
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
			const encryptedDataText = await res.text();
			const encryptedData = JSON.parse(encryptedDataText);
			const dataStr = await decryptPayload(encryptedData);
			messages = JSON.parse(dataStr);
			isTyping = false;
			isOnline = true;
			await tick();
			scrollToBottom();
			await markMessagesAsRead();
		} catch {
			messages = [];
		}
	}

	async function send() {
		if (!input.trim() || !selected) return;

		const body = {
			conversationId: selected.conversation_id,
			senderId: adminId,
			text: input.trim(),
		};
		const encryptedBody = await encryptPayload(JSON.stringify(body));

		const res = await fetch("/api/auth/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(encryptedBody),
		});
		if (res.ok) {
			await loadConversations();
		}

		input = "";
		await openChat(selected);
	}

	async function uploadFile(file: File, purpose: string): Promise<{
		file_url: string;
		file_name: string;
		file_type: string;
		file_size: number;
		attachment_purpose: string;
	}> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("purpose", purpose);

		const response = await fetch("/api/upload/chat-attachment", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Upload failed");
		}

		return await response.json();
	}

	async function sendAttachment(purpose: "image" | "document" | "verification") {
		if (!selectedFile || !selected) return;

		const file = selectedFile;
		selectedFile = null;

		try {
			const uploadResult = await uploadFile(file, purpose);

			const body = {
				conversationId: selected.conversation_id,
				senderId: adminId,
				messageKind: purpose,
				fileUrl: uploadResult.file_url,
				fileName: uploadResult.file_name,
				fileType: uploadResult.file_type,
				fileSize: uploadResult.file_size,
				attachmentPurpose: uploadResult.attachment_purpose,
			};
			const encryptedBody = await encryptPayload(JSON.stringify(body));

			const res = await fetch("/api/auth/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});
			if (res.ok) {
				await loadConversations();
			}

			await openChat(selected);
		} catch (error) {
			loadError = error instanceof Error ? error.message : "Upload failed";
		}
	}

	async function sendQRPaymentCodes() {
		if (!selected) return;
		sendingQRs = true;
		bookingErr = "";
		
		try {
			// Fetch the 2 QR code images from static folder
			const qrUrls = [
				"/BPIQR.jpg", // Update with your actual QR code paths
				"/GCASHQR.jpg"  // Update with your actual QR code paths
			];
			
			// Send both QR codes as image messages simultaneously
			const sendPromises = qrUrls.map(async (fileUrl, index) => {
				const fileName = `Payment-QR-${index + 1}.png`;
				const body = {
					conversationId: selected.conversation_id,
					senderId: adminId,
					messageKind: "image",
					fileUrl: fileUrl,
					fileName: fileName,
					fileType: "image/png",
					fileSize: 0,
					attachmentPurpose: "payment_qr",
				};
				const encryptedBody = await encryptPayload(JSON.stringify(body));

				const res = await fetch("/api/auth/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(encryptedBody),
				});
				if (!res.ok) {
					throw new Error(`Failed to send QR code ${index + 1}`);
				}
			});

			await Promise.all(sendPromises);
			await loadConversations();
			await openChat(selected);
		} catch (error) {
			bookingErr = error instanceof Error ? error.message : "Failed to send QR codes";
		} finally {
			sendingQRs = false;
		}
	}

	async function actOnBookingRequest(messageId: number, action: "approve" | "deny") {
		if (!selected || requestActionBusy !== null) return;
		requestActionBusy = { id: messageId, action };
		bookingErr = "";
		try {
			const body = { messageId, action };
			const encryptedBody = await encryptPayload(JSON.stringify(body));

			const res = await fetch("/api/admin/booking-request-action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});
			if (!res.ok) {
				const encryptedResponse = await res.text();
				let j: any = {};
				try {
					j = JSON.parse(await decryptPayload(encryptedResponse));
				} catch {
					j = {};
				}
				bookingErr = typeof j.error === "string" ? j.error : "Could not update request.";
				return;
			}
			await openChat(selected);
		} catch {
			bookingErr = "Network error.";
		} finally {
			requestActionBusy = null;
		}
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

			const encryptedBody = await encryptPayload(JSON.stringify(body));

			const res = await fetch("/api/admin/chat-booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});
			if (!res.ok) {
				const encryptedResponse = await res.text();
				let j: any = {};
				try {
					j = JSON.parse(await decryptPayload(encryptedResponse));
				} catch {
					j = {};
				}
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

	let typingTimeout: NodeJS.Timeout | null = null;

	async function notifyTyping() {
		if (!selected) return;
		try {
			const body = { conversationId: selected.conversation_id, isTyping: true };
			const encryptedBody = await encryptPayload(JSON.stringify(body));
			await fetch("/api/auth/chat-typing", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});
		} catch {
			// Silently fail
		}
	}

	onMount(() => {
		void loadConversations();
		const inboxMs = 15_000;
		const id = setInterval(() => {
			if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
			void loadConversations();
		}, inboxMs);
		return () => clearInterval(id);
	});

	/** Refresh open thread so booking confirmations from Record booking appear without manual refresh. */
	$effect(() => {
		const conv = selected;
		if (!conv) return;
		const threadMs = 8_000;
		const id = setInterval(() => {
			if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
			void openChat(conv);
		}, threadMs);
		return () => clearInterval(id);
	});

	/** Track typing status and online presence **/
	$effect(() => {
		const conv = selected;
		if (!conv) return;
		const presenceMs = 3_000;
		const id = setInterval(async () => {
			if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
			try {
				const res = await fetch(`/api/auth/chat-presence?conversationId=${conv.conversation_id}`);
				if (res.ok) {
					const encryptedDataText = await res.text();
					const encryptedData = JSON.parse(encryptedDataText);
					const { decryptPayload } = await import("$lib/payloadEncryption");
					const dataStr = await decryptPayload(encryptedData);
					const data = JSON.parse(dataStr);
					isTyping = data.isTyping ?? false;
					isOnline = data.isOnline ?? false;
				}
			} catch {
				// Silently fail
			}
		}, presenceMs);
		return () => clearInterval(id);
	});
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
					<div class="flex justify-between items-center w-full">
						<div>
							{displayName(c)}
							<span class="ap-muted" style="display: block; margin-top: 0.25rem;">User #{c.user_id}</span>
						</div>
						{#if c.unread_count && c.unread_count > 0}
							<span class="ap-unread-badge">{c.unread_count}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<div class="ap-chat-main">
			<div class="ap-chat-banner">
				<div class="flex items-center gap-2">
					<span>{selected ? `Thread · ${displayName(selected)}` : "Select a conversation"}</span>
					{#if selected && isOnline}
						<span class="ap-online-indicator" title="User is online"></span>
					{/if}
				</div>
				{#if selected && isTyping}
					<span class="ap-typing-indicator">User is typing...</span>
				{/if}
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
								<span>Service (from Services Offered)</span>
								<select bind:value={serviceTitle} class="ap-select">
									<option value="">Choose…</option>
									{#each data.servicesOffered as title}
										<option value={title}>{title}</option>
									{/each}
								</select>
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
					<div class="admin-booking-actions">
						<button
							type="button"
							class="ap-btn ap-btn--primary"
							onclick={sendBookingConfirmation}
							disabled={bookingBusy}
						>
							{bookingBusy ? "Saving…" : "Create booking & send notice"}
						</button>
						<button
							type="button"
							class="ap-btn ap-btn--secondary"
							onclick={sendQRPaymentCodes}
							disabled={sendingQRs}
							title="Send both payment QR codes at once"
						>
							{sendingQRs ? "Sending QRs…" : "📱 Send 2 Payment QR Codes"}
						</button>
					</div>
				</div>
			{/if}

			<div class="ap-chat-messages ap-scrollbar" bind:this={bottomChatEl}>
				{#each messages as m (m.message_id)}
					{#if m.message_kind === "booking_request"}
						{@const reqPayload = parseBookingRequestPayload(m.message_text)}
						{@const reqStatus = m.request_status ?? "PENDING"}
						<div
							class="ap-chat-bubble ap-chat-bubble--request"
							class:ap-chat-bubble--them={true}
						>
							<p class="ap-request-kicker">Booking request</p>
							{#if reqPayload}
								<pre class="ap-chat-pre">{formatBookingRequestSummary(reqPayload)}</pre>
							{:else}
								<pre class="ap-chat-pre">{m.message_text}</pre>
							{/if}
							<p class="ap-request-status">
								Status:
								<strong>{reqStatus}</strong>
							</p>
							{#if reqStatus === "PENDING" && adminId !== 0}
								<div class="ap-request-actions">
									<button
										type="button"
										class="ap-btn ap-btn--primary ap-btn--sm"
										disabled={requestActionBusy !== null}
										onclick={() => actOnBookingRequest(m.message_id, "approve")}
									>
										{requestActionBusy?.id === m.message_id && requestActionBusy?.action === "approve"
											? "Working…"
											: "Approve"}
									</button>
									<button
										type="button"
										class="ap-btn ap-btn--secondary ap-btn--sm"
										disabled={requestActionBusy !== null}
										onclick={() => actOnBookingRequest(m.message_id, "deny")}
									>
										{requestActionBusy?.id === m.message_id && requestActionBusy?.action === "deny"
											? "Working…"
											: "Deny"}
									</button>
								</div>
							{/if}
							<div class="flex items-center justify-end gap-1">
								<p class="ap-chat-timestamp">{new Date(m.sent_at).toLocaleString()}</p>
								{#if adminId !== 0 && m.sender_id === adminId && m.is_seen}
									<svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
								{/if}
							</div>
						</div>
					{:else}
						<div
							class="ap-chat-bubble"
							class:ap-chat-bubble--booking={m.message_kind === "booking_notice"}
							class:ap-chat-bubble--me={adminId !== 0 && m.sender_id === adminId}
							class:ap-chat-bubble--them={adminId === 0 || m.sender_id !== adminId}
						>
							{#if m.message_kind === "image" && m.file_url}
								<div class="space-y-2">
									{#if m.file_name}
										<p class="text-xs opacity-75">{m.file_name}</p>
									{/if}
									<img 
										src={m.file_url} 
										alt={m.file_name || "Attachment"} 
										class="max-w-full rounded-lg cursor-pointer hover:opacity-90 max-h-64"
										onclick={() => window.open(m.file_url!, '_blank')}
									/>
									{#if m.attachment_purpose}
										<p class="text-xs opacity-75">Purpose: {m.attachment_purpose}</p>
									{/if}
								</div>
							{:else if m.message_kind === "document" && m.file_url}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
										</svg>
										<div>
											<p class="font-medium text-sm">{m.file_name}</p>
											{#if m.file_size}
												<p class="text-xs opacity-75">{Math.round(m.file_size / 1024)} KB</p>
											{/if}
										</div>
									</div>
									<button
										type="button"
										class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
										onclick={() => window.open(m.file_url!, '_blank')}
									>
										View Document
									</button>
									{#if m.attachment_purpose}
										<p class="text-xs opacity-75">Purpose: {m.attachment_purpose}</p>
									{/if}
								</div>
							{:else if m.message_kind === "verification" && m.file_url}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
										</svg>
										<div>
											<p class="font-medium text-sm">{m.file_name}</p>
											{#if m.file_size}
												<p class="text-xs opacity-75">{Math.round(m.file_size / 1024)} KB</p>
											{/if}
										</div>
									</div>
									<button
										type="button"
										class="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
										onclick={() => window.open(m.file_url!, '_blank')}
									>
										View Verification
									</button>
									{#if m.attachment_purpose}
										<p class="text-xs opacity-75">Purpose: {m.attachment_purpose}</p>
									{/if}
								</div>
							{:else}
								<pre class="ap-chat-pre">{m.message_text}</pre>
							{/if}
							<div class="flex items-center justify-end gap-1">
								<p class="ap-chat-timestamp">{new Date(m.sent_at).toLocaleString()}</p>
								{#if adminId !== 0 && m.sender_id === adminId && m.is_seen}
									<svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
			<div class="ap-chat-input-row">
				{#if selectedFile}
					<div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border w-full">
						<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" clip-rule="evenodd"/>
						</svg>
						<span class="text-sm text-gray-700 flex-1">{selectedFile.name}</span>
						<div class="flex gap-1">
							<button
								type="button"
								class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
								onclick={() => sendAttachment("image")}
							>
								Send as Image
							</button>
							<button
								type="button"
								class="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
								onclick={() => sendAttachment("document")}
							>
								Send as Document
							</button>
							<button
								type="button"
								class="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
								onclick={() => sendAttachment("verification")}
							>
								Send as Verification
							</button>
							<button
								type="button"
								class="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
								onclick={() => selectedFile = null}
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<div class="flex gap-2 w-full">
						<input
							class="ap-input ap-chat-input flex-1"
							bind:value={input}
							placeholder={selected ? "Type a reply…" : "Select a thread first"}
							disabled={!selected}
							onkeydown={(e) => {
								if (typingTimeout) clearTimeout(typingTimeout);
								typingTimeout = setTimeout(() => {
									typingTimeout = null;
								}, 1000);
								void notifyTyping();
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									send();
								}
							}}
						/>
						<label class="cursor-pointer">
							<input
								type="file"
								accept="image/*,.pdf,.doc,.docx,.txt"
								class="hidden"
								onchange={(e) => {
									const file = (e.target as HTMLInputElement).files?.[0];
									if (file) selectedFile = file;
								}}
							/>
							<span class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" clip-rule="evenodd"/>
								</svg>
								Attach
							</span>
						</label>
						<button
							type="button"
							class="ap-btn ap-btn--primary"
							onclick={send}
							disabled={!selected || !input.trim()}
						>
							Send
						</button>
					</div>
				{/if}
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
		.admin-booking-actions {
			display: flex;
			gap: 0.75rem;
			flex-wrap: wrap;
		}
		.admin-booking-actions .ap-btn {
			flex: 1;
			min-width: 150px;
		}
		@media (max-width: 640px) {
			.admin-booking-actions {
				flex-direction: column;
			}
			.admin-booking-actions .ap-btn {
				min-width: 0;
			}
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

		.ap-chat-timestamp {
			margin: 0.25rem 0 0;
			font-size: 0.6875rem;
			color: var(--ap-muted, #6b7280);
			text-align: right;
		}

		.ap-unread-badge {
			background: #dc2626;
			color: white;
			font-size: 0.75rem;
			font-weight: 600;
			padding: 0.125rem 0.375rem;
			border-radius: 0.5rem;
			min-width: 1.25rem;
			text-align: center;
		}

		.ap-typing-indicator {
			font-size: 0.75rem;
			color: var(--ap-muted, #6b7280);
			font-style: italic;
			margin-left: 0.5rem;
		}

		.ap-online-indicator {
			width: 0.5rem;
			height: 0.5rem;
			background: #10b981;
			border-radius: 50%;
			display: inline-block;
		}

		.ap-chat-bubble--request {
			max-width: 95% !important;
			border: 1px solid rgba(217, 119, 6, 0.45);
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.14), rgba(255, 255, 255, 0.96)) !important;
			color: #78350f !important;
			align-self: flex-start;
		}

		.ap-request-kicker {
			margin: 0 0 0.35rem;
			font-size: 0.6875rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #92400e;
		}

		.ap-request-status {
			margin: 0.5rem 0 0;
			font-size: 0.8125rem;
		}

		.ap-request-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin-top: 0.65rem;
		}
		
		.ap-chat-main {
			display: flex;
			flex-direction: column;
			
		
		}
		
		.ap-chat-messages {
			flex: 1;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding: 1rem;
			background: var(--ap-bg, #f9fafb);
			
		max-height: 70vh;

		}
</style>
