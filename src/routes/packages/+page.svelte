<script lang="ts">
import type { PageProps } from "./$types";
import Header from "$lib/assets/header.svelte"
import Footer from "$lib/assets/footer.svelte"

let { data }: PageProps = $props();

/* FILTER STATE */

let search=""
let continent="All"
let maxPrice=150000
let duration="All"

/* NOTE
 * This page should be fully DB-driven (no hardcoded package cards). We re-map the
 * server payload into the placeholder UI shape below.
 */

/* SERVER DATA MAPPING */

const asiaCountries = new Set((data.destinationsByRegion?.["Asia"] ?? []).map((d: any) => d.country_name));
const europeCountries = new Set((data.destinationsByRegion?.["Europe"] ?? []).map((d: any) => d.country_name));
const americaCountries = new Set((data.destinationsByRegion?.["America"] ?? []).map((d: any) => d.country_name));

// Re-map DB data into the UI shape used below.
const serverPackages = (data.packages ?? []).map((p: any) => {
	let pkgContinent = "Africa";
	if (asiaCountries.has(p.destination_country)) pkgContinent = "Asia";
	else if (europeCountries.has(p.destination_country)) pkgContinent = "Europe";
	else if (americaCountries.has(p.destination_country)) pkgContinent = "North America";

	return {
		name: p.package_name,
		country: p.destination_country,
		continent: pkgContinent,
		price: p.price,
		// If duration is missing, set to a very high number so it won't match duration filters.
		duration: p.duration_days ?? 9999,
		image: p.image_url,
		badge: p.category,
	};
});

/* FILTER */

const filtered = $derived(serverPackages.filter((p: any) => {

return(
(continent==="All"||p.continent===continent) &&
p.price<=maxPrice &&
(duration==="All"||p.duration<=parseInt(duration)) &&
p.name.toLowerCase().includes(search.toLowerCase())
)

}));

/* NETFLIX SCROLL */

let asiaCarousel: HTMLDivElement | null = null
let europeCarousel: HTMLDivElement | null = null
let americaCarousel: HTMLDivElement | null = null

function scrollLeft(el: HTMLDivElement | null | undefined) {
	el?.scrollBy({ left: -400, behavior: "smooth" });
}

function scrollRight(el: HTMLDivElement | null | undefined) {
	el?.scrollBy({ left: 400, behavior: "smooth" });
}

/* DESTINATIONS */

const asia = (data.destinationsByRegion?.["Asia"] ?? []).map((d: any) => ({
	name: d.city_name ? `${d.city_name}, ${d.country_name}` : d.country_name,
	image: d.image_cover,
}));

const europe = (data.destinationsByRegion?.["Europe"] ?? []).map((d: any) => ({
	name: d.city_name ? `${d.city_name}, ${d.country_name}` : d.country_name,
	image: d.image_cover,
}));

const america = (data.destinationsByRegion?.["America"] ?? []).map((d: any) => ({
	name: d.city_name ? `${d.city_name}, ${d.country_name}` : d.country_name,
	image: d.image_cover,
}));

</script>


<Header/>

<!-- HERO -->

<section class="bg-gradient-to-r from-red-600 to-orange-500 text-white py-20 text-center">

<h1 class="text-4xl font-bold mb-4">
Explore Travel Packages
</h1>

<p>
Find unforgettable adventures around the world
</p>

</section>



<!-- FILTER SECTION -->

<section class="max-w-7xl mx-auto py-12 px-6">

<div class="grid lg:grid-cols-4 md:grid-cols-2 gap-4">

<input
placeholder="Search package..."
bind:value={search}
class="border rounded-lg p-3"
/>

<select bind:value={continent} class="border rounded-lg p-3">

<option value="All">All Continents</option>
<option value="Asia">Asia</option>
<option value="Europe">Europe</option>
<option value="North America">North America</option>
<option value="Africa">Africa</option>

</select>


<select bind:value={duration} class="border rounded-lg p-3">

<option value="All">Any Duration</option>
<option value="5">5 Days</option>
<option value="7">7 Days</option>
<option value="10">10 Days</option>

</select>


<div>

<label class="text-sm text-gray-600">
Max Price ₱{maxPrice}
</label>

<input
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



<!-- PACKAGE GRID -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<div class="grid xl:grid-cols-3 lg:grid-cols-2 gap-10">

{#if filtered.length === 0}
	<div class="col-span-full text-center py-12 text-gray-600">More coming soon</div>
{:else}
	{#each filtered as pkg}

<div class="bg-white rounded-2xl shadow hover:shadow-2xl overflow-hidden group transition">

<div class="relative">

<img
src={pkg.image}
class="h-56 w-full object-cover group-hover:scale-110 transition"
alt={pkg.name}
/>

<span class="absolute top-4 left-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
{pkg.badge}
</span>

</div>

<div class="p-6">

<h3 class="font-semibold text-lg">
{pkg.name}
</h3>

<p class="text-gray-500 text-sm">
{pkg.country} • {pkg.duration >= 9999 ? "—" : pkg.duration} Days
</p>

<div class="flex justify-between items-center mt-4">

<p class="text-red-600 text-xl font-bold">
₱{pkg.price.toLocaleString()}
</p>

<button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
View Deal
</button>

</div>

</div>

</div>

	{/each}
{/if}

</div>

</section>



<!-- DESTINATION CAROUSELS -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
Asia Destinations
</h2>

{#if asia.length === 0}
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
{:else}
<div class="relative">

<button on:click={()=>scrollLeft(asiaCarousel)} class="absolute top-1/2 -left-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">‹</button>

<div bind:this={asiaCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each asia as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} alt={d.name} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(asiaCarousel)} class="absolute top-1/2 -right-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">›</button>

</div>
{/if}

</section>



<!-- EUROPE -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
Europe Destinations
</h2>

{#if europe.length === 0}
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
{:else}
<div class="relative">

<button on:click={()=>scrollLeft(europeCarousel)} class="absolute top-1/2 -left-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">‹</button>

<div bind:this={europeCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each europe as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} alt={d.name} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(europeCarousel)} class="absolute top-1/2 -right-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">›</button>

</div>
{/if}

</section>



<!-- AMERICA -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
America Destinations
</h2>

{#if america.length === 0}
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
{:else}
<div class="relative">

<button on:click={()=>scrollLeft(americaCarousel)} class="absolute top-1/2 -left-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">‹</button>

<div bind:this={americaCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each america as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} alt={d.name} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(americaCarousel)} class="absolute top-1/2 -right-4 -translate-y-1/2 bg-white rounded-full shadow p-2 text-3xl leading-none z-10 hover:shadow-lg">›</button>

</div>
{/if}

</section>


<Footer/>


