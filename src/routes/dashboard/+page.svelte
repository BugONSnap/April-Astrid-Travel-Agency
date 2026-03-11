<script lang="ts">
import { onMount } from "svelte"
import Header from "$lib/assets/header.svelte"
import Footer from "$lib/assets/footer.svelte"

/* HERO SLIDES */

let currentSlide = 0

const slides = [
{
title:"Visit Japan 2026",
desc:"Cherry Blossom Tour",
image:"/japan.jpg"
},
{
title:"Explore Korea",
desc:"Seoul Winter Adventure",
image:"/korea.jpg"
},
{
title:"Europe Grand Tour",
desc:"10 Countries Travel Package",
image:"/europe.webp"
}
]

onMount(()=>{
setInterval(()=>{
currentSlide=(currentSlide+1)%slides.length
},5000)
})

/* PROMOS */

const promos=[
{title:"Tokyo Promo",price:"₱25,000",badge:"LIMITED",image:"/japan.jpg"},
{title:"Korea Winter",price:"₱22,000",badge:"SALE",image:"/korea.jpg"},
{title:"Singapore Trip",price:"₱18,000",badge:"HOT",image:"/singapore.webp"},
{title:"Hong Kong Tour",price:"₱19,000",badge:"NEW",image:"/hk.webp"},
{title:"Thailand Escape",price:"₱17,000",badge:"HOT",image:"/thailand.jpg"}
]

/* DESTINATIONS */

const destinations=[
{name:"Japan",image:"/japan.jpg"},
{name:"Korea",image:"/korea.jpg"},
{name:"Europe",image:"/europe.webp"},
{name:"Singapore",image:"/singapore.webp"},
{name:"Thailand",image:"/thailand.jpg"},
{name:"Australia",image:"/australia.webp"}
]

/* PACKAGES */

const packages={
Japan:[
{name:"Tokyo Cherry Blossom",price:"₱35,000"},
{name:"Osaka Food Tour",price:"₱30,000"}
],
Korea:[
{name:"Seoul Winter Tour",price:"₱28,000"},
{name:"Busan Beach Escape",price:"₱26,000"}
],
Europe:[
{name:"10 Country Europe",price:"₱120,000"}
],
Singapore:[
{name:"Singapore City Tour",price:"₱25,000"}
],
Thailand:[
{name:"Bangkok Explorer",price:"₱22,000"}
],
Australia:[
{name:"Sydney Adventure",price:"₱90,000"}
]
}

let selectedDestination: string | null = null

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

<button class="bg-red-600 px-6 py-2 rounded hover:bg-red-700">
Book Now
</button>

</div>

</div>

</div>

{/each}

</section>



<!-- STAR PROMO CAROUSEL -->

<section class="py-12">

<h2 class="text-2xl font-bold text-center mb-6">
⭐ Star Promotions
</h2>

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

</section>



<!-- DESTINATIONS -->

<section class="bg-gray-50 py-12">

<div class="max-w-7xl mx-auto px-4">

<h2 class="text-2xl font-bold mb-6">
🌏 Popular Destinations
</h2>

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

</div>

</section>



<!-- DESTINATION PACKAGES -->

{#if selectedDestination && packages[selectedDestination]}

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