<script lang="ts">
	import { onMount } from "svelte";

	let messages: any[] = [];
	let input = "";
	let conversationId = 0;

	// fallback for local testing when no authenticated session is loaded
	const userId = 1;

	async function loadChat() {
		const convRes = await fetch(
			`/api/auth/chat?scope=user-conversation&userId=${userId}`,
		);
		const convData = await convRes.json();
		conversationId = convData.conversation_id;

		const msgRes = await fetch(
			`/api/auth/chat?scope=messages&conversationId=${conversationId}`,
		);
		messages = await msgRes.json();
	}

	async function send() {
		if (!input.trim() || !conversationId) return;

		await fetch("/api/auth/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				conversationId,
				senderId: userId,
				text: input,
			}),
		});

		input = "";
		await loadChat();
	}

	onMount(loadChat);
</script>
    
    <div class="flex flex-col h-full bg-gray-100">
    
    <!-- HEADER -->
    <div class="p-4 bg-red-700 text-white font-bold">
    Customer Support
    </div>
    
    <!-- MESSAGES -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
    {#each messages as m}
    <div class={`max-w-xs p-2 rounded-lg
    ${m.sender_id === userId ? "bg-red-500 text-white ml-auto" : "bg-white"}`}>
    {m.message_text}
    </div>
    {/each}
    </div>
    
    <!-- INPUT -->
    <div class="p-3 flex gap-2 border-t">
    <input
    class="flex-1 p-2 border rounded-lg"
    placeholder="Type a message..."
    bind:value={input}
    />
    <button on:click={send} class="bg-red-700 text-white px-4 rounded-lg">
    Send
    </button>
    </div>
    
    </div>