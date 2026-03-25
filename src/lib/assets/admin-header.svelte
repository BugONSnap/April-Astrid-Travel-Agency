<script lang="ts">
	import { page } from "$app/stores";

	/** When omitted, uses `page.data.user` from `src/routes/admin/+layout.server.ts`. */
	let { user: userProp }: { user?: App.PageData["user"] } = $props();

	let navOpen = $state(false);

	const user = $derived.by(() => userProp ?? $page.data.user);
	const accountLabel = $derived.by(() => {
		if (!user) return "Admin";
		const name = [user.first_name].filter(Boolean).join(" ").trim();
		return name || user.email;
	});
	const accountHref = $derived(user ? "/admin" : "/login");
</script>

<div class="w-full">
	<header class="grid grid-cols-2 sm:grid-cols-[auto_1fr_auto] items-center py-3 px-4 sm:px-8 bg-black text-white">
		<a href="/admin" class="flex items-center gap-3 text-white no-underline col-span-1">
			<span class="text-xl font-semibold font-serif tracking-wide">Admin Panel</span>
		</a>

		<div class="col-span-1 flex justify-end sm:hidden">
			<button
				type="button"
				class="p-2 rounded focus:outline-none"
				onclick={() => (navOpen = !navOpen)}
				aria-label="Toggle navigation"
			>
				<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</div>

		<nav class="hidden justify-end sm:flex sm:items-center flex-wrap gap-y-2 w-full">
			<a href="/admin" class="hover:underline font-medium text-base mx-2">Dashboard</a>
			<a href="/admin/users" class="hover:underline font-medium text-base mx-2">Users</a>
			<a href="/admin/destinations" class="hover:underline font-medium text-base mx-2">Destinations</a>
			<a href="/admin/packages" class="hover:underline font-medium text-base mx-2">Packages</a>
			<a href="/admin/bookings" class="hover:underline font-medium text-base mx-2">Bookings</a>
			<a href="/admin/payments" class="hover:underline font-medium text-base mx-2">Payments</a>
			<a href="/admin/adminchat" class="hover:underline font-medium text-base mx-2">Admin Chat</a>

			<a
				href={accountHref}
				class="inline-flex items-center gap-2 font-medium text-base mx-2"
				aria-current={user ? "page" : undefined}
			>
				<span>{accountLabel}</span>
				{#if user?.profile_picture}
					<img
						src={user.profile_picture}
						alt=""
						class="h-8 w-8 rounded-full object-cover border border-white/40 shrink-0"
						width="32"
						height="32"
					/>
				{:else}
					<svg class="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
					</svg>
				{/if}
			</a>

			{#if user}
				<form method="post" action="/api/auth/logout" class="inline mx-2">
					<button
						type="submit"
						class="rounded-full border border-white/80 bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20"
					>
						Log out
					</button>
				</form>
			{/if}
		</nav>
	</header>

	{#if navOpen}
		<nav class="grid grid-cols-1 bg-black text-white px-4 py-2 sm:hidden animate-fade-in">
			<a href="/admin" class="py-2 hover:underline font-medium text-base">Dashboard</a>
			<a href="/admin/users" class="py-2 hover:underline font-medium text-base">Users</a>
			<a href="/admin/destinations" class="py-2 hover:underline font-medium text-base">Destinations</a>
			<a href="/admin/packages" class="py-2 hover:underline font-medium text-base">Packages</a>
			<a href="/admin/bookings" class="py-2 hover:underline font-medium text-base">Bookings</a>
			<a href="/admin/payments" class="py-2 hover:underline font-medium text-base">Payments</a>
			<a href="/admin/adminchat" class="py-2 hover:underline font-medium text-base">Admin Chat</a>

			<a href={accountHref} class="inline-flex items-center gap-2 py-2 font-medium text-base">
				<span>{accountLabel}</span>
				{#if user?.profile_picture}
					<img
						src={user.profile_picture}
						alt=""
						class="h-8 w-8 rounded-full object-cover border border-white/40 shrink-0"
						width="32"
						height="32"
					/>
				{:else}
					<svg class="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
					</svg>
				{/if}
			</a>

			{#if user}
				<form method="post" action="/api/auth/logout" class="py-2">
					<button
						type="submit"
						class="w-full rounded-lg border border-white/80 bg-white/10 py-2 text-sm font-semibold text-white"
					>
						Log out
					</button>
				</form>
			{/if}
		</nav>
	{/if}
</div>

<style>
	/* Tailwind handles most styling. */
</style>

