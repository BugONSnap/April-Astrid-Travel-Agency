<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Manage Payments</h1>
		<a href="/admin" class="text-sm text-gray-600 hover:underline">Back to dashboard</a>
	</div>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Create payment</h2>
		<form method="post" action="?/createPayment" class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<select name="booking_id" class="input" required>
				{#each data.bookings as b}
					<option value={b.booking_id}>
						#{b.booking_id} - {b.first_name} {b.last_name} - {b.package_name}
					</option>
				{/each}
			</select>
			<input name="amount" placeholder="Amount" type="number" class="input" required />
			<select name="payment_status" class="input" required>
				{#each data.paymentStatuses as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
			<input name="payment_method" placeholder="Payment method (optional)" class="input md:col-span-2" />
			<input name="transaction_reference" placeholder="Transaction reference (optional)" class="input md:col-span-2" />
			<div class="md:col-span-2 flex justify-end">
				<button type="submit" class="btn-primary">Create</button>
			</div>
		</form>
	</section>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Existing payments</h2>
		<div class="overflow-x-auto">
			<table class="min-w-[1050px] w-full text-sm">
				<thead>
					<tr class="text-left border-b">
						<th class="p-2">Payment</th>
						<th class="p-2">Booking</th>
						<th class="p-2">User</th>
						<th class="p-2">Update payment</th>
						<th class="p-2">Delete</th>
					</tr>
				</thead>
				<tbody>
					{#each data.payments as p}
						<tr class="border-b align-top">
							<td class="p-2">
								<div class="font-semibold">#{p.payment_id}</div>
								<div class="text-gray-600">Amount: {p.amount}</div>
								<div class="text-gray-600">Status: {p.payment_status}</div>
								<div class="text-gray-600">Method: {p.payment_method ?? "—"}</div>
							</td>
							<td class="p-2">
								<div class="font-semibold">#{p.booking_id}</div>
								<div class="text-gray-600">{p.package_name}</div>
								<div class="text-gray-600">Date: {p.payment_date ? new Date(p.payment_date).toLocaleString() : "—"}</div>
							</td>
							<td class="p-2">
								<div>{p.first_name} {p.last_name}</div>
								<div class="text-gray-600">{p.email}</div>
							</td>
							<td class="p-2">
								<form method="post" action="?/updatePayment" class="space-y-2">
									<input type="hidden" name="payment_id" value={p.payment_id} />
									<input name="amount" class="input w-full" type="number" value={p.amount} required />

									<select name="payment_status" class="input w-full" required>
										{#each data.paymentStatuses as s}
											<option value={s} selected={p.payment_status === s}>{s}</option>
										{/each}
									</select>

									<input name="payment_method" class="input w-full" value={p.payment_method ?? ""} placeholder="Payment method" />
									<input
										name="transaction_reference"
										class="input w-full"
										value={p.transaction_reference ?? ""}
										placeholder="Transaction reference"
									/>
									<button type="submit" class="btn-secondary w-full">Update</button>
								</form>
							</td>
							<td class="p-2">
								<form method="post" action="?/deletePayment">
									<input type="hidden" name="payment_id" value={p.payment_id} />
									<button type="submit" class="btn-danger w-full" onclick="return confirm('Delete this payment?')">
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

