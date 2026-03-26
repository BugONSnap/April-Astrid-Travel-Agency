<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin · Bookings</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Operations</p>
			<h1 class="ap-title">Bookings</h1>
			<p class="ap-sub">Update booking and payment status for each reservation. Scroll sideways on phones to see all columns.</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	<section class="ap-card" aria-labelledby="bookings-heading">
		<h2 id="bookings-heading" class="ap-card-title">All bookings</h2>
		{#if data.bookings.length === 0}
			<p class="ap-empty">No bookings yet.</p>
		{:else}
			<div class="ap-table-wrap">
				<table class="ap-table">
					<thead>
						<tr>
							<th>Booking</th>
							<th>Guest</th>
							<th>Package</th>
							<th>Trip</th>
							<th>Pax / total</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as b}
							<tr>
								<td>
									<strong>#{b.booking_id}</strong>
									<div class="ap-muted">
										{b.booking_date ? new Date(b.booking_date).toLocaleString() : "—"}
									</div>
								</td>
								<td>
									{b.first_name} {b.last_name}
									<div class="ap-muted">{b.email}</div>
								</td>
								<td>
									{b.package_name}
									<div class="ap-muted">Pkg #{b.package_id}</div>
								</td>
								<td>
									<div>{b.travel_date ? new Date(b.travel_date).toLocaleDateString() : "—"}</div>
									<div class="ap-muted">Book: {b.booking_status}</div>
									<div class="ap-muted">Pay: {b.payment_status}</div>
								</td>
								<td>
									{b.number_of_people} pax
									<div class="ap-muted">Total {b.total_price?.toLocaleString?.() ?? b.total_price}</div>
								</td>
								<td>
									<form method="post" action="?/updateBooking" class="ap-form-grid ap-nested-form">
										<input type="hidden" name="booking_id" value={b.booking_id} />
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`bs-${b.booking_id}`}>Booking</label>
											<select id={`bs-${b.booking_id}`} name="booking_status" class="ap-select">
												{#each data.bookingStatuses as s}
													<option value={s} selected={b.booking_status === s}>{s}</option>
												{/each}
											</select>
										</div>
										<div class="ap-field ap-span-2">
											<label class="ap-label" for={`ps-${b.booking_id}`}>Payment</label>
											<select id={`ps-${b.booking_id}`} name="payment_status" class="ap-select">
												{#each data.paymentStatuses as s}
													<option value={s} selected={b.payment_status === s}>{s}</option>
												{/each}
											</select>
										</div>
										<div class="ap-form-actions ap-span-2">
											<button type="submit" class="ap-btn ap-btn--secondary ap-btn--block">Apply</button>
										</div>
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
