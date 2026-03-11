<script>
	let showContact = false;
</script>

<footer class="border-t border-red-900 bg-[#c41e3a] text-gray-100 font-serif">
	<p class="text-center text-lg sm:text-xl py-8 px-4">
		Your next adventure starts here. Contact us!
	</p>

	<!-- Collapsible contact info for mobile -->
	<div class="sm:hidden grid grid-cols-1 items-center">
		<button class="bg-red-800 text-white px-4 py-2 rounded mb-2 font-semibold" on:click={() => showContact = !showContact}>
			{showContact ? 'Hide Contact Info' : 'Show Contact Info'}
		</button>
		{#if showContact}
			<div class="grid grid-cols-1 gap-y-3 py-2 px-4">
				<div class="text-left min-w-[200px]">
					<p class="font-semibold text-base">April-Astrid Travel Agency</p>
					<a href="mailto:aprilastrid1987@gmail.com" class="text-gray-100 underline hover:opacity-90 block mt-1">
						aprilastrid1987@gmail.com
					</a>
					<p class="mt-2 text-sm">Block 2, Lot 11-13, Phase 4 Lincoln Heights</p>
					<p class="text-sm">San Pablo Dinalupihan Bataan 2100</p>
				</div>
				<div class="text-left min-w-[200px]">
					<a href="tel:+63472750194" class="block text-sm hover:opacity-90">(047)-275-0194</a>
					<a href="tel:+639466461488" class="block text-sm hover:opacity-90 mt-1">0946-646-1488</a>
					<a href="tel:+639159287683" class="block text-sm hover:opacity-90 mt-1">0915-928-7683</a>
					<a href="tel:+639055308865" class="block text-sm hover:opacity-90 mt-1">0905-530-8865</a>
				</div>
			</div>
		{/if}
	</div>

	<!-- Normal contact info for tablet/desktop -->
	<div class="hidden sm:grid sm:grid-cols-2 sm:gap-x-16 sm:gap-y-6 py-6 px-6 sm:px-8 max-w-5xl mx-auto">
		<div class="text-left min-w-[200px]">
			<p class="font-semibold text-base sm:text-lg">April-Astrid Travel Agency</p>
			<a href="mailto:aprilastrid1987@gmail.com" class="text-gray-100 underline hover:opacity-90 block mt-1">
				aprilastrid1987@gmail.com
			</a>
			<p class="mt-2 text-sm sm:text-base">Block 2, Lot 11-13, Phase 4 Lincoln Heights</p>
			<p class="text-sm sm:text-base">San Pablo Dinalupihan Bataan 2100</p>
		</div>
		<div class="text-left sm:text-right min-w-[200px]">
			<a href="tel:+63472750194" class="block text-sm sm:text-base hover:opacity-90">(047)-275-0194</a>
			<a href="tel:+639466461488" class="block text-sm sm:text-base hover:opacity-90 mt-1">0946-646-1488</a>
			<a href="tel:+639159287683" class="block text-sm sm:text-base hover:opacity-90 mt-1">0915-928-7683</a>
			<a href="tel:+639055308865" class="block text-sm sm:text-base hover:opacity-90 mt-1">0905-530-8865</a>
		</div>
	</div>
</footer>
