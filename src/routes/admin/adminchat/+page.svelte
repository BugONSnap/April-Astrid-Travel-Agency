<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";

	let conversations: Array<{
		conversation_id: number;
		user_id: number;
		first_name: string | null;
		last_name: string | null;
	}> = [];
	let selected: (typeof conversations)[0] | null = null;
	let messages: Array<{ sender_id: number; message_text: string }> = [];
	let input = "";
	let loadError = "";

	let adminId = 0;
	$: adminId = ($page.data.user?.user_id as number | undefined) ?? 0;

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
			const data = await res.json();
			conversations = Array.isArray(data) ? data : [];
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
			<p class="ap-sub">Open a thread on the left (or top on mobile), then reply. Messages refresh after each send.</p>
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
			<div class="ap-chat-messages">
				{#each messages as m}
					<div
						class="ap-chat-bubble"
						class:ap-chat-bubble--me={adminId !== 0 && m.sender_id === adminId}
						class:ap-chat-bubble--them={adminId === 0 || m.sender_id !== adminId}
					>
						{m.message_text}
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
