<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin · Payments</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Finance</p>
			<h1 class="ap-title">Payments</h1>
			<p class="ap-sub">Record and reconcile payment rows. Creating a payment syncs the linked booking’s payment status.</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	<section class="ap-card" aria-labelledby="pay-create-heading">
		<h2 id="pay-create-heading" class="ap-card-title">Record payment</h2>
		{#if data.bookings.length === 0}
			<p class="ap-empty">You need at least one booking before recording a payment.</p>
		{:else}
			<form method="post" action="?/createPayment" class="ap-form-grid">
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pay-booking">Booking</label>
					<select id="pay-booking" name="booking_id" class="ap-select" required>
						{#each data.bookings as b}
							<option value={b.booking_id}>
								#{b.booking_id} — {b.first_name}
								{b.last_name} — {b.package_name ?? "Package"}
							</option>
						{/each}
					</select>
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pay-amount">Amount</label>
					<input id="pay-amount" name="amount" type="number" class="ap-input" required />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="pay-st">Status</label>
					<select id="pay-st" name="payment_status" class="ap-select" required>
						{#each data.paymentStatuses as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pay-method">Method</label>
					<input id="pay-method" name="payment_method" class="ap-input" placeholder="Optional" />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="pay-ref">Reference</label>
					<input id="pay-ref" name="transaction_reference" class="ap-input" placeholder="Optional" />
				</div>
				<div class="ap-form-actions ap-span-2">
					<button type="submit" class="ap-btn ap-btn--primary">Create payment</button>
				</div>
			</form>
		{/if}
	</section>

	<section class="ap-card" aria-labelledby="pay-list-heading">
		<h2 id="pay-list-heading" class="ap-card-title">Payment ledger</h2>
		{#if data.payments.length === 0}
			<p class="ap-empty">No payment rows yet.</p>
		{:else}
			<div class="ap-table-wrap">
				<table class="ap-table">
					<thead>
						<tr>
							<th>Payment</th>
							<th>Booking</th>
							<th>Guest</th>
							<th>Edit</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.payments as p}
							<tr>
								<td>
									<strong>#{p.payment_id}</strong>
									<div class="ap-muted">Amt {p.amount?.toLocaleString?.() ?? p.amount}</div>
									<div class="ap-muted">{p.payment_status}</div>
									<div class="ap-muted">{p.payment_method ?? "—"}</div>
								</td>
								<td>
									#{p.booking_id}
									<div class="ap-muted">{p.package_name}</div>
									<div class="ap-muted">
										{p.payment_date ? new Date(p.payment_date).toLocaleString() : "—"}
									</div>
								</td>
								<td>
									{p.first_name}
									{p.last_name}
									<div class="ap-muted">{p.email}</div>
								</td>
								<td>
									<form method="post" action="?/updatePayment" class="ap-form-grid ap-nested-form">
										<input type="hidden" name="payment_id" value={p.payment_id} />
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`pa-${p.payment_id}`}>Amount</label>
											<input id={`pa-${p.payment_id}`} name="amount" type="number" class="ap-input" value={p.amount} required />
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`pst-${p.payment_id}`}>Status</label>
											<select id={`pst-${p.payment_id}`} name="payment_status" class="ap-select" required>
												{#each data.paymentStatuses as s}
													<option value={s} selected={p.payment_status === s}>{s}</option>
												{/each}
											</select>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`pm-${p.payment_id}`}>Method</label>
											<input
												id={`pm-${p.payment_id}`}
												name="payment_method"
												class="ap-input"
												value={p.payment_method ?? ""}
											/>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`pr-${p.payment_id}`}>Reference</label>
											<input
												id={`pr-${p.payment_id}`}
												name="transaction_reference"
												class="ap-input"
												value={p.transaction_reference ?? ""}
											/>
										</div>
										<div class="ap-form-actions ap-span-2">
											<button type="submit" class="ap-btn ap-btn--secondary ap-btn--block">Save</button>
										</div>
									</form>
								</td>
								<td>
									<form method="post" action="?/deletePayment">
										<input type="hidden" name="payment_id" value={p.payment_id} />
										<button
											type="submit"
											class="ap-btn ap-btn--danger ap-btn--block"
											onclick={(e) => {
												if (!confirm("Delete this payment row?")) {
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
