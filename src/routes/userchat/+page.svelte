<script lang="ts">
	import Header from "$lib/assets/header.svelte";
	import { onMount, tick } from "svelte";
	import { page } from "$app/stores";

	type ChatMessage = {
		message_id: number;
		conversation_id: number;
		sender_id: number;
		message_text: string;
		sent_at: string;
	};

	let messages: ChatMessage[] = [];
	let input = "";
	let conversationId = 0;

	let isBooting = true;
	let isLoading = false;
	let isSending = false;
	let errorMsg = "";

	let bottomEl: HTMLDivElement | null = null;

	$: userId = ($page.data.user?.user_id as number | undefined) ?? 0;
	$: canChat = userId !== 0;

	function scrollToBottom() {
		if (!bottomEl) return;
		bottomEl.scrollIntoView({ block: "end", behavior: "smooth" });
	}

	async function loadChat() {
		if (!canChat) {
			isBooting = false;
			return;
		}

		errorMsg = "";
		isLoading = true;
		try {
			const convRes = await fetch(`/api/auth/chat?scope=user-conversation&userId=${userId}`);
			if (!convRes.ok) {
				const err = await convRes.json().catch(() => ({}));
				errorMsg = typeof err.error === "string" ? err.error : `Could not open chat (${convRes.status})`;
				return;
			}
			const convData = await convRes.json();
			conversationId = convData.conversation_id;

			const msgRes = await fetch(`/api/auth/chat?scope=messages&conversationId=${conversationId}`);
			if (!msgRes.ok) {
				const err = await msgRes.json().catch(() => ({}));
				errorMsg =
					typeof err.error === "string" ? err.error : `Could not load messages (${msgRes.status})`;
				messages = [];
				return;
			}
			const data = await msgRes.json();
			messages = Array.isArray(data) ? data : [];
			await tick();
			scrollToBottom();
		} catch {
			errorMsg = "Network error loading chat.";
		} finally {
			isLoading = false;
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
			const res = await fetch("/api/auth/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					conversationId,
					senderId: userId,
					text,
				}),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
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

	onMount(loadChat);
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
				Send us a message and an agent will reply as soon as possible.
			</p>
		</div>

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
						on:click={loadChat}
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
										<div
											class={[
												"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
												m.sender_id === userId
													? "bg-red-700 text-white"
													: "border border-red-900/10 bg-white text-zinc-900",
											].join(" ")}
										>
											<p class="whitespace-pre-wrap wrap-break-word">{m.message_text}</p>
										</div>
									</div>
								{/each}
								<div bind:this={bottomEl}></div>
							</div>
						{/if}
					</div>

					<form
						class="flex gap-2 border-t border-red-900/10 bg-white p-3 sm:p-4"
						on:submit|preventDefault={send}
					>
						<input
							class="min-w-0 flex-1 rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
							placeholder="Type your message…"
							bind:value={input}
							disabled={isBooting || isLoading}
							on:keydown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									send();
								}
							}}
						/>
						<button
							type="submit"
							class="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
							disabled={isBooting || isLoading || isSending || !input.trim()}
						>
							{isSending ? "Sending…" : "Send"}
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</main>