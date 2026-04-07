<script lang="ts">
	import Header from "$lib/assets/header.svelte";
	import {
		formatBookingRequestSummary,
		parseBookingRequestPayload,
	} from "$lib/chat/bookingRequestPayload";
	import { encryptPayload, decryptPayload } from "$lib/payloadEncryption";
	import { onMount, tick } from "svelte";
	import { get } from "svelte/store";
	import { page } from "$app/stores";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	type ChatMessage = {
		message_id: number;
		conversation_id: number;
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
	};

	let messages = $state<ChatMessage[]>([]);
	let input = $state("");
	let conversationId = $state(0);

	let isBooting = $state(true);
	let isLoading = $state(false);
	let isSending = $state(false);
	let errorMsg = $state("");

	let bottomEl: HTMLDivElement | null = $state(null);

	let userId = $state(0);
	let canChat = $state(false);
	$effect(() => {
		const id = (get(page).data.user?.user_id as number | undefined) ?? 0;
		userId = id;
		canChat = id !== 0;
	});

	let selectedFile: File | null = $state(null);
	let isUploading = $state(false);
	let uploadProgress = $state(0);

let requestKind = $state<"package" | "service">("package");
let bookingPackageId = $state("");
let serviceTitle = $state("");
	let bookingPax = $state(1);
	let bookingTravel = $state("");
	let bookingNote = $state("");
	let bookingSubmitting = $state(false);
	let bookingErr = $state("");

	const selectedPackage = $derived(
		bookingPackageId
			? data.packages.find((p) => String(p.package_id) === bookingPackageId) ?? null
			: null,
	);

	const estimatedTotal = $derived(
		selectedPackage ? Math.round(Number(selectedPackage.price) * Number(bookingPax || 1)) : 0,
	);

	async function submitBookingRequest() {
	if (!canChat || bookingPax < 1 || bookingSubmitting) return;
	if (requestKind === "package" && !bookingPackageId) return;
	if (requestKind === "service" && !serviceTitle.trim()) return;
	bookingErr = "";
	bookingSubmitting = true;
	try {
		const body: Record<string, unknown> = {
			kind: requestKind,
			numberOfPeople: bookingPax,
			travelDate: bookingTravel.trim() || undefined,
			note: bookingNote.trim() || undefined,
		};
		if (requestKind === "package") {
			body.packageId = Number.parseInt(bookingPackageId, 10);
		} else {
			body.serviceTitle = serviceTitle.trim();
		}

		const encryptedBody = await encryptPayload(JSON.stringify(body));

		const res = await fetch("/api/user/booking-request", {
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
			bookingErr = typeof j.error === "string" ? j.error : "Could not send request.";
			return;
		}

		bookingNote = "";
		if (requestKind === "package") {
			bookingPackageId = "";
		} else {
			serviceTitle = "";
		}
		await loadChat();
	} catch {
		bookingErr = "Network error.";
	} finally {
		bookingSubmitting = false;
	}
}

	function scrollToBottom() {
		if (!bottomEl) return;
		bottomEl.scrollIntoView({ block: "end", behavior: "smooth" });
	}

	type LoadChatOpts = { silent?: boolean };

	async function loadChat(opts?: LoadChatOpts) {
		if (!canChat) {
			isBooting = false;
			return;
		}

		errorMsg = "";
		const silent = opts?.silent === true;
		const prevLastId = messages.at(-1)?.message_id;
		if (!silent) isLoading = true;
		try {
			const convRes = await fetch(`/api/auth/chat?scope=user-conversation&userId=${userId}`);
			if (!convRes.ok) {
				const encryptedErrText = await convRes.text();
				let err: any = {};
				try {
					const encryptedErr = JSON.parse(encryptedErrText);
					err = JSON.parse(await decryptPayload(encryptedErr));
				} catch {
					err = {};
				}
				if (!silent) {
					errorMsg =
						typeof err.error === "string" ? err.error : `Could not open chat (${convRes.status})`;
				}
				return;
			}
			const encryptedConvText = await convRes.text();
			const encryptedConv = JSON.parse(encryptedConvText);
			const convDataStr = await decryptPayload(encryptedConv);
			const convData = JSON.parse(convDataStr);
			conversationId = convData.conversation_id;

			const msgRes = await fetch(`/api/auth/chat?scope=messages&conversationId=${conversationId}`);
			if (!msgRes.ok) {
				const encryptedErrText = await msgRes.text();
				let err: any = {};
				try {
					const encryptedErr = JSON.parse(encryptedErrText);
					err = JSON.parse(await decryptPayload(encryptedErr));
				} catch {
					err = {};
				}
				if (!silent) {
					errorMsg =
						typeof err.error === "string" ? err.error : `Could not load messages (${msgRes.status})`;
					messages = [];
				}
				return;
			}
			const encryptedDataText = await msgRes.text();
			const encryptedData = JSON.parse(encryptedDataText);
			const dataStr = await decryptPayload(encryptedData);
			const data = JSON.parse(dataStr);
			const next = Array.isArray(data) ? data : [];
			messages = next;
			await tick();
			const newLastId = next.at(-1)?.message_id;
			if (!silent || newLastId !== prevLastId) scrollToBottom();
		} catch {
			if (!silent) errorMsg = "Network error loading chat.";
		} finally {
			if (!silent) isLoading = false;
			isBooting = false;
		}
	}

	async function send() {
		if (!canChat || !input.trim() || !conversationId || isSending) return;
		const text = input.trim();

		// optimistic append
		const optimistic: ChatMessage = {
			message_id: -Date.now(),
			conversation_id: conversationId,
			sender_id: userId,
			message_text: text,
			sent_at: new Date().toISOString(),
		};
		messages = [...messages, optimistic];
		input = "";
		await tick();
		scrollToBottom();

		isSending = true;
		errorMsg = "";
		try {
			const body = {
				conversationId,
				senderId: userId,
				text,
			};
			const encryptedBody = await encryptPayload(JSON.stringify(body));

			const res = await fetch("/api/auth/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(encryptedBody),
			});
			if (!res.ok) {
				const encryptedErrText = await res.text();
				let err: any = {};
				try {
					const encryptedErr = JSON.parse(encryptedErrText);
					err = JSON.parse(await decryptPayload(encryptedErr));
				} catch {
					err = {};
				}
				errorMsg = typeof err.error === "string" ? err.error : `Could not send (${res.status})`;
				// rollback optimistic message
				messages = messages.filter((m) => m.message_id !== optimistic.message_id);
				input = text;
				return;
			}
			await loadChat();
		} catch {
			errorMsg = "Network error sending message.";
			messages = messages.filter((m) => m.message_id !== optimistic.message_id);
			input = text;
		} finally {
			isSending = false;
		}
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
		if (!canChat || !selectedFile || !conversationId || isSending) return;

		const file = selectedFile;
		selectedFile = null;

		// optimistic append
		const optimistic: ChatMessage = {
			message_id: -Date.now(),
			conversation_id: conversationId,
			sender_id: userId,
			message_text: `Uploading ${file.name}...`,
			sent_at: new Date().toISOString(),
			message_kind: purpose,
		};
		messages = [...messages, optimistic];
		await tick();
		scrollToBottom();

		isSending = true;
		errorMsg = "";
		try {
			const uploadResult = await uploadFile(file, purpose);

			const body = {
				conversationId,
				senderId: userId,
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
			if (!res.ok) {
				const encryptedErrText = await res.text();
				let err: any = {};
				try {
					const encryptedErr = JSON.parse(encryptedErrText);
					err = JSON.parse(await decryptPayload(encryptedErr));
				} catch {
					err = {};
				}
				errorMsg = typeof err.error === "string" ? err.error : `Could not send (${res.status})`;
				// rollback optimistic message
				messages = messages.filter((m) => m.message_id !== optimistic.message_id);
				return;
			}
			await loadChat();
		} catch (error) {
			errorMsg = error instanceof Error ? error.message : "Upload failed";
			messages = messages.filter((m) => m.message_id !== optimistic.message_id);
		} finally {
			isSending = false;
		}
	}

	onMount(() => {
		void loadChat();
		const pollMs = 12_000;
		const id = setInterval(() => {
			if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
			const uid = (get(page).data.user?.user_id as number | undefined) ?? 0;
			if (uid === 0) return;
			void loadChat({ silent: true });
		}, pollMs);
		return () => clearInterval(id);
	});
</script>

<svelte:head>
	<title>Customer Support · Chat</title>
</svelte:head>

<Header />

<main class="min-h-[calc(100vh-80px)] bg-stone-50">
	<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex flex-col gap-1">
			<p class="text-[11px] font-semibold tracking-[0.18em] text-zinc-600 uppercase">Messaging</p>
			<h1 class="font-serif text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
				Customer Support
			</h1>
			<p class="text-sm text-zinc-600">
				Request a package below or write freely — staff confirm bookings here and you’ll see a green confirmation when
				it’s recorded.
			</p>
		</div>

		{#if canChat}
			<div class="mb-6 rounded-2xl border border-red-900/10 bg-white p-4 shadow-sm">
				<p class="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">Request support</p>
				<p class="mt-1 text-sm text-zinc-600">
					Create a package or services offered request here. Staff can approve or deny it in admin chat.
				</p>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<label class="block text-xs font-semibold text-zinc-700">
						Request type
						<select
							class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
							bind:value={requestKind}
						>
							<option value="package">Package</option>
							<option value="service">Service</option>
						</select>
					</label>
					<label class="block text-xs font-semibold text-zinc-700">
						Guests
						<input
							type="number"
							min="1"
							class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
							bind:value={bookingPax}
						/>
					</label>
					<label class="block text-xs font-semibold text-zinc-700">
						Preferred travel date
						<input
							type="date"
							class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
							bind:value={bookingTravel}
						/>
					</label>
					<label class="block text-xs font-semibold text-zinc-700 sm:col-span-2">
						Note (optional)
						<input
							class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
							bind:value={bookingNote}
							placeholder="Special requests"
						/>
					</label>
				</div>

				{#if requestKind === "package"}
					<div class="mt-4 grid gap-3 sm:grid-cols-2">
						<label class="block text-xs font-semibold text-zinc-700 sm:col-span-2">
							Package
							<select
								class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
								bind:value={bookingPackageId}
							>
								<option value="">Select…</option>
								{#each data.packages as p}
									<option value={String(p.package_id)}>
										{p.package_name} — ₱{p.price.toLocaleString("en-PH")}
									</option>
								{/each}
							</select>
						</label>
					</div>
				{/if}

				{#if requestKind === "service"}
					<div class="mt-4 grid gap-3 sm:grid-cols-2">
						<label class="block text-xs font-semibold text-zinc-700 sm:col-span-2">
							Service
							<select
								class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm"
								bind:value={serviceTitle}
							>
								<option value="">Select a service…</option>
								{#each data.servicesOffered as title}
									<option value={title}>{title}</option>
								{/each}
							</select>
						</label>
					</div>
				{/if}

				{#if requestKind === "package" && selectedPackage}
					<div
						class="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
						aria-live="polite"
					>
						<p class="m-0 text-xs font-semibold tracking-wide text-amber-900 uppercase">Selected package</p>
						<p class="mt-1 font-semibold text-zinc-900">{selectedPackage.package_name}</p>
						<ul class="mt-2 list-none space-y-1 p-0 text-zinc-800">
							<li>
								<span class="text-zinc-600">Destination:</span>
								{selectedPackage.destination_line}
							</li>
							<li>
								<span class="text-zinc-600">Duration:</span>
								{selectedPackage.duration_days != null
									? `${selectedPackage.duration_days} days`
									: "—"}
							</li>
							<li>
								<span class="text-zinc-600">Listed price (per booking):</span>
								₱{Number(selectedPackage.price).toLocaleString("en-PH")}
							</li>
							<li>
								<span class="text-zinc-600">Estimated total ({bookingPax} guest{Number(bookingPax) === 1 ? "" : "s"}):</span>
								<strong>₱{estimatedTotal.toLocaleString("en-PH")}</strong>
							</li>
						</ul>
					</div>
				{/if}

				{#if bookingErr}
					<p class="mt-2 text-sm text-red-800" role="alert">{bookingErr}</p>
				{/if}
				<button
					type="button"
					class="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
					onclick={submitBookingRequest}
					disabled={
						bookingSubmitting ||
						(requestKind === "package" ? !bookingPackageId : !serviceTitle.trim())
					}
				>
					{bookingSubmitting ? "Sending…" : "Send booking request to chat"}
				</button>
			</div>
		{/if}

		{#if !canChat}
			<div class="rounded-2xl border border-red-900/10 bg-white p-6 shadow-sm">
				<p class="text-sm text-zinc-700">
					You need to be logged in to use support chat.
				</p>
				<div class="mt-4 flex flex-wrap gap-3">
					<a
						href="/login"
						class="inline-flex items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
					>
						Go to login
					</a>
					<a
						href="/"
						class="inline-flex items-center justify-center rounded-xl border border-red-900/15 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
					>
						Back to home
					</a>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-2xl border border-red-900/10 bg-white shadow-sm">
				<div
					class="flex items-center justify-between gap-3 bg-linear-to-r from-red-700 via-red-800 to-red-950 px-5 py-4 text-white"
				>
					<div class="min-w-0">
						<p class="text-sm font-semibold leading-5">Live support</p>
						<p class="text-xs text-red-100/90">
							{isBooting ? "Connecting…" : isLoading ? "Refreshing…" : "You’re connected"}
						</p>
					</div>
					<button
						type="button"
						class="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
						onclick={() => void loadChat()}
						disabled={isLoading}
					>
						Refresh
					</button>
				</div>

				{#if errorMsg}
					<div class="border-b border-red-900/10 bg-red-50 px-5 py-3 text-sm text-red-900" role="alert">
						{errorMsg}
					</div>
				{/if}

				<div class="flex h-[70vh] flex-col">
					<div class="flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 sm:px-5">
						{#if isBooting}
							<p class="mx-auto max-w-md rounded-xl border border-red-900/10 bg-white px-4 py-3 text-center text-sm text-zinc-600">
								Loading your conversation…
							</p>
						{:else if messages.length === 0}
							<p class="mx-auto max-w-md rounded-xl border border-red-900/10 bg-white px-4 py-3 text-center text-sm text-zinc-600">
								No messages yet. Say hi to start the conversation.
							</p>
						{:else}
							<div class="flex flex-col gap-2">
								{#each messages as m (m.message_id)}
									<div class={m.sender_id === userId ? "flex justify-end" : "flex justify-start"}>
										{#if m.message_kind === "booking_request"}
											{@const rp = parseBookingRequestPayload(m.message_text)}
											{@const rs = m.request_status ?? "PENDING"}
											<div
												class={[
													"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
													"border border-amber-300/70 bg-amber-50 text-amber-950",
												].join(" ")}
											>
												<p class="text-[11px] font-bold uppercase tracking-wide text-amber-900">
													Booking request
												</p>
												{#if rp}
													<p class="mt-1 whitespace-pre-wrap wrap-break-word">
														{formatBookingRequestSummary(rp)}
													</p>
												{:else}
													<p class="mt-1 whitespace-pre-wrap wrap-break-word">{m.message_text}</p>
												{/if}
												<p class="mt-2 text-xs font-semibold text-amber-900">
													{#if rs === "PENDING"}
														Awaiting staff review…
													{:else if rs === "APPROVED"}
														Approved — see the green confirmation below.
													{:else if rs === "DENIED"}
														Declined — check staff reply in the thread.
													{:else}
														{rs}
													{/if}
												</p>
											</div>
										{:else}
											<div
												class={[
													"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
													m.message_kind === "booking_notice"
														? "border border-emerald-400/50 bg-emerald-50 text-emerald-950"
														: m.sender_id === userId
															? "bg-red-700 text-white"
															: "border border-red-900/10 bg-white text-zinc-900",
												].join(" ")}
											>
												{#if m.message_kind === "image" && m.file_url}
													<div class="space-y-2">
														{#if m.file_name}
															<p class="text-xs opacity-75">{m.file_name}</p>
														{/if}
														<img 
															src={m.file_url} 
															alt={m.file_name || "Attachment"} 
															class="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 object-contain"
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
													<p class="whitespace-pre-wrap wrap-break-word">{m.message_text}</p>
												{/if}
												{#if m.message_kind === "booking_notice"}
													<a
														href="/profile"
														class="mt-2 inline-block text-xs font-semibold text-emerald-900 underline"
													>
														View in My Bookings →
													</a>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
								<div bind:this={bottomEl}></div>
							</div>
						{/if}
					</div>

					<form
						class="flex flex-col gap-3 border-t border-red-900/10 bg-white p-3 sm:p-4"
						onsubmit={(e) => {
							e.preventDefault();
							send();
						}}
					>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
							<input
								class="min-w-0 flex-1 rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
								placeholder="Type your message…"
								bind:value={input}
								disabled={isBooting || isLoading}
								onkeydown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										send();
									}
								}}
							/>
							<label
								class="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-900/15 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 cursor-pointer"
							>
								<input
									type="file"
									accept="image/*,.pdf,.doc,.docx,.txt"
									class="hidden"
									onchange={(e) => {
										const file = (e.target as HTMLInputElement).files?.[0];
										if (file) selectedFile = file;
									}}
								/>
								Attach
							</label>
							<button
								type="submit"
								class="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
								disabled={isBooting || isLoading || isSending || !input.trim()}
							>
								{isSending ? "Sending…" : "Send"}
							</button>
						</div>

						{#if selectedFile}
							<div class="rounded-2xl border border-red-900/10 bg-red-50 p-3 text-sm text-zinc-900 shadow-sm">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center gap-2 text-sm text-zinc-700">
										<svg class="w-4 h-4 text-red-900" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" clip-rule="evenodd"/>
										</svg>
										<span class="font-semibold text-zinc-900">{selectedFile.name}</span>
									</div>
									<div class="flex flex-wrap gap-2">
										<button
											type="button"
											class="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
											disabled={isSending}
											onclick={() => sendAttachment("image")}
										>
											Send as Image
										</button>
										<button
											type="button"
											class="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
											disabled={isSending}
											onclick={() => sendAttachment("document")}
										>
											Send as Document
										</button>
										<button
											type="button"
											class="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
											disabled={isSending}
											onclick={() => sendAttachment("verification")}
										>
											Send as Verification
										</button>
										<button
											type="button"
											class="rounded-xl bg-gray-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-600"
											onclick={() => selectedFile = null}
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						{/if}
					</form>
				</div>
			</div>
		{/if}
	</div>
</main>