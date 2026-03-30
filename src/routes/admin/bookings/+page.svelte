<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin · Bookings</title>
</svelte:head>

<div class="ap-page ap-stack admin-red">
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
									{#if b.booking_kind === "SERVICE"}
										{b.service_title ?? "Service"}
										<div class="ap-muted">Service booking</div>
									{:else}
										{b.package_name}
										<div class="ap-muted">Pkg #{b.package_id}</div>
									{/if}
								</td>
								<td>
									<div>{b.travel_date ? new Date(b.travel_date).toLocaleDateString() : "—"}</div>
									<div class="ap-muted">
										Book: <span class="pill pill--book">{b.booking_status}</span>
									</div>
									<div class="ap-muted">
										Pay: <span class="pill pill--pay">{b.payment_status}</span>
									</div>
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
											<button type="submit" class="ap-btn ap-btn--secondary ap-btn--block ap-btn--red">Apply</button>
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

<style>
	.admin-red.ap-page {
		background:
			radial-gradient(1100px 420px at 12% -12%, rgba(196, 30, 58, 0.18), transparent 60%),
			linear-gradient(180deg, #fbfbfd 0%, #f7f4f6 100%);
		min-height: 100vh;
	}

	.admin-red .ap-card {
		border: 1px solid rgba(196, 30, 58, 0.10);
		box-shadow: 0 18px 60px rgba(15, 15, 20, 0.10);
	}

	.admin-red .ap-table thead th {
		background: rgba(196, 30, 58, 0.06);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		padding: 0.15rem 0.5rem;
		font-weight: 800;
		font-size: 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.10);
		background: rgba(255, 255, 255, 0.7);
	}

	.pill--book {
		border-color: rgba(196, 30, 58, 0.24);
		background: rgba(196, 30, 58, 0.10);
		color: #8f0e24;
	}

	.pill--pay {
		border-color: rgba(15, 118, 110, 0.22);
		background: rgba(15, 118, 110, 0.10);
		color: #0b5e57;
	}

	/* Accent button (keeps existing ap button styles) */
	.admin-red :global(.ap-btn--red) {
		border-color: rgba(196, 30, 58, 0.30) !important;
		background: rgba(196, 30, 58, 0.10) !important;
	}
	.admin-red :global(.ap-btn--red:hover) {
		background: rgba(196, 30, 58, 0.14) !important;
	}
</style>
