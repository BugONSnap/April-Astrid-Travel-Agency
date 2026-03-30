<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	type Dest = (typeof data.destinations)[number];

	let query = $state("");
	let selectedId = $state<number | "new-country" | "new-city">("new-country");

	$effect(() => {
		if (data.initialCreate === "city") selectedId = "new-city";
		else if (data.initialCreate === "country") selectedId = "new-country";
	});

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return data.destinations;
		return data.destinations.filter((d) => {
			const hay = `${d.country_name ?? ""} ${d.city_name ?? ""}`.toLowerCase();
			return hay.includes(q);
		});
	});

	const selected = $derived.by(() => {
		if (selectedId === "new-country" || selectedId === "new-city") return null;
		return data.destinations.find((d) => d.destination_id === selectedId) ?? null;
	});

	const citiesInSelectedCountry = $derived.by(() => {
		const s = selected;
		if (!s || (s.city_name != null && String(s.city_name).trim() !== "")) return [];
		return data.destinations.filter(
			(d) =>
				d.country_name === s.country_name &&
				d.continent === s.continent &&
				d.city_name != null &&
				String(d.city_name).trim() !== "",
		);
	});

	const covers = $derived(data.staticDestinationCovers);
	let useStaticNewCountry = $state(false);
	let useStaticNewCity = $state(false);
	let useStaticEdit = $state(false);
	let useStaticNested = $state(false);
	let staticIdxNewCountry = $state(0);
	let staticIdxNewCity = $state(0);
	let staticIdxEdit = $state(0);
	let staticIdxNested = $state(0);

	function wrapIdx(i: number, len: number) {
		if (len <= 0) return 0;
		return ((i % len) + len) % len;
	}

	$effect(() => {
		selected?.destination_id;
		useStaticEdit = false;
		staticIdxEdit = 0;
	});
</script>

<svelte:head>
	<title>Admin · Destinations</title>
</svelte:head>

<div class="ap-page admin-red admin-split">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Catalog</p>
			<h1 class="ap-title">Destinations</h1>
			<p class="ap-sub">
				Create a <strong>country</strong> first (city optional empty), then add <strong>cities</strong> under that country. Covers: upload a file, or cycle through images in
				<code class="dest-code">static/uploads/destinations</code> (served as <code class="dest-code">/uploads/destinations/…</code>).
			</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	<div class="dest-grid">
		<aside class="dest-rail">
			<div class="dest-rail-head">
				<div>
					<h2 class="dest-rail-title">All destinations</h2>
					<p class="dest-rail-sub">{data.destinations.length} total</p>
				</div>
				<div class="dest-rail-actions">
					<button type="button" class="dest-pill dest-pill--primary" onclick={() => (selectedId = "new-country")}>
						+ Country
					</button>
					<button type="button" class="dest-pill" onclick={() => (selectedId = "new-city")} title="Add a city under a country you created">
						+ City
					</button>
				</div>
			</div>

			<div class="dest-search">
				<input class="dest-search-input" placeholder="Search country / city…" bind:value={query} />
			</div>

			{#if filtered.length === 0}
				<p class="ap-empty">No matches.</p>
			{:else}
				<div class="dest-list">
					{#each filtered as d (d.destination_id)}
						<button
							type="button"
							class="dest-item"
							class:active={selectedId === d.destination_id}
							onclick={() => (selectedId = d.destination_id)}
						>
							<div class="dest-item-media">
								{#if d.image_cover}
									<img src={d.image_cover} alt="" loading="lazy" />
								{:else}
									<div class="dest-item-fallback" aria-hidden="true"></div>
								{/if}
							</div>
							<div class="dest-item-body">
								<div class="dest-item-title">
									<span class="dest-item-country">{d.country_name}</span>
									<span class="dest-item-id">#{d.destination_id}</span>
								</div>
								<div class="dest-item-sub">
									{#if d.city_name == null || String(d.city_name).trim() === ""}
										<span class="dest-item-tag">Country</span>
									{:else}
										{d.city_name}
									{/if}
									{#if d.continent} · {d.continent}{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</aside>

		<section class="dest-tablet" aria-label="Destination editor">
			<div class="dest-tablet-frame">
				<div class="dest-tablet-bar" aria-hidden="true">
					<span class="dot dot--r"></span>
					<span class="dot dot--y"></span>
					<span class="dot dot--g"></span>
				</div>

				<div class="dest-tablet-content">
					{#if selectedId === "new-country"}
						<div class="dest-tablet-head">
							<h2 class="dest-tablet-title">Create country</h2>
							<p class="dest-tablet-sub">Saves as a country tile (no city yet). Use <strong>+ City</strong> next to add places like Siargao under it.</p>
						</div>
						<form method="post" action="?/createCountry" class="ap-form-grid" enctype="multipart/form-data">
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-country">Country name</label>
								<input id="d-country" name="country_name" class="ap-input" placeholder="e.g. Philippines" required />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-continent">Continent</label>
								<select id="d-continent" name="continent" class="ap-select" required>
									<option value="" disabled selected>Select continent…</option>
									{#each data.continentOptions as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-cover">Cover image (upload)</label>
								<input id="d-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
							</div>
							{#if covers.length > 0}
								<div class="ap-field ap-span-2 dest-static-block">
									<label class="dest-static-toggle">
										<input type="checkbox" bind:checked={useStaticNewCountry} />
										<span>Use image from <code>static/uploads/destinations</code> (ignored if you also upload a file)</span>
									</label>
									{#if useStaticNewCountry}
										<div class="dest-static-cycle" role="group" aria-label="Cycle static cover images">
											<button
												type="button"
												class="dest-static-arrow"
												aria-label="Previous image"
												onclick={() => (staticIdxNewCountry = wrapIdx(staticIdxNewCountry - 1, covers.length))}
											>
												‹
											</button>
											<div class="dest-static-preview">
												<img
													src={covers[wrapIdx(staticIdxNewCountry, covers.length)]}
													alt=""
													loading="lazy"
												/>
											</div>
											<button
												type="button"
												class="dest-static-arrow"
												aria-label="Next image"
												onclick={() => (staticIdxNewCountry = wrapIdx(staticIdxNewCountry + 1, covers.length))}
											>
												›
											</button>
										</div>
										<input
											type="hidden"
											name="image_cover_static"
											value={covers[wrapIdx(staticIdxNewCountry, covers.length)]}
										/>
									{/if}
								</div>
							{/if}
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-desc">Description</label>
								<textarea id="d-desc" name="description" class="ap-textarea" placeholder="Optional"></textarea>
							</div>
							<div class="dest-actions">
								<button type="submit" class="dest-pill dest-pill--primary">Create country</button>
							</div>
						</form>
					{:else if selectedId === "new-city"}
						<div class="dest-tablet-head">
							<h2 class="dest-tablet-title">Add city</h2>
							<p class="dest-tablet-sub">
								Choose a country you created first, then name the city. It shares continent and defaults to the country’s cover unless you upload a new one.
							</p>
						</div>
						{#if data.countryHubs.length === 0}
							<p class="ap-empty">Create a country with <strong>+ Country</strong> before adding cities.</p>
						{:else}
							<form method="post" action="?/addCityToCountry" class="ap-form-grid" enctype="multipart/form-data">
								<div class="ap-field ap-span-2">
									<label class="ap-label" for="d-parent">Country</label>
									<select id="d-parent" name="parent_destination_id" class="ap-select" required>
										<option value="" disabled selected>Select country…</option>
										{#each data.countryHubs as h}
											<option value={h.destination_id}>{h.country_name}{#if h.continent} · {h.continent}{/if}</option>
										{/each}
									</select>
								</div>
								<div class="ap-field ap-span-2">
									<label class="ap-label" for="d-city-new">City name</label>
									<input id="d-city-new" name="city_name" class="ap-input" placeholder="e.g. Siargao" required />
								</div>
								<div class="ap-field ap-span-2">
									<label class="ap-label" for="d-cover-city">Cover image (optional)</label>
									<input id="d-cover-city" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
								</div>
								{#if covers.length > 0}
									<div class="ap-field ap-span-2 dest-static-block">
										<label class="dest-static-toggle">
											<input type="checkbox" bind:checked={useStaticNewCity} />
											<span>Use image from <code>static/uploads/destinations</code> (ignored if you also upload a file)</span>
										</label>
										{#if useStaticNewCity}
											<div class="dest-static-cycle" role="group" aria-label="Cycle static cover images">
												<button
													type="button"
													class="dest-static-arrow"
													aria-label="Previous image"
													onclick={() => (staticIdxNewCity = wrapIdx(staticIdxNewCity - 1, covers.length))}
												>
													‹
												</button>
												<div class="dest-static-preview">
													<img
														src={covers[wrapIdx(staticIdxNewCity, covers.length)]}
														alt=""
														loading="lazy"
													/>
												</div>
												<button
													type="button"
													class="dest-static-arrow"
													aria-label="Next image"
													onclick={() => (staticIdxNewCity = wrapIdx(staticIdxNewCity + 1, covers.length))}
												>
													›
												</button>
											</div>
											<input
												type="hidden"
												name="image_cover_static"
												value={covers[wrapIdx(staticIdxNewCity, covers.length)]}
											/>
										{/if}
									</div>
								{/if}
								<div class="ap-field ap-span-2">
									<label class="ap-label" for="d-desc-city">Description</label>
									<textarea id="d-desc-city" name="description" class="ap-textarea" placeholder="Optional; leave empty to reuse country description"></textarea>
								</div>
								<div class="dest-actions">
									<button type="submit" class="dest-pill dest-pill--primary">Add city</button>
								</div>
							</form>
						{/if}
					{:else if selected}
						<div class="dest-tablet-head">
							<div>
								<h2 class="dest-tablet-title">Edit destination</h2>
								<p class="dest-tablet-sub">Update fields and optionally upload a new cover.</p>
							</div>
							<div class="dest-actions-inline">
								<form method="post" action="?/deleteDestination">
									<input type="hidden" name="destination_id" value={selected.destination_id} />
									<button
										type="submit"
										class="dest-pill dest-pill--danger"
										onclick={(e) => {
											if (!confirm("Delete this destination? Linked packages may block this.")) e.preventDefault();
										}}
									>
										Delete
									</button>
								</form>
							</div>
						</div>

						<div class="dest-hero">
							{#if selected.image_cover}
								<img src={selected.image_cover} alt="" loading="lazy" />
							{:else}
								<div class="dest-hero-fallback">No cover image yet</div>
							{/if}
						</div>

						<form method="post" action="?/updateDestination" class="ap-form-grid" enctype="multipart/form-data">
							<input type="hidden" name="destination_id" value={selected.destination_id} />
							<div class="ap-field">
								<label class="ap-label" for="ed-country">Country</label>
								<input id="ed-country" name="country_name" class="ap-input" value={selected.country_name} required />
							</div>
							<div class="ap-field">
								<label class="ap-label" for="ed-city">City</label>
								<input id="ed-city" name="city_name" class="ap-input" value={selected.city_name ?? ""} />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="ed-continent">Continent</label>
								<select
									id="ed-continent"
									name="continent"
									class="ap-select"
									required
									value={selected.continent ?? ""}
								>
									{#if !selected.continent}
										<option value="" disabled>Choose continent…</option>
									{/if}
									{#each data.continentOptions as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="ed-cover">Cover image (upload)</label>
								<input id="ed-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
							</div>
							{#if covers.length > 0}
								<div class="ap-field ap-span-2 dest-static-block">
									<label class="dest-static-toggle">
										<input type="checkbox" bind:checked={useStaticEdit} />
										<span>Use image from <code>static/uploads/destinations</code> (ignored if you also upload a file)</span>
									</label>
									{#if useStaticEdit}
										<div class="dest-static-cycle" role="group" aria-label="Cycle static cover images">
											<button
												type="button"
												class="dest-static-arrow"
												aria-label="Previous image"
												onclick={() => (staticIdxEdit = wrapIdx(staticIdxEdit - 1, covers.length))}
											>
												‹
											</button>
											<div class="dest-static-preview">
												<img
													src={covers[wrapIdx(staticIdxEdit, covers.length)]}
													alt=""
													loading="lazy"
												/>
											</div>
											<button
												type="button"
												class="dest-static-arrow"
												aria-label="Next image"
												onclick={() => (staticIdxEdit = wrapIdx(staticIdxEdit + 1, covers.length))}
											>
												›
											</button>
										</div>
										<input
											type="hidden"
											name="image_cover_static"
											value={covers[wrapIdx(staticIdxEdit, covers.length)]}
										/>
									{/if}
								</div>
							{/if}
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="ed-desc">Description</label>
								<textarea id="ed-desc" name="description" class="ap-textarea">{selected.description ?? ""}</textarea>
							</div>
							<div class="dest-actions">
								<button type="submit" class="dest-pill dest-pill--primary">Save changes</button>
							</div>
						</form>

						{#if selected.city_name == null || String(selected.city_name).trim() === ""}
							<div class="dest-nested">
								<h3 class="dest-nested-title">Cities in this country</h3>
								{#if citiesInSelectedCountry.length === 0}
									<p class="dest-nested-empty">No cities yet — use the form below.</p>
								{:else}
									<ul class="dest-city-list">
										{#each citiesInSelectedCountry as c (c.destination_id)}
											<li>
												<button type="button" class="dest-city-link" onclick={() => (selectedId = c.destination_id)}>
													{c.city_name}
												</button>
											</li>
										{/each}
									</ul>
								{/if}
								<form method="post" action="?/addCityToCountry" class="ap-form-grid" enctype="multipart/form-data">
									<input type="hidden" name="parent_destination_id" value={selected.destination_id} />
									<div class="ap-field ap-span-2">
										<label class="ap-label" for="add-city-name">Add a city</label>
										<input
											id="add-city-name"
											name="city_name"
											class="ap-input"
											placeholder="City name"
											required
										/>
									</div>
									<div class="ap-field ap-span-2">
										<label class="ap-label" for="add-city-cover">Cover (optional)</label>
										<input id="add-city-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
									</div>
									{#if covers.length > 0}
										<div class="ap-field ap-span-2 dest-static-block">
											<label class="dest-static-toggle">
												<input type="checkbox" bind:checked={useStaticNested} />
												<span>Use image from <code>static/uploads/destinations</code> (ignored if you also upload a file)</span>
											</label>
											{#if useStaticNested}
												<div class="dest-static-cycle" role="group" aria-label="Cycle static cover images">
													<button
														type="button"
														class="dest-static-arrow"
														aria-label="Previous image"
														onclick={() => (staticIdxNested = wrapIdx(staticIdxNested - 1, covers.length))}
													>
														‹
													</button>
													<div class="dest-static-preview">
														<img
															src={covers[wrapIdx(staticIdxNested, covers.length)]}
															alt=""
															loading="lazy"
														/>
													</div>
													<button
														type="button"
														class="dest-static-arrow"
														aria-label="Next image"
														onclick={() => (staticIdxNested = wrapIdx(staticIdxNested + 1, covers.length))}
													>
														›
													</button>
												</div>
												<input
													type="hidden"
													name="image_cover_static"
													value={covers[wrapIdx(staticIdxNested, covers.length)]}
												/>
											{/if}
										</div>
									{/if}
									<div class="ap-field ap-span-2">
										<label class="ap-label" for="add-city-desc">Description (optional)</label>
										<textarea id="add-city-desc" name="description" class="ap-textarea" placeholder="Leave empty to reuse country description"></textarea>
									</div>
									<div class="dest-actions">
										<button type="submit" class="dest-pill dest-pill--primary">Add city</button>
									</div>
								</form>
							</div>
						{/if}
					{:else}
						<p class="ap-empty">Pick a destination on the left.</p>
					{/if}
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	/* Page backdrop */
	.admin-red.ap-page {
		background:
			radial-gradient(1200px 500px at 10% -10%, rgba(196, 30, 58, 0.18), transparent 60%),
			radial-gradient(900px 500px at 90% 0%, rgba(196, 30, 58, 0.10), transparent 55%),
			linear-gradient(180deg, #fbfbfd 0%, #f7f4f6 100%);
		min-height: 100vh;
	}

	/* Split layout */
	.dest-grid {
		display: grid;
		grid-template-columns: 360px 1fr;
		gap: 1.25rem;
		align-items: start;
	}

	.dest-rail {
		position: sticky;
		top: 1rem;
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(196, 30, 58, 0.12);
		box-shadow: 0 20px 60px rgba(15, 15, 20, 0.08);
		overflow: hidden;
	}

	.dest-rail-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1rem 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		background: linear-gradient(180deg, rgba(196, 30, 58, 0.06), transparent);
	}

	.dest-rail-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		justify-content: flex-end;
	}

	.dest-rail-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
		color: #161616;
	}
	.dest-rail-sub {
		margin: 0.15rem 0 0;
		font-size: 0.85rem;
		color: rgba(0, 0, 0, 0.6);
	}

	.dest-search {
		padding: 0.75rem 1rem;
	}
	.dest-search-input {
		width: 100%;
		border-radius: 999px;
		border: 1px solid rgba(0, 0, 0, 0.10);
		background: rgba(255, 255, 255, 0.9);
		padding: 0.55rem 0.85rem;
		outline: none;
	}
	.dest-search-input:focus {
		border-color: rgba(196, 30, 58, 0.45);
		box-shadow: 0 0 0 4px rgba(196, 30, 58, 0.12);
	}

	.dest-list {
		display: grid;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem 0.9rem;
		max-height: calc(100vh - 240px);
		overflow: auto;
	}

	.dest-item {
		display: grid;
		grid-template-columns: 52px 1fr;
		gap: 0.75rem;
		padding: 0.6rem 0.6rem;
		border-radius: 14px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		background: rgba(255, 255, 255, 0.85);
		text-align: left;
		cursor: pointer;
		transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
	}
	.dest-item:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
		border-color: rgba(196, 30, 58, 0.22);
	}
	.dest-item.active {
		border-color: rgba(196, 30, 58, 0.55);
		box-shadow: 0 14px 26px rgba(196, 30, 58, 0.16);
	}

	.dest-item-media {
		width: 52px;
		height: 52px;
		border-radius: 14px;
		overflow: hidden;
		background: #f1f1f5;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}
	.dest-item-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.dest-item-fallback {
		width: 100%;
		height: 100%;
		background:
			linear-gradient(135deg, rgba(196, 30, 58, 0.25), rgba(0, 0, 0, 0.05)),
			radial-gradient(60px 60px at 70% 20%, rgba(255, 255, 255, 0.7), transparent 60%);
	}

	.dest-item-title {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
	}
	.dest-item-country {
		font-weight: 800;
		color: #141414;
	}
	.dest-item-id {
		font-size: 0.8rem;
		color: rgba(0, 0, 0, 0.55);
	}
	.dest-item-sub {
		margin-top: 0.2rem;
		font-size: 0.9rem;
		color: rgba(0, 0, 0, 0.62);
	}

	.dest-item-tag {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.12rem 0.4rem;
		border-radius: 6px;
		background: rgba(196, 30, 58, 0.12);
		color: #8f0e24;
		margin-right: 0.25rem;
		vertical-align: middle;
	}

	.dest-nested {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}
	.dest-nested-title {
		margin: 0 0 0.65rem;
		font-size: 0.95rem;
		font-weight: 900;
		color: #151515;
	}
	.dest-nested-empty {
		margin: 0 0 0.85rem;
		font-size: 0.85rem;
		color: rgba(0, 0, 0, 0.55);
	}
	.dest-city-list {
		margin: 0 0 0.85rem;
		padding-left: 1.1rem;
		font-size: 0.9rem;
		color: rgba(0, 0, 0, 0.75);
	}
	.dest-city-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: #8f0e24;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.dest-city-link:hover {
		color: #c41e3a;
	}

	.dest-code {
		font-size: 0.8em;
		padding: 0.1em 0.35em;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.06);
		color: #1a1a1a;
	}

	.dest-static-block {
		padding: 0.75rem 0.85rem;
		border-radius: 14px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(255, 255, 255, 0.65);
	}
	.dest-static-toggle {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: rgba(0, 0, 0, 0.72);
		cursor: pointer;
	}
	.dest-static-toggle input {
		margin-top: 0.2rem;
		accent-color: #c41e3a;
	}
	.dest-static-cycle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.65rem;
	}
	.dest-static-arrow {
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: rgba(255, 255, 255, 0.95);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: #8f0e24;
		font-weight: 700;
	}
	.dest-static-arrow:hover {
		border-color: rgba(196, 30, 58, 0.35);
		background: rgba(196, 30, 58, 0.08);
	}
	.dest-static-preview {
		flex: 1;
		min-width: 0;
		height: 120px;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #eee;
	}
	.dest-static-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Tablet editor */
	.dest-tablet-frame {
		border-radius: 26px;
		background: rgba(255, 255, 255, 0.75);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(196, 30, 58, 0.14);
		box-shadow: 0 26px 80px rgba(15, 15, 20, 0.12);
		overflow: hidden;
	}
	.dest-tablet-bar {
		display: flex;
		gap: 0.45rem;
		padding: 0.9rem 1rem;
		background: linear-gradient(180deg, rgba(196, 30, 58, 0.10), rgba(255, 255, 255, 0.0));
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		display: inline-block;
	}
	.dot--r {
		background: #ff5b57;
	}
	.dot--y {
		background: #febc2e;
	}
	.dot--g {
		background: #28c840;
	}
	.dest-tablet-content {
		padding: 1.15rem 1.25rem 1.35rem;
	}
	.dest-tablet-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.dest-tablet-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 900;
		color: #151515;
		letter-spacing: -0.01em;
	}
	.dest-tablet-sub {
		margin: 0.25rem 0 0;
		color: rgba(0, 0, 0, 0.62);
	}

	.dest-hero {
		width: 100%;
		height: 160px;
		border-radius: 18px;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #f3f3f7;
		margin: 0.25rem 0 1rem;
	}
	.dest-hero img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.dest-hero-fallback {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		color: rgba(0, 0, 0, 0.55);
		font-weight: 700;
		background:
			radial-gradient(220px 120px at 20% 0%, rgba(196, 30, 58, 0.20), transparent 55%),
			linear-gradient(135deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.0));
	}

	/* Pills / actions */
	.dest-pill {
		border-radius: 999px;
		padding: 0.55rem 0.85rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: rgba(255, 255, 255, 0.95);
		font-weight: 800;
		cursor: pointer;
	}
	.dest-pill--primary {
		border-color: rgba(196, 30, 58, 0.35);
		background: rgba(196, 30, 58, 0.10);
		color: #8f0e24;
	}
	.dest-pill--primary:hover {
		background: rgba(196, 30, 58, 0.14);
	}
	.dest-pill--danger {
		border-color: rgba(185, 28, 28, 0.35);
		background: rgba(185, 28, 28, 0.10);
		color: #7f1010;
	}
	.dest-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}
	.dest-actions-inline {
		display: flex;
		gap: 0.5rem;
	}

	/* Responsive */
	@media (max-width: 960px) {
		.dest-grid {
			grid-template-columns: 1fr;
		}
		.dest-rail {
			position: relative;
			top: auto;
		}
	}
</style>
