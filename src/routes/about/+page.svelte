<script lang="ts">
	import Header from '$lib/assets/header.svelte';
	import Footer from '$lib/assets/footer.svelte';
</script>

<Header />

<main class="min-h-screen bg-white font-serif">
	<section class="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-16">
		<h1 class="text-2xl sm:text-3xl font-semibold text-center tracking-wide mb-6">
			ABOUT US
		</h1>

		<p class="text-sm sm:text-base leading-relaxed text-center max-w-3xl mx-auto">
			We are a dedicated international travel and tour booking platform committed to making
			your dream destinations accessible and hassle-free. From breathtaking island getaways
			to cultural city tours across the globe, we connect travelers with trusted partners
			and curated experiences. Our goal is to provide seamless booking, competitive pricing,
			and unforgettable journeys for every type of traveler.
		</p>

		<div
			class="mt-10 bg-[#c41e3a] text-white rounded-xl shadow-lg px-5 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center gap-6"
		>
			<!-- Owner Image -->
			<img
				src="/Owner.jpg"
				alt="Owner"
				class="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border border-gray-300 shrink-0"
			/>

			<div class="flex-1">
				<p class="text-sm sm:text-base leading-relaxed">
					Driven by passion for travel and customer satisfaction, our team ensures that every
					booking is smooth, reliable, and tailored to your needs. We believe that travel is
					more than just visiting places — it’s about creating lasting memories and meaningful
					experiences.
				</p>

				<div class="mt-4">
					<p class="text-sm sm:text-base font-semibold">April Rose Quidet</p>
					<p class="text-xs sm:text-sm">Founder & Owner</p>
				</div>
			</div>
		</div>
	</section>
</main>

<!-- Partners section reused from home page -->
<section class="partners-section" aria-label="Our partners on about page">
	<h2 class="partners-title">Partners</h2>
	<div class="partners-grid self-center">
		<div class="partners-logo"><img src="/partner1.png" alt="BOSZTAA" /></div>
		<div class="partners-logo"><img src="/partner3.png" alt="Department of Tourism Philippines" /></div>
		<div class="partners-logo"><img src="/partner10.png" alt="DTI Philippines" /></div>
		<div class="partners-logo"><img src="/partner15.png" alt="Bataan Sangguniang Panlalawigan" /></div>
	</div>
</section>

<Footer />

<style>
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
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 1.5rem 2rem;
	max-width: 900px;
	margin: 0 auto;
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