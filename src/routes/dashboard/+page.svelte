<script lang="ts">
import { onMount } from "svelte"
import type { PageProps } from "./$types";
import Header from "$lib/assets/header.svelte"
import Footer from "$lib/assets/footer.svelte"

let { data }: PageProps = $props();

/* HERO SLIDES */

let currentSlide = 0

const slides = (data.promoPackages ?? []).slice(0, 3).map((p: any) => ({
	title: p.package_name,
	desc: p.description ?? "",
	image: p.image_url ?? "",
}))

onMount(() => {
	if (slides.length === 0) return;
	const id = setInterval(() => {
		currentSlide = (currentSlide + 1) % slides.length
	}, 5000)
	return () => clearInterval(id)
})

/* PROMOS */

const promos = (data.starPackages ?? []).map((p: any) => ({
	title: p.package_name,
	price: `₱${Number(p.price).toLocaleString("en-PH")}`,
	badge: p.category ?? "STAR",
	image: p.image_url ?? "",
}));

/* DESTINATIONS */

const destinations = (data.destinations ?? []).map((d: any) => ({
	name: d.country_name,
	image: d.image_cover ?? "",
}));

/* PACKAGES */

const packages = data.packagesByDestinationCountry ?? {}

let selectedDestination: string | null = null

// Modal state
let showModal = false;
let showTripTypeModal = false;
function openModal() { showModal = true; }
function closeModal() { showModal = false; showTripTypeModal = false; }
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
	"Photography / Scenic Travel"
];
let selectedTripType = "";

/* PROMO CAROUSEL */

let promoContainer: HTMLDivElement
let isDown=false
let startX=0
let scrollLeft=0

function startDrag(e:MouseEvent){
isDown=true
startX=e.pageX - promoContainer.offsetLeft
scrollLeft=promoContainer.scrollLeft
}

function endDrag(){
isDown=false
}

function drag(e:MouseEvent){
if(!isDown) return
e.preventDefault()

const x=e.pageX - promoContainer.offsetLeft
const walk=(x-startX)*2

promoContainer.scrollLeft=scrollLeft-walk
}

/* AUTO SCROLL PROMOS */

onMount(()=>{

setInterval(()=>{
if(promoContainer){
promoContainer.scrollLeft += 280
}
},4000)

})

</script>


<Header />

<!-- HERO CAROUSEL -->

<section class="w-full h-[420px] relative overflow-hidden">

{#if slides.length === 0}
	<div class="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-600">
		More coming soon
	</div>
{:else}

{#each slides as slide,index}

<div
class="absolute w-full h-full transition-opacity duration-700"
class:opacity-100={currentSlide===index}
class:opacity-0={currentSlide!==index}
>

<img src={slide.image} class="w-full h-full object-cover">

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<div class="text-center text-white">

<h1 class="text-4xl font-bold mb-2">
{slide.title}
</h1>

<p class="mb-4">
{slide.desc}
</p>



<button class="bg-red-600 px-6 py-2 rounded hover:bg-red-700" on:click={openModal}>
	Book Now
</button>

<!-- Main Modal Popup -->
{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

<div class="bg-white w-[380px] max-w-full rounded-2xl shadow-2xl p-6 relative animate-scale">

<button
class="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
on:click={closeModal}>
×
</button>

<h2 class="text-xl font-bold text-center mb-2 text-black"> 
Plan Your Dream Trip ✈️
</h2>

<p class="text-black text-sm text-center mb-6">
Choose how you want to start your journey
</p>

<div class="flex flex-col gap-3">

<button
class="flex items-center justify-between text-black bg-gray-100 hover:bg-red-600 hover:text-white transition p-4 rounded-xl shadow group"
on:click={() => { showModal = false; showTripTypeModal = true; }}
>
<span class="font-medium">Find a Trip For Me</span>
<span class="group-hover:translate-x-1 transition">→</span>
</button>

<button
class=" text-black flex items-center justify-between bg-gray-100 hover:bg-red-600 hover:text-white transition p-4 rounded-xl shadow group"
>
<span class="font-medium">Browse All Tours</span>
<span class="group-hover:translate-x-1 transition">→</span>
</button>

</div>

</div>
</div>
{/if}

<!-- Trip Type Modal Popup -->
{#if showTripTypeModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

<div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-scale">

<!-- CLOSE -->
<button
class="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
on:click={closeModal}>
×
</button>

<!-- TITLE -->
<h2 class="text-xl font-bold mb-1 text-gray-800">
What kind of trip are you looking for?
</h2>

<p class="text-gray-500 text-sm mb-5">
Select your travel style to personalize your experience
</p>

<!-- GRID -->
<div class="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-6">

{#each tripTypes as type}
<button
class={`p-3 rounded-xl border text-sm text-left transition font-medium
${selectedTripType === type 
? 'bg-red-50 border-red-600 text-red-700 shadow'
: 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
`}
on:click={() => selectedTripType = type}
>
{type}
</button>
{/each}

</div>

<!-- BUTTON -->
<button
class={`w-full py-3 rounded-xl font-semibold transition text-white
${selectedTripType 
? 'bg-red-600 hover:bg-red-700 shadow-lg'
: 'bg-gray-300 cursor-not-allowed'}
`}
disabled={!selectedTripType}
>
Continue →
</button>

</div>
</div>
{/if}
</div>

</div>

</div>

{/each}
{/if}

</section>



<!-- STAR PROMO CAROUSEL -->

<section class="py-12">

<h2 class="text-2xl font-bold text-center mb-6">
⭐ Star Promotions
</h2>

{#if promos.length === 0}
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
{:else}
<div
bind:this={promoContainer}
class="flex gap-6 overflow-x-auto px-6 cursor-grab scroll-smooth no-scrollbar"
on:mousedown={startDrag}
on:mouseleave={endDrag}
on:mouseup={endDrag}
on:mousemove={drag}
>

{#each promos as promo}

<div class="min-w-[260px] bg-white rounded-xl shadow hover:shadow-xl transition duration-300">

<div class="relative">

<img src={promo.image} class="h-40 w-full object-cover">

<span class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
{promo.badge}
</span>

</div>

<div class="p-4">

<h3 class="font-semibold">
{promo.title}
</h3>

<p class="text-red-600 font-bold">
{promo.price}
</p>

<button class="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
Book Now
</button>

</div>

</div>

{/each}

</div>
{/if}

</section>



<!-- DESTINATIONS -->

<section class="bg-gray-50 py-12">

<div class="max-w-7xl mx-auto px-4">

<h2 class="text-2xl font-bold mb-6">
🌏 Popular Destinations
</h2>

{#if destinations.length === 0}
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
{:else}
<div class="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">

{#each destinations as d}

<div
class="relative group rounded-xl overflow-hidden shadow cursor-pointer transform transition duration-500 hover:scale-105"
on:click={()=>selectedDestination=d.name}
>

<img
src={d.image}
class="w-full h-56 object-cover group-hover:scale-110 transition duration-500"
/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white text-2xl font-bold tracking-wider">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

{/if}

</div>


</section>



<!-- DESTINATION PACKAGES -->

{#if selectedDestination && packages[selectedDestination] && packages[selectedDestination].length > 0}

<section class="max-w-6xl mx-auto px-4 py-12">

<h2 class="text-2xl font-bold mb-6">
✈ Packages in {selectedDestination}
</h2>

<div class="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">

{#each packages[selectedDestination] as pkg}

<div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">

<h3 class="font-semibold mb-2">
{pkg.name}
</h3>

<p class="text-red-600 font-bold mb-4">
{pkg.price}
</p>

<button class="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
Book Package
</button>

</div>

{/each}

</div>

</section>

{:else if selectedDestination}

<section class="max-w-6xl mx-auto px-4 py-12">
	<div class="text-center py-10 text-gray-600 w-full bg-gray-50 rounded-xl border border-gray-200">
		More coming soon
	</div>
</section>

{/if}


<Footer />


<style>

/* hide scrollbar */

.no-scrollbar::-webkit-scrollbar{
display:none;
}

.no-scrollbar{
-ms-overflow-style:none;
scrollbar-width:none;
}

</style>