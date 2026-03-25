<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Manage Destinations</h1>
		<a href="/admin" class="text-sm text-gray-600 hover:underline">Back to dashboard</a>
	</div>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Create destination</h2>
		<form method="post" action="?/createDestination" class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<input name="country_name" placeholder="Country name" class="input" required />
			<input name="city_name" placeholder="City name (optional)" class="input" />
			<textarea name="description" placeholder="Description (optional)" class="input md:col-span-2"></textarea>
			<input name="image_cover" placeholder="Cover image URL (optional)" class="input md:col-span-2" />
			<div class="md:col-span-2 flex justify-end">
				<button type="submit" class="btn-primary">Create</button>
			</div>
		</form>
	</section>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Existing destinations</h2>
		<div class="overflow-x-auto">
			<table class="min-w-[820px] w-full text-sm">
				<thead>
					<tr class="text-left border-b">
						<th class="p-2">ID</th>
						<th class="p-2">Country</th>
						<th class="p-2">City</th>
						<th class="p-2">Image</th>
						<th class="p-2">Update</th>
						<th class="p-2">Delete</th>
					</tr>
				</thead>
				<tbody>
					{#each data.destinations as d}
						<tr class="border-b align-top">
							<td class="p-2">{d.destination_id}</td>
							<td class="p-2">{d.country_name}</td>
							<td class="p-2">{d.city_name ?? "—"}</td>
							<td class="p-2">
								{#if d.image_cover}
									<img src={d.image_cover} alt="" class="w-16 h-10 object-cover rounded border" />
								{:else}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="p-2">
								<form method="post" action="?/updateDestination" class="space-y-2">
									<input type="hidden" name="destination_id" value={d.destination_id} />
									<input name="country_name" class="input w-full" value={d.country_name} required />
									<input name="city_name" class="input w-full" value={d.city_name ?? ""} placeholder="City name" />
									<input name="image_cover" class="input w-full" value={d.image_cover ?? ""} placeholder="Image URL" />
									<textarea name="description" class="input w-full" placeholder="Description">{d.description ?? ""}</textarea>
									<button type="submit" class="btn-secondary w-full">Update</button>
								</form>
							</td>
							<td class="p-2">
								<form method="post" action="?/deleteDestination">
									<input type="hidden" name="destination_id" value={d.destination_id} />
									<button type="submit" class="btn-danger w-full" onclick="return confirm('Delete this destination?')">
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
		min-height: 84px;
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

