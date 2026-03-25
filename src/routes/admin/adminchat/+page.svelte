<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";

	let conversations: any[] = [];
	let selected: any = null;
	let messages: any[] = [];
	let input = "";

	// Logged-in admin id (provided by `/admin/+layout.server.ts`)
	let adminId = 0;
	$: adminId = ($page.data.user?.user_id as number | undefined) ?? 0;

	async function loadConversations() {
		const res = await fetch("/api/auth/chat?scope=conversations");
		conversations = await res.json();
	}

	async function openChat(conv: any) {
		selected = conv;

		const res = await fetch(
			`/api/auth/chat?scope=messages&conversationId=${conv.conversation_id}`,
		);
		messages = await res.json();
	}

	async function send() {
		if (!input.trim() || !selected) return;

		await fetch("/api/auth/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				conversationId: selected.conversation_id,
				senderId: adminId,
				text: input,
			}),
		});

		input = "";
		await openChat(selected);
	}

	onMount(loadConversations);
</script>
    
    <div class="flex min-h-[70vh]">
    
    <!-- LEFT: USERS -->
    <div class="w-1/3 bg-white border-r p-3">
    <h2 class="font-bold mb-3">Inbox</h2>
    
    {#each conversations as c}
    <button
    type="button"
    class="w-full text-left p-2 border-b cursor-pointer hover:bg-gray-100"
    on:click={() => openChat(c)}
    >
    {c.first_name ? `${c.first_name} ${c.last_name ?? ""}`.trim() : `User #${c.user_id}`}
    </button>
    {/each}
    </div>
    
    <!-- RIGHT: CHAT -->
    <div class="flex-1 flex flex-col">
    
    <div class="p-4 bg-red-700 text-white font-bold">
    {selected ? `Chat with User ${selected.user_id}` : "Select a chat"}
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
    {#each messages as m}
    <div class={`max-w-xs p-2 rounded-lg
    ${m.sender_id === adminId ? "bg-red-500 text-white ml-auto" : "bg-white"}`}>
    {m.message_text}
    </div>
    {/each}
    </div>
    
    <div class="p-3 flex gap-2 border-t">
    <input
    class="flex-1 p-2 border rounded-lg"
    bind:value={input}
    placeholder="Reply..."
    />
    <button on:click={send} class="bg-red-700 text-white px-4 rounded-lg">
    Send
    </button>
    </div>
    
    </div>
    </div>