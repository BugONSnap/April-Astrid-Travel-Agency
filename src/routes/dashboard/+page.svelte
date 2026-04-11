<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import type { PageProps } from "./$types";
	import Header from "$lib/assets/header.svelte";
	import Footer from "$lib/assets/footer.svelte";
	import DestinationPackagesModal from "$lib/components/DestinationPackagesModal.svelte";
	import {
		CONTINENT_DISPLAY_LABEL,
		CONTINENT_GRID_ROWS,
		CONTINENT_ORDER,
		resolveDestinationContinent,
		type Continent,
	} from "$lib/geo/countryContinent";
	import {
		compareDestinationsHubFirst,
		destinationCardLabel,
	} from "$lib/display/destination";

	type ContinentPicker = Continent | "Other";

	let { data }: PageProps = $props();

	type DashboardDestination = {
		destination_id: number;
		country_name: string;
		city_name: string | null;
		continent: string | null;
		image_cover: string | null;
	};

	const slides = $derived(
		(data.promoPackages ?? []).slice(0, 3).map((p: any) => ({
			title: p.package_name,
			desc: p.description ?? "",
			image: p.image_url ?? "",
		})),
	);

	const promos = $derived(
		(data.starPackages ?? []).map((p: any) => ({
			title: p.package_name,
			price: `₱${Number(p.price).toLocaleString("en-PH")}`,
			badge: p.category ?? "STAR",
			image: p.image_url ?? "",
		})),
	);

	function destinationLabel(d: DashboardDestination) {
		return destinationCardLabel({ city_name: d.city_name, country_name: d.country_name });
	}

	const groupedDestinations = $derived.by(() => {
		const raw = (data.destinations ?? []) as DashboardDestination[];
		const buckets: Record<Continent, DashboardDestination[]> = {
			Africa: [],
			Asia: [],
			Europe: [],
			"North America": [],
			"South America": [],
			Oceania: [],
		};
		const other: DashboardDestination[] = [];

		for (const d of raw) {
			const c = resolveDestinationContinent(d.continent, d.country_name);
			if (c === "Other") other.push(d);
			else buckets[c].push(d);
		}

		for (const key of CONTINENT_ORDER) {
			buckets[key].sort(compareDestinationsHubFirst);
		}
		other.sort(compareDestinationsHubFirst);

		return { buckets, other };
	});

	const hasAnyDestination = $derived((data.destinations ?? []).length > 0);

	let selectedContinentView = $state<ContinentPicker | null>(null);

	const countriesInSelectedContinent = $derived.by(() => {
		if (selectedContinentView === null) return [];
		if (selectedContinentView === "Other") return groupedDestinations.other;
		return groupedDestinations.buckets[selectedContinentView];
	});

	const continentTileHeading = $derived(
		selectedContinentView === null
			? ""
			: selectedContinentView === "Other"
				? "OTHER REGIONS"
				: CONTINENT_DISPLAY_LABEL[selectedContinentView],
	);

	const packagesByDestinationId = $derived(
		(data.packagesByDestinationId ?? {}) as Record<number, Array<{ name: string; price: string }>>,
	);

	let currentSlide = $state(0);
	let selectedDestinationId = $state<number | null>(null);
	let showModal = $state(false);
	let showTripTypeModal = $state(false);
	let showDestinationPackagesModal = $state(false);
	let selectedTripType = $state("");

	const tripTypes = [
		"Beach / Island Escape",
		"Adventure & Outdoor",
		"Nature & Wildlife",
		"City Exploration",
		"Cultural & Historical",
		"Food & Culinary",
		"Luxury Getaway",
		"Budget Travel",
		"Family Vacation",
		"Romantic / Honeymoon",
		"Wellness & Relaxation",
		"Festival / Events",
		"Road Trip",
		"Island Hopping",
		"Photography / Scenic Travel",
	];

	const selectedDestinationRow = $derived(
		selectedDestinationId == null
			? null
			: ((data.destinations ?? []) as DashboardDestination[]).find(
					(d) => d.destination_id === selectedDestinationId,
				) ?? null,
	);

	const selectedPackages = $derived(
		selectedDestinationId != null
			? (packagesByDestinationId[selectedDestinationId] ?? [])
			: [],
	);

	let promoContainer = $state<HTMLDivElement | null>(null);
	let isDown = $state(false);
	let startX = $state(0);
	let scrollLeftStart = $state(0);

	function openBookingOptions() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		showTripTypeModal = false;
	}

	async function browseAllTours() {
		closeModal();
		await goto("/packages");
	}

async function continueWithTripType() {
	if (!selectedTripType) return;
	closeModal();
	await goto(`/packages?tripType=${encodeURIComponent(selectedTripType)}`);
}

function openDestinationPackages(destinationId: number) {
	selectedDestinationId = destinationId;
	showDestinationPackagesModal = true;
}

function closeDestinationPackagesModal() {
	showDestinationPackagesModal = false;
}

function startDrag(e: PointerEvent) {
		if (!promoContainer) return;
		isDown = true;
		startX = e.pageX - promoContainer.offsetLeft;
		scrollLeftStart = promoContainer.scrollLeft;
	}

	function endDrag() {
		isDown = false;
	}

	function drag(e: PointerEvent) {
		if (!isDown || !promoContainer) return;
		e.preventDefault();
		const x = e.pageX - promoContainer.offsetLeft;
		const walk = (x - startX) * 2;
		promoContainer.scrollLeft = scrollLeftStart - walk;
	}

	onMount(() => {
		let slideTimer: ReturnType<typeof setInterval> | null = null;
		let promoTimer: ReturnType<typeof setInterval> | null = null;

		if (slides.length > 0) {
			slideTimer = setInterval(() => {
				currentSlide = (currentSlide + 1) % slides.length;
			}, 5000);
		}

		promoTimer = setInterval(() => {
			if (!promoContainer) return;
			const max = promoContainer.scrollWidth - promoContainer.clientWidth;
			if (promoContainer.scrollLeft >= max - 5) {
				promoContainer.scrollLeft = 0;
			} else {
				promoContainer.scrollLeft += 280;
			}
		}, 4000);

		return () => {
			if (slideTimer) clearInterval(slideTimer);
			if (promoTimer) clearInterval(promoTimer);
		};
	});
</script>

<Header />

<section class="relative h-105 w-full overflow-hidden">
	{#if slides.length === 0}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-600">More coming soon</div>
	{:else}
		{#each slides as slide, index}
			<div
				class="absolute h-full w-full transition-opacity duration-700"
				class:opacity-100={currentSlide === index}
				class:opacity-0={currentSlide !== index}
			>
				<img src={slide.image} alt={slide.title} class="h-full w-full object-cover" />
				<div class="absolute inset-0 flex items-center justify-center bg-black/40">
					<div class="px-4 text-center text-white">
						<h1 class="mb-2 text-4xl font-bold">{slide.title}</h1>
						<p class="mb-4">{slide.desc}</p>
						<button class="rounded bg-red-600 px-6 py-2 hover:bg-red-700" onclick={openBookingOptions}>Book Now</button>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</section>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
		<div class="relative w-95 max-w-full rounded-2xl bg-white p-6 shadow-2xl animate-scale">
			<button class="absolute top-3 right-4 text-xl text-gray-500 hover:text-black" onclick={closeModal}>×</button>
			<h2 class="mb-2 text-center text-xl font-bold text-black">Plan Your Dream Trip ✈️</h2>
			<p class="mb-6 text-center text-sm text-black">Choose how you want to start your journey</p>

			<div class="flex flex-col gap-3">
				

				<button
					class="group flex items-center justify-between rounded-xl bg-gray-100 p-4 text-black shadow transition hover:bg-red-600 hover:text-white"
					onclick={browseAllTours}
				>
					<span class="font-medium">Browse All Tours</span>
					<span class="transition group-hover:translate-x-1">→</span>
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showTripTypeModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
		<div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale">
			<button class="absolute top-3 right-4 text-xl text-gray-500 hover:text-black" onclick={closeModal}>×</button>

			<h2 class="mb-1 text-xl font-bold text-gray-800">What kind of trip are you looking for?</h2>
			<p class="mb-5 text-sm text-gray-500">Select your travel style to personalize your experience</p>

			<div class="mb-6 grid grid-cols-2 gap-3">
				{#each tripTypes as type}
					<button
						class={[
							"rounded-xl border p-3 text-left text-sm font-medium transition",
							selectedTripType === type
								? "border-red-600 bg-red-50 text-red-700 shadow"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200",
						].join(" ")}
						onclick={() => (selectedTripType = type)}
					>
						{type}
					</button>
				{/each}
			</div>

			<button
				class={[
					"w-full rounded-xl py-3 font-semibold text-white transition",
					selectedTripType ? "bg-red-600 shadow-lg hover:bg-red-700" : "cursor-not-allowed bg-gray-300",
				].join(" ")}
				disabled={!selectedTripType}
				onclick={continueWithTripType}
			>
				Continue →
			</button>
		</div>
	</div>
{/if}

<section class="py-12">
	<h2 class="mb-6 text-center text-2xl font-bold">⭐ Star Promotions</h2>
	{#if promos.length === 0}
		<div class="w-full rounded-xl border border-gray-200 bg-gray-50 py-10 text-center text-gray-600">More coming soon</div>
	{:else}
		<div
			bind:this={promoContainer}
			class="no-scrollbar flex cursor-grab gap-6 overflow-x-auto scroll-smooth px-6"
			role="region"
			aria-label="Star promotions carousel"
			onpointerdown={startDrag}
			onpointerleave={endDrag}
			onpointerup={endDrag}
			onpointermove={drag}
		>
			{#each promos as promo}
					<div class="min-w-65 rounded-xl bg-white shadow transition duration-300 hover:shadow-xl">
					<div class="relative">
						<img src={promo.image} alt={promo.title} class="h-40 w-full object-cover" />
						<span class="absolute top-2 left-2 rounded bg-red-600 px-2 py-1 text-xs text-white">{promo.badge}</span>
					</div>

					<div class="p-4">
						<h3 class="font-semibold">{promo.title}</h3>
						<p class="font-bold text-red-600">{promo.price}</p>
						<button class="mt-3 w-full rounded bg-red-600 py-2 text-white hover:bg-red-700" onclick={browseAllTours}>
							Book Now
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<section class="bg-gray-50 py-12">
	<div class="mx-auto max-w-7xl px-4">
		<h2 class="mb-2 text-2xl font-bold">🌏 Popular Destinations</h2>
		<p class="mb-8 text-sm text-gray-600">
			Choose a continent, then pick a place. Country entries show the country name; city entries show “City, Country”.
		</p>
		{#if !hasAnyDestination}
			<div class="w-full rounded-xl border border-gray-200 bg-gray-50 py-10 text-center text-gray-600">More coming soon</div>
		{:else if selectedContinentView === null}
			<div class="flex flex-col gap-5">
				{#each CONTINENT_GRID_ROWS as row}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{#each row as continent}
							{@const count = groupedDestinations.buckets[continent].length}
							<button
								type="button"
								class="flex min-h-25 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-6 shadow-sm transition hover:border-red-600/40 hover:bg-red-50/50 hover:shadow-md"
								onclick={() => (selectedContinentView = continent)}
							>
								<span class="text-center font-bold tracking-[0.12em] text-gray-900 sm:text-lg">
									{CONTINENT_DISPLAY_LABEL[continent]}
								</span>
								<span class="mt-2 text-xs text-gray-500">
									{count} destination{count === 1 ? "" : "s"}
								</span>
							</button>
						{/each}
					</div>
				{/each}

				{#if groupedDestinations.other.length > 0}
					<button
						type="button"
						class="w-full rounded-xl border-2 border-dashed border-amber-300/80 bg-amber-50/70 px-4 py-4 text-center font-bold tracking-widest text-amber-900 transition hover:bg-amber-100/80"
						onclick={() => (selectedContinentView = "Other")}
					>
						OTHER REGIONS
						<span class="mt-1 block text-xs font-normal text-amber-800/90">
							{groupedDestinations.other.length} destination{groupedDestinations.other.length === 1 ? "" : "s"}
						</span>
					</button>
				{/if}
			</div>
		{:else}
			<div class="mb-6 flex flex-wrap items-center gap-3">
				<button
					type="button"
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
					onclick={() => (selectedContinentView = null)}
				>
					← Continents
				</button>
				<h3 class="text-xl font-bold tracking-wide text-gray-900">{continentTileHeading}</h3>
			</div>

			{#if countriesInSelectedContinent.length === 0}
				<p class="text-sm text-gray-600">No destinations in this region yet.</p>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each countriesInSelectedContinent as d (d.destination_id)}
						<button
							type="button"
							class={[
								"relative overflow-hidden rounded-xl shadow transition duration-500",
								"hover:scale-[1.02]",
								selectedDestinationId === d.destination_id ? "ring-4 ring-red-500/50" : "",
							].join(" ")}
							onclick={() => openDestinationPackages(d.destination_id)}
						>
							{#if d.image_cover}
								<img
									src={d.image_cover}
									alt={destinationLabel(d)}
									class="h-48 w-full object-cover transition duration-500"
								/>
							{:else}
								<div
									class="h-48 w-full bg-linear-to-br from-red-800/25 to-slate-800/40"
									aria-hidden="true"
								></div>
							{/if}
							<div class="absolute inset-0 flex items-center justify-center bg-black/40 px-3 text-center">
								<span class="text-lg font-bold tracking-wide text-white drop-shadow md:text-xl">
									{destinationLabel(d)}
								</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</section>

<DestinationPackagesModal
	open={showDestinationPackagesModal && selectedDestinationRow != null}
	destinationLabel={selectedDestinationRow ? destinationLabel(selectedDestinationRow) : ""}
	packages={selectedPackages}
	on:close={closeDestinationPackagesModal}
	on:primaryAction={browseAllTours}
/>

<Footer />

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>