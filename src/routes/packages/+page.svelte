<script lang="ts">
import Header from "$lib/assets/header.svelte"
import Footer from "$lib/assets/footer.svelte"

/* FILTER STATE */

let search=""
let continent="All"
let maxPrice=150000
let duration="All"

/* PACKAGE DATA */

const packages=[
{
name:"Japan Cherry Blossom",
country:"Japan",
continent:"Asia",
price:45000,
duration:7,
image:"/japan.jpg",
badge:"HOT"
},
{
name:"Seoul Winter Tour",
country:"South Korea",
continent:"Asia",
price:38000,
duration:6,
image:"/korea.jpg",
badge:"SALE"
},
{
name:"Paris Romantic Escape",
country:"France",
continent:"Europe",
price:95000,
duration:8,
image:"/paris.webp",
badge:"HOT"
},
{
name:"Rome Historic Tour",
country:"Italy",
continent:"Europe",
price:88000,
duration:7,
image:"/rome.webp",
badge:"SALE"
},
{
name:"New York Explorer",
country:"USA",
continent:"North America",
price:120000,
duration:6,
image:"/ny.webp",
badge:"HOT"
},
{
name:"Kenya Safari Adventure",
country:"Kenya",
continent:"Africa",
price:110000,
duration:9,
image:"/kenya.webp",
badge:"HOT"
}
]

/* FILTER */

$: filtered=packages.filter(p=>{

return(
(continent==="All"||p.continent===continent) &&
p.price<=maxPrice &&
(duration==="All"||p.duration<=parseInt(duration)) &&
p.name.toLowerCase().includes(search.toLowerCase())
)

})

/* NETFLIX SCROLL */

let asiaCarousel:HTMLDivElement
let europeCarousel:HTMLDivElement
let americaCarousel:HTMLDivElement

function scrollLeft(el){
el.scrollBy({left:-400,behavior:"smooth"})
}

function scrollRight(el){
el.scrollBy({left:400,behavior:"smooth"})
}

/* DESTINATIONS */

const asia=[
{ name:"Japan", image:"/japan.jpg"},
{ name:"China", image:"/china.jpg"},
{ name:"South Korea", image:"/korea.jpg"},
{ name:"Singapore", image:"/singapore.webp"},
{ name:"Thailand", image:"/thailand.jpg"},
{ name:"Vietnam", image:"/vietnam.jpg"}
]

const europe=[
{ name:"France", image:"/paris.webp"},
{ name:"Italy", image:"/rome.webp"},
{ name:"Switzerland", image:"/swiss.webp"},
{ name:"Spain", image:"/spain.jpg"},
{ name:"Germany", image:"/germany.jpg"}
]

const america=[
{ name:"USA", image:"/ny.webp"},
{ name:"Canada", image:"/canada.jpg"},
{ name:"Mexico", image:"/mexico.jpg"},
{ name:"Brazil", image:"/brazil.jpg"}
]

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

{#each filtered as pkg}

<div class="bg-white rounded-2xl shadow hover:shadow-2xl overflow-hidden group transition">

<div class="relative">

<img
src={pkg.image}
class="h-56 w-full object-cover group-hover:scale-110 transition"
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
{pkg.country} • {pkg.duration} Days
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

</div>

</section>



<!-- DESTINATION CAROUSELS -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
Asia Destinations
</h2>

<div class="relative">

<button on:click={()=>scrollLeft(asiaCarousel)} class="carousel-btn left">‹</button>

<div bind:this={asiaCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each asia as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(asiaCarousel)} class="carousel-btn right">›</button>

</div>

</section>



<!-- EUROPE -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
Europe Destinations
</h2>

<div class="relative">

<button on:click={()=>scrollLeft(europeCarousel)} class="carousel-btn left">‹</button>

<div bind:this={europeCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each europe as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(europeCarousel)} class="carousel-btn right">›</button>

</div>

</section>



<!-- AMERICA -->

<section class="max-w-7xl mx-auto px-6 pb-20">

<h2 class="text-3xl font-bold mb-6">
America Destinations
</h2>

<div class="relative">

<button on:click={()=>scrollLeft(americaCarousel)} class="carousel-btn left">‹</button>

<div bind:this={americaCarousel} class="flex gap-6 overflow-x-auto scroll-smooth">

{#each america as d}

<div class="min-w-[260px] relative rounded-xl overflow-hidden shadow group">

<img src={d.image} class="h-44 w-full object-cover group-hover:scale-110 transition"/>

<div class="absolute inset-0 bg-black/40 flex items-center justify-center">

<h3 class="text-white font-bold text-lg">
{d.name}
</h3>

</div>

</div>

{/each}

</div>

<button on:click={()=>scrollRight(americaCarousel)} class="carousel-btn right">›</button>

</div>

</section>


<Footer/>


<style>

.carousel-btn{
position:absolute;
top:40%;
background:white;
border-radius:50%;
width:40px;
height:40px;
box-shadow:0 4px 10px rgba(0,0,0,0.2);
cursor:pointer;
z-index:5;
}

.left{
left:-20px;
}

.right{
right:-20px;
}

</style>