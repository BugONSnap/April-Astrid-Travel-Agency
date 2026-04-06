<script lang="ts">
	import Header from '$lib/assets/header.svelte';
	import Footer from '$lib/assets/footer.svelte';
	import { resolveDestinationContinent } from '$lib/geo/countryContinent';
	import {
		compareDestinationsHubFirst,
		destinationCardLabel,
		packageDestinationCaption,
	} from '$lib/display/destination';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	function formatPrice(p: number) {
		return `₱${p.toLocaleString('en-PH')}`;
	}

	function snippet(text: string | null | undefined, max = 140) {
		if (!text) return '';
		const t = text.trim();
		if (t.length <= max) return t;
		return `${t.slice(0, max).trim()}…`;
	}

	/** Marquee CSS expects several items for a smooth loop; duplicate when few. */
	function marqueeItems<T>(items: T[]): T[] {
		if (items.length === 0) return [];
		if (items.length >= 6) return items;
		return [...items, ...items];
	}

	const heroSlides = $derived(
		data.promoPackages.length > 0 ? data.promoPackages : null,
	);
	const heroCount = $derived(heroSlides?.length ?? 1);
	let heroIndex = $state(0);

	function heroPrev(i: number) {
		return (i - 1 + heroCount) % heroCount;
	}
	function heroNext(i: number) {
		return (i + 1) % heroCount;
	}

	function setHero(i: number) {
		heroIndex = ((i % heroCount) + heroCount) % heroCount;
	}

	onMount(() => {
		if (!heroSlides || heroCount <= 1) return;
		const t = setInterval(() => {
			heroIndex = heroNext(heroIndex);
		}, 5000);
		return () => clearInterval(t);
	});

	const starMarquee = $derived(marqueeItems(data.starPackages));
	const featuredMarquee = $derived(marqueeItems(data.featuredPackages));

	/** Home Destinations: first 8 only; 9th tile is “See more” → dashboard (logged in) or login. */
	const destinationsPreview = $derived(
		[...data.destinations].sort(compareDestinationsHubFirst).slice(0, 8),
	);
	const destinationsSeeMoreHref = $derived(data.user ? '/dashboard' : '/login');
</script>

<Header />

<!-- Hero: PROMO packages from admin, or placeholder -->
<section class="hero-carousel" data-section="hero-carousel" aria-label="Hero carousel">
	<div class="carousel">
		<ul class="slides">
			{#if heroSlides}
				{#each heroSlides as p, i (p.package_id)}
					<li class="slide-container">
						<div class="slide-image" class:is-active={i === heroIndex}>
							{#if p.image_url}
								<img src={p.image_url} alt="" />
							{:else}
								<div class="slide-image-fallback" aria-hidden="true"></div>
							{/if}
							<div class="slide-caption">
								<h3>{p.package_name}</h3>
								<p>
									{formatPrice(p.price)}
									{#if packageDestinationCaption(p.destination_city, p.destination_country)}
										<span class="slide-caption-meta">
											· {packageDestinationCaption(p.destination_city, p.destination_country)}
										</span>
									{/if}
								</p>
							</div>
						</div>
						<div class="carousel-controls">
							<button type="button" class="prev-slide" onclick={() => setHero(heroPrev(heroIndex))} aria-label="Previous slide">
								<span>&lsaquo;</span>
							</button>
							<button type="button" class="next-slide" onclick={() => setHero(heroNext(heroIndex))} aria-label="Next slide">
								<span>&rsaquo;</span>
							</button>
						</div>
					</li>
				{/each}
				<div class="carousel-dots">
					{#each heroSlides as _, i}
						<button
							type="button"
							class="carousel-dot"
							class:is-active={i === heroIndex}
							aria-label={`Go to slide ${i + 1}`}
							onclick={() => setHero(i)}
						></button>
					{/each}
				</div>
			{:else}
				<li class="slide-container">
					<div class="slide-image slide-image--placeholder is-active">
						<div class="slide-caption slide-caption--center">
							<h3>More coming soon</h3>
							<p>Promotional packages will show here when they are added.</p>
						</div>
					</div>
					<div class="carousel-controls">
						<button type="button" class="prev-slide" aria-label="Previous slide" disabled><span>&lsaquo;</span></button>
						<button type="button" class="next-slide" aria-label="Next slide" disabled><span>&rsaquo;</span></button>
					</div>
				</li>
				<div class="carousel-dots">
					<button type="button" class="carousel-dot is-active" aria-label="Slide 1"></button>
				</div>
			{/if}
		</ul>
	</div>
	<div class="hero-overlay">
		<h1 class="hero-title">Explore</h1>
		<p class="hero-tagline">We plan, you pack</p>
	</div>
</section>

<!-- [DEBUG] Section: welcome-message -->
<section class="w-full px-4 sm:px-6 py-12 sm:py-16" data-section="welcome-message" aria-label="Welcome message">
	<div
		class="mx-auto max-w-4xl rounded-2xl bg-[#c41e3a] px-6 py-12 sm:px-10 sm:py-14 shadow-xl text-center text-white"
	>
		<h2 class="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
			Welcome to April-Astrid Travel Agency!
		</h2>
		<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
			It's our pleasure to be your trusted travel partner in Manila, Philippines.
		</p>
		<p class="mx-auto mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
			At April-Astrid Travel Agency, we specialize in airline ticketing and thoughtfully
			curated tour and vacation packages designed to make every journey seamless and memorable.
		</p>
		<div class="mt-10 flex flex-wrap justify-center gap-4">
			<a
				href="/packages?tour=international"
				class="inline-flex rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#c41e3a]"
			>
				BOOK NOW
			</a>
			
		</div>
	</div>
</section>

<!-- Destinations from admin -->
<section
	class="w-full bg-[#f7f7f7] py-12 flex flex-col items-center gap-6"
	data-section="destinations"
	aria-label="Destinations"
>
	<h2 class="m-0 text-3xl sm:text-4xl font-semibold font-serif text-[#111] text-center">
		Destinations
	</h2>
	{#if data.destinations.length === 0}
		<p
			class="w-full text-center py-10 text-gray-600 bg-gray-50 rounded-xl border border-gray-200 max-w-[1100px]"
		>
			More coming soon
		</p>
	{:else}
		<div class="w-full max-w-[1100px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each destinationsPreview as d (d.destination_id)}
				<a
					href="/packages"
					class="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
				>
					{#if d.image_cover}
						<img
							src={d.image_cover}
							alt={destinationCardLabel({ city_name: d.city_name, country_name: d.country_name })}
							class="w-full h-40 object-cover"
						/>
					{:else}
						<div
							class="w-full h-40 bg-linear-to-br from-[#c41e3a]/20 to-slate-800/30"
							aria-hidden="true"
						></div>
					{/if}
					<div class="p-4">
						<span class="block font-semibold text-lg text-gray-900">
							{destinationCardLabel({ city_name: d.city_name, country_name: d.country_name })}
						</span>
						<span class="mt-1 inline-block rounded-full bg-[#c41e3a]/10 px-2 py-0.5 text-xs font-semibold text-[#c41e3a]">
							{resolveDestinationContinent(d.continent, d.country_name)}
						</span>
						{#if d.description}
							<p class="mt-2 text-sm text-gray-600">{snippet(d.description, 96)}</p>
						{/if}
					</div>
				</a>
			{/each}
			<a
				href={destinationsSeeMoreHref}
				class="flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#c41e3a]/35 bg-white p-6 text-center shadow-sm transition hover:border-[#c41e3a]/60 hover:bg-[#c41e3a]/5 hover:shadow-md"
			>
				<span class="text-lg font-semibold text-[#c41e3a]">See more</span>
				<span class="mt-2 text-sm text-gray-600">
					{data.user ? 'View all destinations on your dashboard' : 'Sign in to explore all destinations'}
				</span>
			</a>
		</div>
	{/if}
</section>

<!-- [DEBUG] Section: packages carousels - Star Packages & Featured Travel Experiences -->
<section
	class="packages-carousels-wrapper"
	data-section="packages-marquee-carousel"
	aria-label="Packages carousels"
>
	<!-- Star Packages carousel (category STAR) -->
	<div class="marquee-carousel-section" data-subsection="star-packages">
		<h2 class="marquee-section-title">Star Packages</h2>
		{#if data.starPackages.length === 0}
			<p class="w-full text-center py-10 text-gray-600 bg-gray-50 rounded-xl border border-gray-200 max-w-[1100px]">More coming soon</p>
		{:else}
			<div
				class="marquee-carousel"
				data-mask
				style="--items: {starMarquee.length}"
			>
				{#each starMarquee as p, i (p.package_id + '-' + i)}
					<article style="--i: {i}">
						<span class="card-label">{p.package_name}</span>
						{#if p.image_url}
							<img src={p.image_url} alt="" />
						{:else}
							<div class="marquee-card-image-placeholder" aria-hidden="true"></div>
						{/if}
						<div class="card-text-block">
							<p>
								{snippet(p.description) ||
									`${formatPrice(p.price)} · ${packageDestinationCaption(p.destination_city, p.destination_country) || 'Package'}`}
							</p>
							<a href="/packages">Read more</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Featured Travel Experiences (category FEATURED) -->
	<div class="marquee-carousel-section" data-subsection="featured-travel-experiences">
		<h2 class="marquee-section-title">Featured Travel Experiences</h2>
		{#if data.featuredPackages.length === 0}
			<p class="w-full text-center py-10 text-gray-600 bg-gray-50 rounded-xl border border-gray-200 max-w-[1100px]">More coming soon</p>
		{:else}
			<div
				class="marquee-carousel"
				data-mask
				style="--items: {featuredMarquee.length}"
			>
				{#each featuredMarquee as p, i (p.package_id + '-' + i)}
					<article style="--i: {i}">
						<span class="card-label">{p.package_name}</span>
						{#if p.image_url}
							<img src={p.image_url} alt="" />
						{:else}
							<div class="marquee-card-image-placeholder" aria-hidden="true"></div>
						{/if}
						<div class="card-text-block">
							<p>
								{snippet(p.description) ||
									`${formatPrice(p.price)} · ${packageDestinationCaption(p.destination_city, p.destination_country) || 'Package'}`}
							</p>
							<a href="/packages">Read more</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Services Offered -->
<section class="services-offered-section" data-section="services-offered" aria-label="Services offered">
	<div class="services-offered-container">
		<h2 class="services-offered-title">
			<svg class="services-offered-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/>
			</svg>
			Services Offered
		</h2>
		<div class="services-offered-grid">
			<div class="services-column">
				<a href="/services/dfa-passport-appointment">DFA PASSPORT APPOINTMENT</a>
				<a href="/services/tourist-visa-assistance">TOURIST VISA ASSISTANCE</a>
				<a href="/services/international-domestic-ticketing">INTERNATIONAL / DOMESTIC TICKETING</a>
				<a href="/services/international-domestic-package-tours">INTERNATIONAL / DOMESTIC PACKAGE TOURS</a>
				<a href="/services/hotel-booking">HOTEL BOOKING</a>
			</div>
			<div class="services-column">
				<a href="/services/travel-insurance">TRAVEL INSURANCE</a>
				<a href="/services/flight-rebooking">FLIGHT REBOOKING</a>
				<a href="/services/apostille">APOSTILLE</a>
				<a href="/services/red-ribbon">RED RIBBON</a>
				<a href="/services/psa-nbi-online-appointment">PSA AND NBI ONLINE APPOINTMENT</a>
			</div>
		</div>
	</div>
</section>

<!-- Our Partners -->
<section class="partners-section" data-section="partners" aria-label="Our partners">
	<h2 class="partners-title">Partners</h2>
	<div class="partners-grid">
		<div class="partners-logo"><img src="/partner1.png" alt="BOSZTAA" /></div>
		<div class="partners-logo"><img src="/partner2.png" alt="GTBA" /></div>
		<div class="partners-logo"><img src="/partner3.png" alt="Department of Tourism Philippines" /></div>
		<div class="partners-logo"><img src="/partner4.png" alt="NAITAS" /></div>
		<div class="partners-logo"><img src="/partner6.png" alt="Cebu Pacific" /></div>
		<div class="partners-logo"><img src="/partner7.png" alt="AirAsia" /></div>
		<div class="partners-logo"><img src="/partner8.png" alt="Singapore Airlines" /></div>
		<div class="partners-logo"><img src="/partner9.png" alt="Cathay Pacific" /></div>
		<div class="partners-logo"><img src="/partner11.png" alt="TPB Philippines" /></div>
		<div class="partners-logo"><img src="/partner10.png" alt="DTI Philippines" /></div>
		<div class="partners-logo"><img src="/partner15.png" alt="Bataan Sangguniang Panlalawigan" /></div>
		<div class="partners-logo"><img src="/partner12.png" alt="WITM Worldmaster" /></div>
	</div>
</section>

<Footer />

<style>
	.hero-carousel {
		position: relative;
		width: 100%;
		min-height: 85vh;
	}

	.hero-carousel .carousel {
		width: 100%;
		margin: 0;
	}

	.hero-carousel ul.slides {
		display: block;
		position: relative;
		height: 85vh;
		min-height: 500px;
		margin: 0;
		padding: 0;
		overflow: hidden;
		list-style: none;
	}

	.slides * {
		user-select: none;
		-ms-user-select: none;
		-moz-user-select: none;
		-khtml-user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.slide-container {
		display: block;
	}

	.slide-image {
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		opacity: 0;
		transition: all 0.7s ease-in-out;
	}
	.slide-image.is-active {
		opacity: 1;
		transform: scale(1);
		transition: opacity 1s ease-in-out;
	}

	.slide-image img {
		width: auto;
		min-width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.slide-image-fallback {
		width: 100%;
		height: 100%;
		min-height: 100%;
		background: linear-gradient(135deg, #1a1a2e 0%, #c41e3a 50%, #16213e 100%);
	}

	.slide-image--placeholder {
		background: linear-gradient(135deg, #2d2d44 0%, #c41e3a 45%, #1a1a2e 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slide-caption {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		padding: 2rem 1.25rem 1.25rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.82));
		color: #fff;
		text-align: left;
		pointer-events: none;
	}

	.slide-caption h3 {
		margin: 0;
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		font-weight: 600;
		line-height: 1.25;
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
	}

	.slide-caption p {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		opacity: 0.95;
		text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
	}

	.slide-caption-meta {
		font-weight: 400;
		opacity: 0.9;
	}

	.slide-caption--center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		background: none;
		padding: 2rem;
	}

	.slide-caption--center h3 {
		font-size: clamp(1.5rem, 4vw, 2.25rem);
	}

	.slide-caption--center p {
		max-width: 22rem;
		margin-top: 0.75rem;
		line-height: 1.5;
	}

	.carousel-controls {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		font-size: 80px;
		line-height: 85vh;
		color: #fff;
		pointer-events: none;
	}

	.carousel-controls button {
		display: none;
		position: absolute;
		padding: 0 20px;
		opacity: 0;
		transition: opacity 0.2s;
		cursor: pointer;
		pointer-events: auto;
		background: transparent;
		border: 0;
		color: inherit;
	}

	.slide-image:hover + .carousel-controls button,
	.carousel-controls button:hover {
		opacity: 1;
	}

	.hero-carousel:hover .carousel-controls button {
		opacity: 0.5;
	}

	.hero-carousel:hover .carousel-controls button:hover {
		opacity: 1;
	}

	.carousel-controls .prev-slide {
		width: 49%;
		text-align: left;
		left: 0;
	}

	.carousel-controls .next-slide {
		width: 49%;
		text-align: right;
		right: 0;
	}

	.carousel-dots {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 24px;
		z-index: 3;
		text-align: center;
	}

	.carousel-dots .carousel-dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background-color: #fff;
		opacity: 0.5;
		margin: 0 6px;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.slide-container .carousel-controls button {
		display: block;
	}

	.carousel-dots .carousel-dot.is-active {
		opacity: 1;
	}

	/* Hero text overlay */
	.hero-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.4) 100%);
	}

	.hero-title {
		margin: 0;
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		font-weight: 700;
		color: #fff;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
		letter-spacing: 0.02em;
	}

	.hero-tagline {
		margin: 0.5rem 0 0;
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		font-weight: 400;
		color: #fff;
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
		letter-spacing: 0.05em;
	}

	/* ===== Packages carousels wrapper (Star Packages + Featured Travel Experiences) ===== */
	.packages-carousels-wrapper {
		width: 100%;
		background: #fff;
		padding: 3rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3.5rem;
	}

	.marquee-carousel-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.marquee-section-title {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #111;
		text-align: center;
	}

	.marquee-carousel-section .marquee-carousel {
		--items: 6;
		--carousel-duration: 40s;
		--carousel-width: min(80vw, 800px);
		--carousel-item-width: 280px;
		--carousel-item-height: 420px;
		--carousel-item-gap: 2rem;
		--clr-cta: rgb(0, 132, 209);

		position: relative;
		width: var(--carousel-width);
		height: var(--carousel-item-height);
		overflow: clip;
	}

	@media (width > 600px) {
		.marquee-carousel-section .marquee-carousel {
			--carousel-duration: 30s;
		}
	}

	.marquee-carousel-section .marquee-carousel[data-mask] {
		mask-image: linear-gradient(
			to right,
			transparent,
			black 2% 90%,
			transparent
		);
	}

	.marquee-carousel-section .marquee-carousel:hover > article {
		animation-play-state: paused;
	}

	.marquee-carousel-section .marquee-carousel > article {
		position: absolute;
		top: 0;
		left: calc(100% + var(--carousel-item-gap));
		width: var(--carousel-item-width);
		height: var(--carousel-item-height);
		display: grid;
		grid-template-rows: auto 200px 1fr auto;
		gap: 0;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		background: #fff;
		color: #111;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		overflow: hidden;
		will-change: transform;
		animation-name: marquee;
		animation-duration: var(--carousel-duration);
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		animation-delay: calc(var(--carousel-duration) / var(--items) * 1 * var(--i) * -1);
	}

	.marquee-carousel-section .marquee-carousel .marquee-card-image-placeholder {
		width: 100%;
		height: 200px;
		min-height: 200px;
		background: linear-gradient(145deg, #e8e8e8 0%, #d0d0d0 100%);
	}

	.marquee-carousel-section .marquee-carousel .card-label {
		display: block;
		padding: 0.75rem 1rem 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #111;
	}

	.marquee-carousel-section .marquee-carousel img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.marquee-carousel-section .marquee-carousel .card-text-block {
		display: grid;
		grid-template-rows: 1fr auto;
		gap: 0.5rem;
		background: #f0f0f0;
		padding: 1rem;
		min-height: 0;
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.marquee-carousel-section .marquee-carousel .card-text-block p {
		margin: 0;
		color: #111;
		text-align: left;
	}

	.marquee-carousel-section .marquee-carousel .card-text-block a {
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--clr-cta);
		place-self: start;
		transition: 150ms ease-in-out;
	}

	.marquee-carousel-section .marquee-carousel .card-text-block a:hover,
	.marquee-carousel-section .marquee-carousel .card-text-block a:focus-visible {
		text-decoration: underline;
		outline: none;
	}

	@keyframes marquee {
		100% {
			transform: translateX(
				calc(
					(var(--items) * (var(--carousel-item-width) + var(--carousel-item-gap))) * -1
				)
			);
		}
	}

	/* ===== Services Offered ===== */
	.services-offered-section {
		width: 100%;
		padding: 3rem 1rem 4rem;
		display: flex;
		justify-content: center;
		background: #fff;
	}

	.services-offered-container {
		width: 100%;
		max-width: 900px;
		background: #c41e3a;
		border-radius: 12px;
		padding: 2rem 2.5rem 2.5rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
	}

	.services-offered-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 0 0 1.75rem;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.75rem;
		font-weight: 600;
		color: #fff;
		text-align: center;
	}

	.services-offered-icon {
		width: 1.75rem;
		height: 1.75rem;
		color: #fff;
		flex-shrink: 0;
	}

	.services-offered-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem 3rem;
	}

	.services-column {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.services-column a {
		color: #fff;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		transition: opacity 0.2s;
	}

	.services-column a:hover {
		opacity: 0.9;
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.services-offered-grid {
			grid-template-columns: 1fr;
		}
	}

	/* ===== Our Partners ===== */
	.partners-section {
		width: 100%;
		padding: 3rem 1rem 4rem;
		margin-bottom: 10%;
		background: #e8e8e8;
	}

	.partners-title {
		margin: 0 0 2rem;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 2rem;
		font-weight: 700;
		color: #111;
		text-align: center;
	}

	.partners-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 1.5rem 2rem;
		max-width: 1100px;
		margin: 0 auto;
		align-items: center;
		justify-items: center;
	}

	.partners-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
	}

	.partners-logo img {
		max-width: 100%;
		max-height: 80px;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	@media (max-width: 900px) {
		.partners-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 600px) {
		.partners-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.25rem;
		}

		.partners-logo img {
			max-height: 60px;
		}
	}
</style>
