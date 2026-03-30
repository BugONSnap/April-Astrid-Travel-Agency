<script lang="ts">
	import type { PageProps } from "./$types";
	import Header from "$lib/assets/header.svelte";
	import Footer from "$lib/assets/footer.svelte";
	import type { Continent } from "$lib/geo/countryContinent";
	import { destinationCardLabel, packageDestinationCaption } from "$lib/display/destination";

	let { data }: PageProps = $props();

	let search = $state("");
	let continent = $state("All");
	let maxPrice = $state(150000);
	let duration = $state("All");

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
			name: p.package_name,
			country: p.destination_country,
			destinationLine: packageDestinationCaption(p.destination_city, p.destination_country),
			continent: p.destination_continent as Continent | "Other",
			price: p.price,
			duration: p.duration_days ?? 9999,
			image: p.image_url,
			badge: p.category,
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
</script>

<Header />

<section class="bg-linear-to-r from-red-600 to-orange-500 py-20 text-center text-white">
	<h1 class="mb-4 text-4xl font-bold">Explore Travel Packages</h1>
	<p>Find unforgettable adventures around the world</p>
</section>

<section class="mx-auto max-w-7xl px-6 py-12">
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<input
			placeholder="Search package..."
			bind:value={search}
			class="rounded-lg border p-3"
		/>

		<select bind:value={continent} class="rounded-lg border p-3">
			{#each continentFilterOptions as c}
				<option value={c}>{c === "All" ? "All continents" : c}</option>
			{/each}
		</select>

		<select bind:value={duration} class="rounded-lg border p-3">
			<option value="All">Any Duration</option>
			<option value="5">5 Days</option>
			<option value="7">7 Days</option>
			<option value="10">10 Days</option>
		</select>

		<div>
			<label class="text-sm text-gray-600" for="pkg-max-price">Max Price ₱{maxPrice}</label>
			<input
				id="pkg-max-price"
				type="range"
				min="20000"
				max="150000"
				step="5000"
				bind:value={maxPrice}
				class="w-full"
			/>
		</div>
	</div>
</section>

<section class="mx-auto max-w-7xl px-6 pb-20">
	<div class="grid gap-10 lg:grid-cols-2 xl:grid-cols-3">
		{#if filtered.length === 0}
			<div class="col-span-full py-12 text-center text-gray-600">More coming soon</div>
		{:else}
			{#each filtered as pkg}
				<div class="group overflow-hidden rounded-2xl bg-white shadow transition hover:shadow-2xl">
					<div class="relative">
						{#if pkg.image}
							<img
								src={pkg.image}
								class="h-56 w-full object-cover transition group-hover:scale-110"
								alt={pkg.name}
							/>
						{:else}
							<div
								class="h-56 w-full bg-linear-to-br from-red-900/25 to-slate-800/40"
								aria-hidden="true"
							></div>
						{/if}
						<span class="absolute top-4 left-4 rounded-full bg-red-600 px-3 py-1 text-xs text-white">
							{pkg.badge}
						</span>
					</div>
					<div class="p-6">
						<h3 class="text-lg font-semibold">{pkg.name}</h3>
						<p class="text-sm text-gray-500">
							{pkg.destinationLine} · {pkg.continent}
							{#if pkg.duration < 9999}
								· {pkg.duration} days
							{/if}
						</p>
						<div class="mt-4 flex items-center justify-between">
							<p class="text-xl font-bold text-red-600">₱{pkg.price.toLocaleString()}</p>
							<button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
								View Deal
							</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

<section class="mx-auto max-w-7xl px-6 pb-20">
	<h2 class="mb-6 text-3xl font-bold">Destinations by continent</h2>
	{#each data.continentCarouselOrder ?? [] as cont (cont)}
		{@const cards = destCardsForContinent(cont)}
		<div class="mb-16">
			<h3 class="mb-4 text-2xl font-semibold">{cont}</h3>
			{#if cards.length === 0}
				<div class="w-full rounded-xl border border-gray-200 bg-gray-50 py-10 text-center text-gray-600">
					More coming soon
				</div>
			{:else}
				<div class="relative">
					<button
						type="button"
						onclick={() => scrollContinent(cont, -400)}
						class="absolute top-1/2 -left-4 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-3xl leading-none shadow hover:shadow-lg"
					>
						‹
					</button>
					<div
						bind:this={carouselRefs[cont]}
						class="flex gap-6 overflow-x-auto scroll-smooth"
					>
						{#each cards as d}
							<div class="group relative min-w-[260px] overflow-hidden rounded-xl shadow">
								{#if d.image}
									<img
										src={d.image}
										alt={d.name}
										class="h-44 w-full object-cover transition group-hover:scale-110"
									/>
								{:else}
									<div
										class="h-44 w-full bg-linear-to-br from-red-900/20 to-slate-800/35"
										aria-hidden="true"
									></div>
								{/if}
								<div class="absolute inset-0 flex items-center justify-center bg-black/40">
									<h4 class="text-lg font-bold text-white">{d.name}</h4>
								</div>
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={() => scrollContinent(cont, 400)}
						class="absolute top-1/2 -right-4 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-3xl leading-none shadow hover:shadow-lg"
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
			<h3 class="mb-4 text-2xl font-semibold">Other regions</h3>
			<div class="relative">
				<button
					type="button"
					onclick={() => scrollContinent("__other__", -400)}
					class="absolute top-1/2 -left-4 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-3xl leading-none shadow hover:shadow-lg"
				>
					‹
				</button>
				<div bind:this={carouselRefs["__other__"]} class="flex gap-6 overflow-x-auto scroll-smooth">
					{#each otherCards as d}
						<div class="group relative min-w-[260px] overflow-hidden rounded-xl shadow">
							{#if d.image}
								<img
									src={d.image}
									alt={d.name}
									class="h-44 w-full object-cover transition group-hover:scale-110"
								/>
							{:else}
								<div
									class="h-44 w-full bg-linear-to-br from-red-900/20 to-slate-800/35"
									aria-hidden="true"
								></div>
							{/if}
							<div class="absolute inset-0 flex items-center justify-center bg-black/40">
								<h4 class="text-lg font-bold text-white">{d.name}</h4>
							</div>
						</div>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => scrollContinent("__other__", 400)}
					class="absolute top-1/2 -right-4 z-10 -translate-y-1/2 rounded-full bg-white p-2 text-3xl leading-none shadow hover:shadow-lg"
				>
					›
				</button>
			</div>
		</div>
	{/if}
</section>

<Footer />
