<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	type Dest = (typeof data.destinations)[number];

	let query = $state("");
	let selectedId = $state<number | "new">("new");

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return data.destinations;
		return data.destinations.filter((d) => {
			const hay = `${d.country_name ?? ""} ${d.city_name ?? ""}`.toLowerCase();
			return hay.includes(q);
		});
	});

	const selected = $derived.by(() => {
		if (selectedId === "new") return null;
		return data.destinations.find((d) => d.destination_id === selectedId) ?? null;
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
			<p class="ap-sub">Manage countries and cities, with cover images stored on Cloudinary. Select an item on the left to edit it in the tablet.</p>
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
				<button type="button" class="dest-pill dest-pill--primary" onclick={() => (selectedId = "new")}>
					+ New
				</button>
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
								<div class="dest-item-sub">{d.city_name ?? "—"}</div>
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
					{#if selectedId === "new"}
						<div class="dest-tablet-head">
							<h2 class="dest-tablet-title">Add destination</h2>
							<p class="dest-tablet-sub">Create a new country/city entry.</p>
						</div>
						<form method="post" action="?/createDestination" class="ap-form-grid" enctype="multipart/form-data">
							<div class="ap-field">
								<label class="ap-label" for="d-country">Country</label>
								<input id="d-country" name="country_name" class="ap-input" placeholder="Country name" required />
							</div>
							<div class="ap-field">
								<label class="ap-label" for="d-city">City</label>
								<input id="d-city" name="city_name" class="ap-input" placeholder="Optional" />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-cover">Cover image (upload)</label>
								<input id="d-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="d-desc">Description</label>
								<textarea id="d-desc" name="description" class="ap-textarea" placeholder="Optional"></textarea>
							</div>
							<div class="dest-actions">
								<button type="submit" class="dest-pill dest-pill--primary">Create</button>
							</div>
						</form>
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
								<label class="ap-label" for="ed-cover">Cover image (upload)</label>
								<input id="ed-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for="ed-desc">Description</label>
								<textarea id="ed-desc" name="description" class="ap-textarea">{selected.description ?? ""}</textarea>
							</div>
							<div class="dest-actions">
								<button type="submit" class="dest-pill dest-pill--primary">Save changes</button>
							</div>
						</form>
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
		align-items: center;
		padding: 1rem 1rem 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		background: linear-gradient(180deg, rgba(196, 30, 58, 0.06), transparent);
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
