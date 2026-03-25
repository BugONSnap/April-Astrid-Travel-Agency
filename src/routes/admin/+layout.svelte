<script lang="ts">
	import AdminHeader from "$lib/assets/admin-header.svelte";

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-gray-50">
	<AdminHeader />

	<main class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6">
		{@render children()}
	</main>
</div>

