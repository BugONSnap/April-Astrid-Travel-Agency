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

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Manage Packages</h1>
		<a href="/admin" class="text-sm text-gray-600 hover:underline">Back to dashboard</a>
	</div>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Create package</h2>
		<form method="post" action="?/createPackage" class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<input name="package_name" placeholder="Package name" class="input" required />

			<select name="destination_id" class="input" required>
				{#each data.destinations as d}
					<option value={d.destination_id}>
						{d.country_name}{d.city_name ? ` - ${d.city_name}` : ""}
					</option>
				{/each}
			</select>

			<select name="category" class="input" required>
				{#each data.categories as c}
					<option value={c}>{c}</option>
				{/each}
			</select>

			<input name="price" placeholder="Price" type="number" class="input" required />
			<input name="duration_days" placeholder="Duration (days, optional)" type="number" class="input" />
			<input name="max_people" placeholder="Max people (optional)" type="number" class="input" />

			<input name="status" placeholder="Status (active/inactive)" class="input md:col-span-2" />

			<textarea name="description" placeholder="Description (optional)" class="input md:col-span-2"></textarea>
			<textarea name="inclusions" placeholder="Inclusions (optional)" class="input md:col-span-2"></textarea>
			<textarea name="exclusions" placeholder="Exclusions (optional)" class="input md:col-span-2"></textarea>

			<textarea
				name="image_urls"
				placeholder={"Image URLs (comma or newline separated)\nhttps://... \nhttps://..."}
				class="input md:col-span-2"
			></textarea>

			<div class="md:col-span-2 flex justify-end">
				<button type="submit" class="btn-primary">Create</button>
			</div>
		</form>
	</section>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Existing packages</h2>
		<div class="space-y-6">
			{#each data.packages as p}
				<div class="border rounded-lg p-4">
					<div class="flex items-start justify-between gap-4">
						<div>
							<div class="font-semibold text-lg">{p.package_name}</div>
							<div class="text-sm text-gray-600">
								{p.destination_country}{p.destination_city ? ` - ${p.destination_city}` : ""} • {p.category}
							</div>
							<div class="text-sm text-gray-600">Status: {p.status} • Price: {p.price}</div>
						</div>
						<div class="text-right text-sm text-gray-600">ID: {p.package_id}</div>
					</div>

					<form method="post" action="?/updatePackage" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
						<input type="hidden" name="package_id" value={p.package_id} />

						<input name="package_name" class="input" value={p.package_name} required />

						<select name="destination_id" class="input" required>
							{#each data.destinations as d}
								<option value={d.destination_id} selected={p.destination_id === d.destination_id}>
									{d.country_name}{d.city_name ? ` - ${d.city_name}` : ""}
								</option>
							{/each}
						</select>

						<select name="category" class="input" required>
							{#each data.categories as c}
								<option value={c} selected={p.category === c}>{c}</option>
							{/each}
						</select>

						<input name="price" type="number" class="input" value={p.price} required />
						<input name="duration_days" type="number" class="input" value={p.duration_days ?? ""} placeholder="Duration" />
						<input name="max_people" type="number" class="input" value={p.max_people ?? ""} placeholder="Max people" />

						<input name="status" class="input md:col-span-2" value={p.status ?? "active"} />

						<textarea name="description" class="input md:col-span-2" placeholder="Description">{p.description ?? ""}</textarea>
						<textarea name="inclusions" class="input md:col-span-2" placeholder="Inclusions">{p.inclusions ?? ""}</textarea>
						<textarea name="exclusions" class="input md:col-span-2" placeholder="Exclusions">{p.exclusions ?? ""}</textarea>

						<textarea name="image_urls" class="input md:col-span-2" placeholder="Image URLs">{imagesText(p.package_id)}</textarea>

						<div class="md:col-span-2 flex items-center justify-end">
							<button type="submit" class="btn-secondary">Update</button>
						</div>
					</form>

					<form method="post" action="?/deletePackage" class="mt-3">
						<input type="hidden" name="package_id" value={p.package_id} />
						<button
							type="submit"
							class="btn-danger"
							onclick="return confirm('Delete this package and its images?')"
						>
							Delete
						</button>
					</form>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.input {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 10px;
		background: #fff;
	}
	textarea.input {
		min-height: 82px;
		resize: vertical;
	}

	.btn-primary {
		background: #000;
		color: #fff;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
	}
	.btn-secondary {
		background: #f3f4f6;
		color: #111827;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
		border: 1px solid #e5e7eb;
	}
	.btn-danger {
		background: #fee2e2;
		color: #991b1b;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 700;
		border: 1px solid #fecaca;
	}
</style>

