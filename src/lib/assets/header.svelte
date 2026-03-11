<script>
	let navOpen = false;
</script>

<div class="w-full">
	<header class="grid grid-cols-2 sm:grid-cols-[auto_1fr_auto] items-center py-3 px-4 sm:px-8 bg-[#c41e3a] text-white">
		<a href="/" class="flex items-center gap-3 text-white no-underline col-span-1">
			<img src="/aalogo.png" alt="April-Astrid" class="h-10 w-auto block rounded-full" />
			<span class="text-xl font-semibold font-serif tracking-wide">April-Astrid</span>
		</a>
		<div class="col-span-1 flex justify-end sm:hidden">
			<button class="p-2 rounded focus:outline-none" on:click={() => navOpen = !navOpen} aria-label="Toggle navigation">
				<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</div>
		<nav class="hidden justify-end sm:flex sm:items-center   w-full">
			<a href="/dashboard" class="hover:underline font-medium text-base mx-2">Dashboard</a>
			<a href="/packages" class="hover:underline font-medium text-base mx-2">Packages</a>
			<a href="/servoffered" class="hover:underline font-medium text-base mx-2">Other Services</a>
			<a href="/about" class="hover:underline font-medium text-base mx-2">About us</a>
			<a href="/login" class="inline-flex items-center gap-1 font-medium text-base mx-2">
				<span>Sign in</span>
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
			</a>
		</nav>
	</header>
	<!-- Mobile nav -->
	{#if navOpen}
		<nav class="grid grid-cols-1 bg-[#c41e3a] text-white px-4 py-2 sm:hidden animate-fade-in">
			<a href="/dashboard" class="py-2 hover:underline font-medium text-base">Dashboard</a>
			<a href="/packages" class="py-2 hover:underline font-medium text-base">Packages</a>
			<a href="/servoffered" class="py-2 hover:underline font-medium text-base">Other Services</a>
			<a href="/about" class="py-2 hover:underline font-medium text-base">About us</a>
			<a href="/login" class="inline-flex items-center gap-1 py-2 font-medium text-base">
				<span>Sign in</span>
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
			</a>
		</nav>
	{/if}
</div>

<style>
	/* No custom CSS needed, all handled by Tailwind. */
</style>
