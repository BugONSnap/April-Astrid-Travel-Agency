<script lang="ts">
	import type { PageProps } from "./$types";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { page } from "$app/stores";
	import { encryptPayload, decryptPayload } from "$lib/payloadEncryption";
	import Header from "$lib/assets/header.svelte";
	import Footer from "$lib/assets/footer.svelte";
	import type { Continent } from "$lib/geo/countryContinent";
	import { destinationCardLabel, packageDestinationCaption } from "$lib/display/destination";

	let { data }: PageProps = $props();

	let search = $state("");
	let continent = $state("All");
	let maxPrice = $state(150000);
	let duration = $state("All");

	type PackageListItem = {
		package_id: number;
		name: string;
		country: string;
		destinationLine: string;
		continent: Continent | "Other";
		price: number;
		duration: number;
		image: string | null;
		badge: string;
		description: string | null;
	};

	const continentFilterOptions: (Continent | "Other" | "All")[] = [
		"All",
		"Asia",
		"Oceania",
		"North America",
		"Europe",
		"South America",
		"Africa",
		"Other",
	];

	const serverPackages = $derived(
		(data.packages ?? []).map((p: any) => ({
			package_id: p.package_id,
			name: p.package_name,
			country: p.destination_country,
			destinationLine: packageDestinationCaption(p.destination_city, p.destination_country),
			continent: p.destination_continent as Continent | "Other",
			price: p.price,
			duration: p.duration_days ?? 9999,
			image: p.image_url,
			badge: p.category,
			description: p.description ?? null,
		})),
	);

	const filtered = $derived(
		serverPackages.filter((p: any) => {
			return (
				(continent === "All" || p.continent === continent) &&
				p.price <= maxPrice &&
				(duration === "All" || p.duration <= parseInt(duration, 10)) &&
				p.name.toLowerCase().includes(search.toLowerCase())
			);
		}),
	);

	let carouselRefs = $state<Record<string, HTMLDivElement | null>>({});

	function scrollContinent(cont: string, delta: number) {
		carouselRefs[cont]?.scrollBy({ left: delta, behavior: "smooth" });
	}

	function destCardsForContinent(cont: Continent) {
		const list = data.destinationsByContinent?.[cont] ?? [];
		return list.map((d: any) => ({
			name: destinationCardLabel({ city_name: d.city_name, country_name: d.country_name }),
			image: d.image_cover,
		}));
	}

	function destCardsOther() {
		const list = data.destinationsOther ?? [];
		return list.map((d: any) => ({
			name: destinationCardLabel({ city_name: d.city_name, country_name: d.country_name }),
			image: d.image_cover,
		}));
	}

	let selectedDeal = $state<PackageListItem | null>(null);
	let dealModalOpen = $state(false);
	let dealSendBusy = $state(false);
	let dealSendErr = $state("");

	let userId = $state(0);
	let canSendToChat = $state(false);
	$effect(() => {
		const u = get(page).data.user as { user_id?: number; role?: string } | undefined;
		userId = (u?.user_id as number | undefined) ?? 0;
		canSendToChat = userId !== 0 && (u?.role ?? "USER") === "USER";
	});

	function openDeal(pkg: PackageListItem) {
		selectedDeal = pkg;
		dealSendErr = "";
		dealModalOpen = true;
	}

	function closeDeal() {
		dealModalOpen = false;
		selectedDeal = null;
		dealSendBusy = false;
		dealSendErr = "";
	}

	async function sendDealToChat() {
		if (!selectedDeal || dealSendBusy) return;
		dealSendErr = "";
		dealSendBusy = true;
		try {
			if (!canSendToChat) {
				await goto("/login");
				return;
			}

			const body = {
				packageId: selectedDeal.package_id,
				numberOfPeople: 1,
				note: "Interested in this deal (sent from Packages → View Deal).",
			};
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
				dealSendErr = typeof j.error === "string" ? j.error : "Could not send to chat.";
				return;
			}

			closeDeal();
			await goto("/userchat");
		} catch {
			dealSendErr = "Network error.";
		} finally {
			dealSendBusy = false;
		}
	}
</script>

<Header />

<!-- HERO SECTION -->
<section class="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-amber-600 py-24 text-white">
	<div class="absolute inset-0 opacity-10">
		<div class="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
		<div class="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
	</div>
	<div class="relative mx-auto max-w-7xl px-6 text-center">
		<h1 class="mb-4 text-5xl font-bold tracking-tight">Explore Travel Packages</h1>
		<p class="text-lg text-red-50 max-w-2xl mx-auto">Discover unforgettable adventures to destinations around the world. Find your perfect getaway today.</p>
	</div>
</section>

<!-- FILTERS SECTION -->
<section class="bg-gray-50 border-b border-gray-200 py-12">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">Filter Packages</div>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="flex flex-col gap-2">
				<label class="text-sm font-semibold text-gray-700" for="search">Search</label>
				<input
					id="search"
					placeholder="Search package name..."
					bind:value={search}
					class="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-200 outline-none transition"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-sm font-semibold text-gray-700" for="continent-select">Continent</label>
				<select bind:value={continent} id="continent-select" class="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-200 outline-none transition bg-white">
					{#each continentFilterOptions as c}
						<option value={c}>{c === "All" ? "All continents" : c}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-sm font-semibold text-gray-700" for="duration-select">Duration</label>
				<select bind:value={duration} id="duration-select" class="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-200 outline-none transition bg-white">
					<option value="All">Any Duration</option>
					<option value="5">5 Days</option>
					<option value="7">7 Days</option>
					<option value="10">10 Days</option>
				</select>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex justify-between items-center">
					<label class="text-sm font-semibold text-gray-700" for="pkg-max-price">Max Price</label>
					<span class="text-sm font-bold text-red-600">₱{maxPrice.toLocaleString()}</span>
				</div>
				<input
					id="pkg-max-price"
					type="range"
					min="20000"
					max="150000"
					step="5000"
					bind:value={maxPrice}
					class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
				/>
				<div class="text-xs text-gray-600 flex justify-between">
					<span>₱20k</span>
					<span>₱150k</span>
				</div>
			</div>
		</div>
		{#if filtered.length > 0}
			<div class="mt-4 text-sm text-gray-600">
				Showing <span class="font-semibold text-gray-900">{filtered.length}</span> package{filtered.length !== 1 ? 's' : ''}
			</div>
		{/if}
	</div>
</section>

<section class="mx-auto max-w-7xl px-6 pb-20">
	{#if filtered.length === 0}
		<div class="py-20 text-center">
			<div class="text-6xl mb-4">🔍</div>
			<p class="text-xl font-semibold text-gray-900">No packages found</p>
			<p class="text-gray-600 mt-2">Try adjusting your filters to discover more travel packages</p>
		</div>
	{:else}
		<div class="mb-8">
			<h2 class="text-3xl font-bold text-gray-900">Available Packages</h2>
			<p class="text-gray-600 mt-2">Handpicked travel experiences for your next adventure</p>
		</div>
		<div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each filtered as pkg}
				<div class="group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
					<div class="relative h-56 overflow-hidden bg-gray-200">
						{#if pkg.image}
							<img
								src={pkg.image}
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
								alt={pkg.name}
							/>
						{:else}
							<div
								class="h-full w-full bg-gradient-to-br from-red-100/50 to-gray-200"
								aria-hidden="true"
							></div>
						{/if}
						<div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<span class="absolute top-4 left-4 inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
							{pkg.badge}
						</span>
					</div>
					<div class="p-6">
						<h3 class="text-lg font-bold text-gray-900 line-clamp-2">{pkg.name}</h3>
						<p class="text-sm text-gray-600 mt-2">
							<span class="font-medium text-gray-700">{pkg.destinationLine}</span>
							{#if pkg.duration < 9999}
								<span class="text-gray-500"> · {pkg.duration} days</span>
							{/if}
						</p>
						<p class="text-xs text-gray-500 mt-1">📍 {pkg.continent}</p>
						
						{#if pkg.description}
							<p class="text-sm text-gray-600 mt-3 line-clamp-2">{pkg.description}</p>
						{/if}
						
						<div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
							<p class="text-2xl font-bold text-red-600">₱{pkg.price.toLocaleString()}</p>
							<button
								type="button"
								class="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
								onclick={() => openDeal(pkg)}
							>
								View Deal
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

{#if dealModalOpen && selectedDeal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all duration-300"
		role="dialog"
		tabindex="0"
		aria-modal="true"
		aria-label="Deal details"
		onclick={(e) => {
			if (e.currentTarget === e.target) closeDeal();
		}}
		onkeydown={(e) => {
			if (e.key === "Escape") closeDeal();
		}}
	>
		<div class="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
			<button
				type="button"
				class="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-110 transition-transform text-2xl text-gray-600 hover:text-gray-900"
				onclick={closeDeal}
				aria-label="Close"
			>
				×
			</button>

			<div class="grid gap-0 md:grid-cols-[1.2fr_1fr]">
				<div class="relative min-h-[300px] md:min-h-[400px] bg-gray-200 overflow-hidden">
					{#if selectedDeal.image}
						<img src={selectedDeal.image} alt={selectedDeal.name} class="h-full w-full object-cover" />
					{:else}
						<div class="h-full w-full bg-gradient-to-br from-red-100 to-gray-300" aria-hidden="true"></div>
					{/if}
					<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
					<div class="absolute left-6 top-6">
						<span class="inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
							{selectedDeal.badge}
						</span>
					</div>
				</div>

				<div class="p-8 flex flex-col justify-between">
					<div>
						<h2 class="text-3xl font-bold text-gray-900">{selectedDeal.name}</h2>
						<p class="mt-3 text-base text-gray-600">
							<span class="font-semibold text-gray-800">{selectedDeal.destinationLine}</span>
							<span class="text-gray-500">
								{#if selectedDeal.duration < 9999}
									<span> • {selectedDeal.duration} days</span>
								{/if}
							</span>
						</p>
						<p class="text-sm text-gray-600 mt-2 font-medium">📍 {selectedDeal.continent}</p>

						<p class="mt-6 text-4xl font-extrabold text-red-600">
							₱{selectedDeal.price.toLocaleString("en-PH")}
						</p>

						{#if selectedDeal.description}
							<div class="mt-6 pt-6 border-t border-gray-200">
								<p class="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
									{selectedDeal.description}
								</p>
							</div>
						{:else}
							<p class="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">No description provided yet.</p>
						{/if}
					</div>

					{#if dealSendErr}
						<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm text-red-800 font-medium" role="alert">⚠️ {dealSendErr}</p>
						</div>
					{/if}

					<div class="mt-8 flex flex-col gap-3">
						<button
							type="button"
							class="rounded-lg bg-red-600 hover:bg-red-700 px-6 py-3 text-base font-semibold text-white transition-colors duration-200"
							onclick={sendDealToChat}
							disabled={dealSendBusy}
						>
							{dealSendBusy ? "Sending…" : "Send to Chat"}
						</button>
						<a
							href="/userchat"
							class="text-center rounded-lg border-2 border-red-600 hover:bg-red-50 px-6 py-3 text-base font-semibold text-red-600 transition-colors duration-200"
						>
							Open Chat
						</a>
						<button
							type="button"
							class="rounded-lg border border-gray-300 hover:bg-gray-50 px-6 py-3 text-base font-semibold text-gray-700 transition-colors duration-200"
							onclick={closeDeal}
						>
							Close
						</button>
					</div>

					{#if !canSendToChat}
						<p class="mt-4 text-xs text-gray-600 text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
							ℹ️ Log in as a customer to send this deal to support chat.
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<section class="mx-auto max-w-7xl px-6 pb-20">
	<div class="mb-12">
		<h2 class="mb-2 text-4xl font-bold text-gray-900">Destinations by Continent</h2>
		<p class="text-gray-600">Explore our curated selection of travel destinations</p>
	</div>

	{#each data.continentCarouselOrder ?? [] as cont (cont)}
		{@const cards = destCardsForContinent(cont)}
		<div class="mb-16">
			<h3 class="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
				<span class="text-3xl">🌍</span>
				{cont}
			</h3>
			{#if cards.length === 0}
				<div class="w-full rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 py-12 text-center text-gray-600">
					<p class="text-lg font-medium">Coming soon</p>
					<p class="text-sm mt-2">More destinations in {cont} are being added</p>
				</div>
			{:else}
				<div class="relative group">
					<button
						type="button"
						onclick={() => scrollContinent(cont, -400)}
						class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg hover:shadow-xl p-3 text-2xl leading-none text-gray-700 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
					>
						‹
					</button>
					<div
						bind:this={carouselRefs[cont]}
						class="flex gap-6 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory scrollbar-hide"
					>
						{#each cards as d}
							<div class="group/card relative min-w-[280px] h-48 overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex-shrink-0 snap-start">
								{#if d.image}
									<img
										src={d.image}
										alt={d.name}
										class="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-110"
									/>
								{:else}
									<div
										class="h-full w-full bg-gradient-to-br from-red-100 to-gray-300"
										aria-hidden="true"
									></div>
								{/if}
								<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
								<div class="absolute inset-0 flex items-center justify-center">
									<h4 class="text-xl font-bold text-white text-center px-4 drop-shadow-lg">{d.name}</h4>
								</div>
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={() => scrollContinent(cont, 400)}
						class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg hover:shadow-xl p-3 text-2xl leading-none text-gray-700 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
					>
						›
					</button>
				</div>
			{/if}
		</div>
	{/each}

	{#if (data.destinationsOther ?? []).length > 0}
		{@const otherCards = destCardsOther()}
		<div class="mb-16">
			<h3 class="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
				<span class="text-3xl">🌏</span>
				Other Regions
			</h3>
			<div class="relative group">
				<button
					type="button"
					onclick={() => scrollContinent("__other__", -400)}
					class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg hover:shadow-xl p-3 text-2xl leading-none text-gray-700 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
				>
					‹
				</button>
				<div bind:this={carouselRefs["__other__"]} class="flex gap-6 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory scrollbar-hide">
					{#each otherCards as d}
						<div class="group/card relative min-w-[280px] h-48 overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex-shrink-0 snap-start">
							{#if d.image}
								<img
									src={d.image}
									alt={d.name}
									class="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-110"
								/>
							{:else}
								<div
									class="h-full w-full bg-gradient-to-br from-red-100 to-gray-300"
									aria-hidden="true"
								></div>
							{/if}
							<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
							<div class="absolute inset-0 flex items-center justify-center">
								<h4 class="text-xl font-bold text-white text-center px-4 drop-shadow-lg">{d.name}</h4>
							</div>
						</div>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => scrollContinent("__other__", 400)}
					class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg hover:shadow-xl p-3 text-2xl leading-none text-gray-700 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
				>
					›
				</button>
			</div>
		</div>
	{/if}
</section>

<Footer />
