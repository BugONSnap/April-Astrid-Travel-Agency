<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	function imagesText(packageId: number) {
		return data.packageImages
			.filter((pi) => pi.package_id === packageId)
			.map((pi) => pi.image_url)
			.join("\n");
	}
</script>

<svelte:head>
	<title>Admin · Packages</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Catalog</p>
			<h1 class="ap-title">Packages</h1>
			<p class="ap-sub">Tie each package to a destination, set category and pricing, and maintain gallery URLs (one per line or comma-separated).</p>
		</div>
		<div class="ap-page-actions">
			<a href="/admin" class="ap-back">← Dashboard</a>
			<a href="#pkg-create-heading" class="ap-btn ap-btn--primary ap-btn--sm">Create package</a>
		</div>
	</header>

	<section class="ap-card" aria-labelledby="pkg-create-heading">
		<h2 id="pkg-create-heading" class="ap-card-title">New package</h2>
		{#if data.destinations.length === 0}
			<p class="ap-empty">Add at least one destination before creating a package.</p>
		{:else}
			<form method="post" action="?/createPackage" class="ap-form-grid">
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-name">Package name</label>
					<input id="pk-name" name="package_name" class="ap-input" required />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pk-dest">Destination</label>
					<select id="pk-dest" name="destination_id" class="ap-select" required>
						{#each data.destinations as d}
							<option value={d.destination_id}>
								{d.country_name}{d.city_name ? ` — ${d.city_name}` : ""}
							</option>
						{/each}
					</select>
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pk-cat">Category</label>
					<select id="pk-cat" name="category" class="ap-select" required>
						{#each data.categories as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pk-price">Price</label>
					<input id="pk-price" name="price" type="number" class="ap-input" required />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pk-days">Duration (days)</label>
					<input id="pk-days" name="duration_days" type="number" class="ap-input" placeholder="Optional" />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pk-max">Max people</label>
					<input id="pk-max" name="max_people" type="number" class="ap-input" placeholder="Optional" />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-status">Status</label>
					<input id="pk-status" name="status" class="ap-input" placeholder="e.g. active" />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-desc">Description</label>
					<textarea id="pk-desc" name="description" class="ap-textarea" placeholder="Optional"></textarea>
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-inc">Inclusions</label>
					<textarea id="pk-inc" name="inclusions" class="ap-textarea" placeholder="Optional"></textarea>
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-exc">Exclusions</label>
					<textarea id="pk-exc" name="exclusions" class="ap-textarea" placeholder="Optional"></textarea>
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pk-imgs">Image URLs</label>
					<textarea
						id="pk-imgs"
						name="image_urls"
						class="ap-textarea"
						placeholder={"One URL per line or comma-separated"}
					></textarea>
				</div>
				<div class="ap-form-actions ap-span-2">
					<button type="submit" class="ap-btn ap-btn--primary">Create package</button>
				</div>
			</form>
		{/if}
	</section>

	<section class="ap-card" aria-labelledby="pkg-list-heading">
		<h2 id="pkg-list-heading" class="ap-card-title">Existing packages</h2>
		{#if data.packages.length === 0}
			<p class="ap-empty">No packages yet.</p>
		{:else}
			<div class="ap-stack">
				{#each data.packages as p}
					<article class="ap-package-item">
						<div class="ap-package-head">
							<div>
								<h3 class="ap-pkg-name">{p.package_name}</h3>
								<p class="ap-muted">
									{p.destination_country}{p.destination_city ? ` — ${p.destination_city}` : ""}
									· <span class="ap-badge">{p.category}</span>
									· Status {p.status ?? "—"}
									· Price {p.price?.toLocaleString?.() ?? p.price}
								</p>
							</div>
							<span class="ap-muted">ID #{p.package_id}</span>
						</div>

						<form method="post" action="?/updatePackage" class="ap-form-grid">
							<input type="hidden" name="package_id" value={p.package_id} />
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pn-${p.package_id}`}>Name</label>
								<input id={`pn-${p.package_id}`} name="package_name" class="ap-input" value={p.package_name} required />
							</div>
							<div class="ap-field">
								<label class="ap-label" for={`pd-${p.package_id}`}>Destination</label>
								<select id={`pd-${p.package_id}`} name="destination_id" class="ap-select" required>
									{#each data.destinations as d}
										<option value={d.destination_id} selected={p.destination_id === d.destination_id}>
											{d.country_name}{d.city_name ? ` — ${d.city_name}` : ""}
										</option>
									{/each}
								</select>
							</div>
							<div class="ap-field">
								<label class="ap-label" for={`pc-${p.package_id}`}>Category</label>
								<select id={`pc-${p.package_id}`} name="category" class="ap-select" required>
									{#each data.categories as c}
										<option value={c} selected={p.category === c}>{c}</option>
									{/each}
								</select>
							</div>
							<div class="ap-field">
								<label class="ap-label" for={`pp-${p.package_id}`}>Price</label>
								<input id={`pp-${p.package_id}`} name="price" type="number" class="ap-input" value={p.price} required />
							</div>
							<div class="ap-field">
								<label class="ap-label" for={`pdd-${p.package_id}`}>Duration</label>
								<input
									id={`pdd-${p.package_id}`}
									name="duration_days"
									type="number"
									class="ap-input"
									value={p.duration_days ?? ""}
									placeholder="Days"
								/>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pm-${p.package_id}`}>Max people</label>
								<input
									id={`pm-${p.package_id}`}
									name="max_people"
									type="number"
									class="ap-input"
									value={p.max_people ?? ""}
								/>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pst-${p.package_id}`}>Status</label>
								<input id={`pst-${p.package_id}`} name="status" class="ap-input" value={p.status ?? "active"} />
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pde-${p.package_id}`}>Description</label>
								<textarea id={`pde-${p.package_id}`} name="description" class="ap-textarea">{p.description ?? ""}</textarea>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pi-${p.package_id}`}>Inclusions</label>
								<textarea id={`pi-${p.package_id}`} name="inclusions" class="ap-textarea">{p.inclusions ?? ""}</textarea>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`px-${p.package_id}`}>Exclusions</label>
								<textarea id={`px-${p.package_id}`} name="exclusions" class="ap-textarea">{p.exclusions ?? ""}</textarea>
							</div>
							<div class="ap-field ap-span-2">
								<label class="ap-label" for={`pg-${p.package_id}`}>Image URLs</label>
								<textarea id={`pg-${p.package_id}`} name="image_urls" class="ap-textarea">{imagesText(p.package_id)}</textarea>
							</div>
							<div class="ap-form-actions ap-span-2">
								<button type="submit" class="ap-btn ap-btn--secondary">Update package</button>
							</div>
						</form>

						<form method="post" action="?/deletePackage" class="ap-form-actions ap-delete-form">
							<input type="hidden" name="package_id" value={p.package_id} />
							<button
								type="submit"
								class="ap-btn ap-btn--danger"
								onclick={(e) => {
									if (!confirm("Delete this package and its gallery images?")) {
										e.preventDefault();
									}
								}}
							>
								Delete package
							</button>
						</form>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.ap-page-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start;
	}

	@media (min-width: 640px) {
		.ap-page-actions {
			flex-direction: row;
			align-items: center;
		}
	}

	.ap-pkg-name {
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0 0 0.35rem;
		color: #0a0a0a;
	}
</style>
