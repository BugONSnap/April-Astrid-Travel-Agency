<script lang="ts">
import { enhance } from '$app/forms'
import { untrack } from 'svelte'
import Header from '$lib/assets/header.svelte'
import type { PageData } from './$types'

/** Matches `employment_status` in schema */
const EMPLOYMENT_OPTIONS = ['STUDENT', 'EMPLOYED', 'UNEMPLOYED'] as const

let { data, form }: { data: PageData; form?: { message?: string; success?: boolean } } = $props()

let selectedMenu = $state(0)

const menuItems = [
	{ label: "Profile", icon: "👤" },
	{ label: "My Bookings", icon: "📋" },
	{ label: "Saved Tours", icon: "❤️" },
	{ label: "Payments", icon: "💳" },
	{ label: "Payment History", icon: "📊" },
	{ label: "Account Settings", icon: "⚙️" },
	{ label: "Explore", icon: "🌍" }
]

let formData = $state({ ...data.profile })
let avatarPreview = $state<string | null>(null)

$effect(() => {
	data.profile
	formData = { ...data.profile }
	untrack(() => {
		if (avatarPreview) {
			URL.revokeObjectURL(avatarPreview)
			avatarPreview = null
		}
	})
})

function onAvatarPicked(e: Event) {
	const input = e.currentTarget as HTMLInputElement
	const file = input.files?.[0]
	if (avatarPreview) URL.revokeObjectURL(avatarPreview)
	avatarPreview = file ? URL.createObjectURL(file) : null
}

// BOOKINGS DATA
let filter = $state("All")
let search = $state("")

function fmtMoney(n: number) {
	try {
		return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n)
	} catch {
		return `$${n}`
	}
}

function fmtDate(d: any) {
	if (!d) return "—"
	const dt = d instanceof Date ? d : new Date(d)
	if (Number.isNaN(dt.getTime())) return "—"
	return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

const filteredBookings = $derived(() => {
	const q = search.trim().toLowerCase()
	const base = data.bookings ?? []
	return base.filter((b: any) => {
		const matchesSearch =
			!q ||
			String(b.title ?? "").toLowerCase().includes(q) ||
			String(b.package_name ?? "").toLowerCase().includes(q) ||
			String(b.destination ?? "").toLowerCase().includes(q)

		if (!matchesSearch) return false

		if (filter === "All") return true
		if (filter === "Scheduled") return b.booking_status === "CONFIRMED" || b.booking_status === "PENDING"
		if (filter === "New") return b.booking_status === "PENDING"
		if (filter === "Old") return b.booking_status === "COMPLETED" || b.booking_status === "CANCELLED"
		return true
	})
})
</script>

<Header />

<!-- PROFILE HEADER -->
<div class="profile-header">
	<div class="header-container">
		<div class="profile-summary">
			<div class="avatar-circle">
				{#if formData.profile_picture}
					<img src={formData.profile_picture} alt="Profile" class="avatar-img" />
				{:else}
					<div class="avatar-placeholder">{formData.first_name?.[0] ?? 'U'}</div>
				{/if}
			</div>
			<div class="profile-info">
				<h1 class="profile-name">{formData.first_name ?? 'User'} {formData.last_name ?? ''}</h1>
				<p class="profile-email">{formData.email}</p>
				<p class="profile-meta">Member since {new Date().toLocaleDateString()}</p>
			</div>
		</div>
	</div>
</div>

<!-- NAVIGATION TABS -->
<div class="tabs-container">
	<div class="tabs-wrapper">
		{#each menuItems as item, index}
			<button
				class="tab-btn {selectedMenu === index ? 'active' : ''}"
				onclick={() => (selectedMenu = index)}
			>
				<span class="tab-icon">{item.icon}</span>
				<span class="tab-label">{item.label}</span>
			</button>
		{/each}
	</div>
</div>

<!-- MAIN CONTENT -->
<div class="content-wrapper">

<!-- ================= PROFILE ================= -->
{#if selectedMenu === 0}

<div class="page-title">Update Account Information</div>

<div class="profile-card">

{#if form?.message && (form as any).action === "updateProfile"}
<p class="form-msg form-msg-error" role="alert">{form.message}</p>
{/if}
{#if form?.success && (form as any).action === "updateProfile"}
<p class="form-msg form-msg-ok" role="status">Profile saved.</p>
{/if}

<form method="post" action="?/updateProfile" use:enhance enctype="multipart/form-data" class="profile-form">
<div class="section">
<div class="section-title">1 PERSONAL INFORMATION</div>
<div class="grid">
<input name="last_name" placeholder="Last Name" bind:value={formData.last_name} required />
<input name="first_name" placeholder="First Name" bind:value={formData.first_name} required />
<input name="middle_name" placeholder="Middle Name" bind:value={formData.middle_name} />
<input type="date" name="birthdate" bind:value={formData.birthdate} />
<input name="age" type="number" min="0" max="130" placeholder="Age" bind:value={formData.age} />
<input name="gender" placeholder="Gender" bind:value={formData.gender} />
<input name="nationality" placeholder="Nationality" bind:value={formData.nationality} />
<input name="civil_status" placeholder="Civil status" bind:value={formData.civil_status} />
</div>
</div>

<div class="section">
<div class="section-title">2 CONTACT INFORMATION</div>
<div class="grid">
<input name="email" type="email" placeholder="Email Address" bind:value={formData.email} required />
<input name="contact_number" placeholder="Contact Number" bind:value={formData.contact_number} />
<input name="home_address" class="full-row" placeholder="Home address" bind:value={formData.home_address} />
</div>
</div>

<div class="section">
<div class="section-title">3 OTHERS</div>
<div class="grid">
<label class="select-label full-row">
<span>Employment status</span>
<select name="employment_status" bind:value={formData.employment_status}>
<option value="">—</option>
{#each EMPLOYMENT_OPTIONS as opt}
<option value={opt}>{opt}</option>
{/each}
</select>
</label>
<div class="avatar-block full-row">
<span class="avatar-label">Profile photo</span>
{#if avatarPreview || formData.profile_picture}
<img class="avatar-preview" src={avatarPreview ?? formData.profile_picture} alt="" width="120" height="120" />
{/if}
<input
	type="file"
	name="profile_picture"
	accept="image/jpeg,image/png,image/webp,image/gif"
	class="file-input"
	onchange={onAvatarPicked}
/>
<p class="field-hint">JPEG, PNG, WebP, or GIF, up to 2 MB. Submit without choosing a file to keep your current photo.</p>
</div>
</div>
</div>

<button class="save-btn" type="submit">💾 Save and Continue</button>
</form>

</div>

{/if}

<!-- ================= BOOKINGS ================= -->
{#if selectedMenu === 1}

<div class="page-title">My Bookings</div>

<div class="booking-controls">

<div class="filters">
<button type="button" class:selected={filter==="All"} onclick={() => (filter = "All")}>All</button>
<button type="button" onclick={() => (filter = "Scheduled")}>Scheduled</button>
<button type="button" onclick={() => (filter = "New")}>New</button>
<button type="button" onclick={() => (filter = "Old")}>Old</button>
</div>

<div class="actions">
<button class="book-btn">Book a Trip</button>
<input class="search" placeholder="Search bookings" bind:value={search}/>
</div>

</div>

<div class="booking-list">

{#if filteredBookings().length === 0}
<div class="booking-card">
	<p style="margin:0; color:#666; font-weight:600;">Nothing here yet.</p>
	<p style="margin:6px 0 0; color:#888;">When you book a trip, it will show up in this list.</p>
</div>
{:else}
{#each filteredBookings() as b}
<div class="booking-card">

<div class="booking-header">
<h3>{b.title}</h3>
<span class="status">{b.booking_status}</span>
</div>

<div class="booking-body">
<p><b>Package:</b> {b.package_name}</p>
<p><b>Destination/s:</b> {b.destination}</p>
<p><b>Booked:</b> {fmtDate(b.booking_date)} · <b>Travel:</b> {fmtDate(b.travel_date)}</p>
<p><b>People in total:</b> {b.number_of_people}</p>
<p><b>Price Total:</b> {fmtMoney(b.total_price)}</p>
<p><b>Payment:</b> {b.payment_status}</p>
</div>

</div>
{/each}
{/if}

</div>

{/if}

<!-- ================= SAVED TOURS ================= -->
{#if selectedMenu === 2}
<div class="page-title">Saved Tours</div>
<div class="booking-list">
	{#if (data.savedTours ?? []).length === 0}
		<div class="booking-card">
			<p style="margin:0; color:#666; font-weight:600;">Nothing saved yet.</p>
			<p style="margin:6px 0 0; color:#888;">Save packages from “Explore” to keep them here.</p>
		</div>
	{:else}
		{#each data.savedTours as t (t.bookmark_id)}
			<div class="booking-card">
				<div class="booking-header">
					<h3>{t.package_name}</h3>
					<form method="post" action="?/removeBookmark" use:enhance>
						<input type="hidden" name="bookmark_id" value={t.bookmark_id} />
						<button type="submit" class="book-btn" style="background:#555;">Remove</button>
					</form>
				</div>
				<div class="booking-body">
					<p><b>Destination:</b> {t.destination_city ? `${t.destination_country}, ${t.destination_city}` : t.destination_country}</p>
					<p><b>Category:</b> {t.category} · <b>Price:</b> {fmtMoney(t.price)}</p>
					<p><b>Saved:</b> {fmtDate(t.created_at)}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>
{/if}

<!-- ================= PAYMENTS ================= -->
{#if selectedMenu === 3}
<div class="page-title">Payments</div>
<div class="booking-list">
	{#if (data.paymentsDue ?? []).length === 0}
		<div class="booking-card">
			<p style="margin:0; color:#666; font-weight:600;">Nothing to pay right now.</p>
			<p style="margin:6px 0 0; color:#888;">Unpaid bookings will appear here.</p>
		</div>
	{:else}
		{#each data.paymentsDue as p (p.booking_id)}
			<div class="booking-card">
				<div class="booking-header">
					<h3>{p.package_name}</h3>
					<span class="status" style="background:#f59e0b;">UNPAID</span>
				</div>
				<div class="booking-body">
					<p><b>Destination:</b> {p.destination_city ? `${p.destination_country}, ${p.destination_city}` : p.destination_country}</p>
					<p><b>Travel:</b> {fmtDate(p.travel_date)}</p>
					<p><b>Amount due:</b> {fmtMoney(p.total_price)}</p>
					<form method="post" action="?/makePayment" use:enhance class="ap-inline-form" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
						<input type="hidden" name="booking_id" value={p.booking_id} />
						<input name="payment_method" placeholder="Payment method (e.g. GCash)" style="padding:8px; border-radius:10px; border:1px solid #ddd;" />
						<input name="transaction_reference" placeholder="Reference (optional)" style="padding:8px; border-radius:10px; border:1px solid #ddd;" />
						<button type="submit" class="book-btn">Mark as Paid</button>
					</form>
					{#if form?.message && (form as any).action === "makePayment"}
						<p class="form-msg form-msg-error" role="alert" style="margin-top:10px;">{form.message}</p>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
{/if}

<!-- ================= PAYMENT HISTORY ================= -->
{#if selectedMenu === 4}
<div class="page-title">Payment History</div>
<div class="booking-list">
	{#if (data.paymentHistory ?? []).length === 0}
		<div class="booking-card">
			<p style="margin:0; color:#666; font-weight:600;">No payments yet.</p>
		</div>
	{:else}
		{#each data.paymentHistory as h (h.payment_id)}
			<div class="booking-card">
				<div class="booking-header">
					<h3>{h.package_name}</h3>
					<span class="status">{h.payment_status}</span>
				</div>
				<div class="booking-body">
					<p><b>Destination:</b> {h.destination_city ? `${h.destination_country}, ${h.destination_city}` : h.destination_country}</p>
					<p><b>Amount:</b> {fmtMoney(h.amount)} · <b>Date:</b> {fmtDate(h.payment_date)}</p>
					<p><b>Method:</b> {h.payment_method ?? "—"} · <b>Reference:</b> {h.transaction_reference ?? "—"}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>
{/if}

<!-- ================= ACCOUNT SETTINGS ================= -->
{#if selectedMenu === 5}
<div class="page-title">Account Settings</div>
<div class="profile-card">
	<h2 style="margin:0 0 12px; font-size:1.1rem; font-weight:800;">Change password</h2>
	<form method="post" action="?/changePassword" use:enhance class="profile-form">
		<div class="grid">
			<input name="current_password" type="password" placeholder="Current password" required />
			<input name="new_password" type="password" placeholder="New password (min 8 chars)" required minlength="8" />
			<input name="confirm_password" type="password" placeholder="Confirm new password" required minlength="8" />
		</div>
		<div style="margin-top:12px; display:flex; gap:10px; align-items:center; justify-content:flex-end;">
			<button class="save-btn" type="submit">Update password</button>
		</div>
		{#if form?.message && (form as any).action === "changePassword"}
			<p class="form-msg form-msg-error" role="alert" style="margin-top:12px;">{form.message}</p>
		{/if}
		{#if form?.success && (form as any).action === "changePassword"}
			<p class="form-msg form-msg-ok" role="status" style="margin-top:12px;">Password updated.</p>
		{/if}
	</form>
</div>
{/if}

<!-- ================= EXPLORE ================= -->
{#if selectedMenu === 6}
<div class="page-title">Explore</div>
<div class="booking-list">
	{#if (data.explore ?? []).length === 0}
		<div class="booking-card">
			<p style="margin:0; color:#666; font-weight:600;">No recommendations right now.</p>
		</div>
	{:else}
		{#each data.explore as p (p.package_id)}
			<div class="booking-card">
				<div class="booking-header">
					<h3>{p.package_name}</h3>
					<form method="post" action="?/addBookmark" use:enhance>
						<input type="hidden" name="package_id" value={p.package_id} />
						<button type="submit" class="book-btn">Save</button>
					</form>
				</div>
				<div class="booking-body">
					<p><b>Destination:</b> {p.destination_city ? `${p.destination_country}, ${p.destination_city}` : p.destination_country}</p>
					<p><b>Category:</b> {p.category} · <b>Price:</b> {fmtMoney(p.price)} · <b>Duration:</b> {p.duration_days ?? "—"} days</p>
				</div>
			</div>
		{/each}
	{/if}
</div>
{/if}

</div>

<style>

/* PROFILE HEADER */
.profile-header {
	background: linear-gradient(135deg, #b71c1c 0%, #8b0000 100%);
	color: white;
	padding: 40px 20px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-container {
	max-width: 1200px;
	margin: 0 auto;
}

.profile-summary {
	display: flex;
	align-items: center;
	gap: 30px;
}

.avatar-circle {
	width: 140px;
	height: 140px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	border: 3px solid rgba(255, 255, 255, 0.4);
	flex-shrink: 0;
	overflow: hidden;
}

.avatar-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.avatar-placeholder {
	font-size: 48px;
	font-weight: bold;
	color: white;
}

.profile-info h1,
.profile-name {
	margin: 0;
	font-size: 32px;
	font-weight: 700;
	color: white;
}

.profile-email {
	margin: 6px 0;
	font-size: 16px;
	color: rgba(255, 255, 255, 0.9);
}

.profile-meta {
	margin: 4px 0 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.7);
}

/* TABS NAVIGATION */
.tabs-container {
	background: white;
	border-bottom: 1px solid #e0e0e0;
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tabs-wrapper {
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	gap: 0;
	padding: 0 20px;
}

.tab-btn {
	flex: 1;
	padding: 16px 20px;
	background: none;
	border: none;
	border-bottom: 3px solid transparent;
	cursor: pointer;
	font-size: 15px;
	font-weight: 600;
	color: #666;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	transition: all 0.3s ease;
	max-width: 180px;
	margin: 0 auto;
}

.tab-btn:hover {
	color: #b71c1c;
	background: rgba(183, 28, 28, 0.05);
}

.tab-btn.active {
	color: #b71c1c;
	border-bottom-color: #b71c1c;
}

.tab-icon {
	font-size: 18px;
}

.tab-label {
	white-space: nowrap;
}

/* MAIN CONTENT */
.content-wrapper {
	max-width: 1200px;
	margin: 0 auto;
	padding: 40px 20px;
	background: #fafafa;
	min-height: calc(100vh - 300px);
}

.page-title {
	font-size: 28px;
	font-weight: 700;
	margin-bottom: 24px;
	color: #222;
}

/* PROFILE CARD */
.profile-card {
	background: white;
	padding: 32px;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section {
	margin-bottom: 32px;
}

.section-title {
	font-weight: 700;
	font-size: 16px;
	color: #222;
	margin-bottom: 16px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	border-bottom: 2px solid #b71c1c;
	padding-bottom: 8px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
}

.grid .full-row {
	grid-column: 1 / -1;
}

.avatar-block {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	grid-column: 1 / -1;
}

.avatar-label {
	font-size: 14px;
	font-weight: 600;
	color: #333;
}

.avatar-preview {
	width: 140px;
	height: 140px;
	object-fit: cover;
	border-radius: 50%;
	border: 3px solid #b71c1c;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-input {
	max-width: 100%;
	font-size: 14px;
	padding: 8px;
	border: 1px solid #ddd;
	border-radius: 6px;
	cursor: pointer;
}

.field-hint {
	margin: 0;
	font-size: 12px;
	color: #999;
	max-width: 42rem;
}

.select-label {
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 14px;
	font-weight: 600;
	color: #333;
}

.select-label span {
	font-weight: 700;
}

select,
input {
	padding: 12px;
	border-radius: 8px;
	border: 1px solid #ddd;
	background: white;
	font-size: 14px;
	transition: all 0.2s ease;
}

select:hover,
input:hover {
	border-color: #b71c1c;
}

select:focus,
input:focus {
	outline: none;
	border-color: #b71c1c;
	box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.profile-form {
	display: block;
}

.form-msg {
	margin: 0 0 16px;
	padding: 14px 16px;
	border-radius: 8px;
	font-weight: 600;
	font-size: 14px;
}

.form-msg-error {
	background: #ffebee;
	color: #b71c1c;
	border-left: 4px solid #b71c1c;
}

.form-msg-ok {
	background: #e8f5e9;
	color: #2e7d32;
	border-left: 4px solid #4caf50;
}

.save-btn {
	background: #b71c1c;
	color: white;
	padding: 12px 28px;
	border-radius: 8px;
	border: none;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s ease;
	display: block;
	margin-left: auto;
	margin-top: 20px;
}

.save-btn:hover {
	background: #8b0000;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(183, 28, 28, 0.3);
}

.save-btn:active {
	transform: translateY(0);
}

/* BOOKINGS */
.booking-controls {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 24px;
}

.filters button {
	padding: 8px 16px;
	border-radius: 20px;
	border: 1px solid #ddd;
	background: white;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.2s ease;
	color: #666;
}

.filters button:hover {
	border-color: #b71c1c;
	color: #b71c1c;
}

.filters button.selected {
	background: #b71c1c;
	color: white;
	border-color: #b71c1c;
}

.actions {
	display: flex;
	gap: 12px;
	align-items: center;
}

.book-btn {
	background: #b71c1c;
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.2s ease;
}

.book-btn:hover {
	background: #8b0000;
	transform: translateY(-2px);
}

.search {
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #ddd;
	font-size: 14px;
	flex: 1;
	max-width: 250px;
}

/* BOOKING CARD */
.booking-card {
	background: white;
	padding: 20px;
	border-radius: 12px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
	border: 1px solid transparent;
}

.booking-card:hover {
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	border-color: #b71c1c;
}

.booking-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	gap: 12px;
}

.booking-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 700;
	color: #222;
	flex: 1;
}

.booking-body {
	font-size: 14px;
	color: #666;
	line-height: 1.6;
}

.booking-body p {
	margin: 6px 0;
}

.booking-body b {
	color: #333;
	font-weight: 600;
}

.booking-list {
	display: flex;
	flex-direction: column;
}

.status {
	background: #4caf50;
	color: white;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}

/* RESPONSIVE */
@media (max-width: 900px) {
	.profile-header {
		padding: 24px 16px;
	}

	.profile-summary {
		flex-direction: column;
		text-align: center;
		gap: 20px;
	}

	.profile-info {
		width: 100%;
	}

	.profile-name {
		font-size: 24px;
	}

	.profile-email {
		font-size: 14px;
	}

	.tabs-wrapper {
		flex-wrap: wrap;
		padding: 0 16px;
	}

	.tab-btn {
		flex: 1;
		min-width: 100px;
		padding: 12px 8px;
		font-size: 13px;
		gap: 4px;
	}

	.tab-icon {
		font-size: 16px;
	}

	.tab-label {
		display: none;
	}

	.tab-btn.active .tab-label {
		display: inline;
	}

	.content-wrapper {
		padding: 24px 16px;
	}

	.profile-card {
		padding: 20px;
	}

	.grid {
		grid-template-columns: 1fr;
	}

	.avatar-preview {
		width: 100px;
		height: 100px;
	}

	.booking-controls {
		flex-direction: column;
		align-items: stretch;
	}

	.search {
		max-width: 100%;
	}

	.save-btn {
		width: 100%;
		margin-left: 0;
	}
}

@media (max-width: 600px) {
	.profile-name {
		font-size: 20px;
	}

	.page-title {
		font-size: 22px;
	}

	.tab-btn {
		min-width: 80px;
		padding: 10px 6px;
	}

	.booking-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.booking-header h3 {
		font-size: 16px;
	}

	.book-btn {
		width: 100%;
	}
}

</style>