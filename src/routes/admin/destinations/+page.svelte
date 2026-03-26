<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin · Destinations</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Catalog</p>
			<h1 class="ap-title">Destinations</h1>
			<p class="ap-sub">Countries and cities that packages link to. Cover images use a public URL.</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	<section class="ap-card" aria-labelledby="dest-create-heading">
		<h2 id="dest-create-heading" class="ap-card-title">Add destination</h2>
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
				<label class="ap-label" for="d-desc">Description</label>
				<textarea id="d-desc" name="description" class="ap-textarea" placeholder="Optional"></textarea>
			</div>
			<div class="ap-field ap-span-2">
				<label class="ap-label" for="d-cover">Cover image (upload)</label>
				<input id="d-cover" type="file" name="image_cover_file" class="ap-input" accept="image/*" />
			</div>
			<div class="ap-form-actions ap-span-2">
				<button type="submit" class="ap-btn ap-btn--primary">Create</button>
			</div>
		</form>
	</section>

	<section class="ap-card" aria-labelledby="dest-list-heading">
		<h2 id="dest-list-heading" class="ap-card-title">All destinations</h2>
		{#if data.destinations.length === 0}
			<p class="ap-empty">No destinations yet. Add one above.</p>
		{:else}
			<div class="ap-table-wrap">
				<table class="ap-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Country</th>
							<th>City</th>
							<th>Preview</th>
							<th>Edit</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.destinations as d}
							<tr>
								<td><span class="ap-muted">#{d.destination_id}</span></td>
								<td><strong>{d.country_name}</strong></td>
								<td>{d.city_name ?? "—"}</td>
								<td>
									{#if d.image_cover}
										<img src={d.image_cover} alt="" class="ap-thumb" loading="lazy" />
									{:else}
										<span class="ap-muted">—</span>
									{/if}
								</td>
								<td>
									<form
										method="post"
										action="?/updateDestination"
										class="ap-form-grid ap-nested-form"
										enctype="multipart/form-data"
									>
										<input type="hidden" name="destination_id" value={d.destination_id} />
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`dc-${d.destination_id}`}>Country</label>
											<input
												id={`dc-${d.destination_id}`}
												name="country_name"
												class="ap-input"
												value={d.country_name}
												required
											/>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`dci-${d.destination_id}`}>City</label>
											<input
												id={`dci-${d.destination_id}`}
												name="city_name"
												class="ap-input"
												value={d.city_name ?? ""}
											/>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`di-${d.destination_id}`}>Cover image (upload)</label>
											{#if d.image_cover}
												<img src={d.image_cover} alt="" class="ap-thumb" loading="lazy" />
											{:else}
												<span class="ap-muted">—</span>
											{/if}
											<input
												id={`di-${d.destination_id}`}
												type="file"
												name="image_cover_file"
												class="ap-input"
												accept="image/*"
											/>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`dd-${d.destination_id}`}>Description</label>
											<textarea id={`dd-${d.destination_id}`} name="description" class="ap-textarea">{d.description ?? ""}</textarea>
										</div>
										<div class="ap-form-actions ap-span-2">
											<button type="submit" class="ap-btn ap-btn--secondary ap-btn--block">Save</button>
										</div>
									</form>
								</td>
								<td>
									<form method="post" action="?/deleteDestination">
										<input type="hidden" name="destination_id" value={d.destination_id} />
										<button
											type="submit"
											class="ap-btn ap-btn--danger ap-btn--block"
											onclick={(e) => {
												if (!confirm("Delete this destination? Linked packages may block this.")) {
													e.preventDefault();
												}
											}}
										>
											Delete
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
