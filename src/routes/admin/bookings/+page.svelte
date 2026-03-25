<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Manage Bookings</h1>
		<a href="/admin" class="text-sm text-gray-600 hover:underline">Back to dashboard</a>
	</div>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Bookings</h2>
		<div class="overflow-x-auto">
			<table class="min-w-[1100px] w-full text-sm">
				<thead>
					<tr class="text-left border-b">
						<th class="p-2">Booking</th>
						<th class="p-2">User</th>
						<th class="p-2">Package</th>
						<th class="p-2">Travel</th>
						<th class="p-2">People / Total</th>
						<th class="p-2">Update Statuses</th>
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as b}
						<tr class="border-b align-top">
							<td class="p-2">
								<div class="font-semibold">#{b.booking_id}</div>
								<div class="text-gray-600">Booked: {b.booking_date ? new Date(b.booking_date).toLocaleString() : "—"}</div>
							</td>
							<td class="p-2">
								<div>{b.first_name} {b.last_name}</div>
								<div class="text-gray-600">{b.email}</div>
							</td>
							<td class="p-2">
								<div class="font-medium">{b.package_name}</div>
								<div class="text-gray-600">#{b.package_id}</div>
							</td>
							<td class="p-2">
								<div>{b.travel_date ? new Date(b.travel_date).toLocaleDateString() : "—"}</div>
								<div class="text-gray-600">Booking: <span class="font-medium">{b.booking_status}</span></div>
								<div class="text-gray-600">Payment: <span class="font-medium">{b.payment_status}</span></div>
							</td>
							<td class="p-2">
								<div>{b.number_of_people} people</div>
								<div class="font-semibold">Total: {b.total_price}</div>
							</td>
							<td class="p-2">
								<form method="post" action="?/updateBooking" class="space-y-2">
									<input type="hidden" name="booking_id" value={b.booking_id} />
									<div>
										<label class="block text-xs text-gray-600 mb-1">Booking status</label>
										<select name="booking_status" class="input w-full">
											{#each data.bookingStatuses as s}
												<option value={s} selected={b.booking_status === s}>{s}</option>
											{/each}
										</select>
									</div>
									<div>
										<label class="block text-xs text-gray-600 mb-1">Payment status</label>
										<select name="payment_status" class="input w-full">
											{#each data.paymentStatuses as s}
												<option value={s} selected={b.payment_status === s}>{s}</option>
											{/each}
										</select>
									</div>
									<button type="submit" class="btn-secondary w-full">Update</button>
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
	.btn-secondary {
		background: #f3f4f6;
		color: #111827;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
		border: 1px solid #e5e7eb;
	}
</style>

