<script lang="ts">
import { enhance } from '$app/forms'
import { untrack } from 'svelte'
import Header from '$lib/assets/header.svelte'
import type { PageData } from './$types'

/** Matches `employment_status` in schema */
const EMPLOYMENT_OPTIONS = ['STUDENT', 'EMPLOYED', 'UNEMPLOYED'] as const

let { data, form }: { data: PageData; form?: { message?: string; success?: boolean } } = $props()

let selectedMenu = $state(0)
let menuOpen = $state(false)

const menuItems = [
"Profile",
"My Bookings",
"Saved Tours",
"Payments",
"Payment History",
"Account Settings",
"Explore"
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

<button class="mobile-menu" type="button" onclick={() => (menuOpen = !menuOpen)}>
☰ Menu
</button>

<!-- SIDEBAR -->
<div class="sidebar" class:open={menuOpen}>
<div class="sidebar-logo">
<img src="/aalogo.png" alt="logo">
</div>

<nav class="sidebar-menu">
{#each menuItems as item, index}
<button
type="button"
class:selected={selectedMenu === index}
onclick={() => {
	selectedMenu = index
	menuOpen = false
}}
>
{item}
</button>
{/each}
</nav>
</div>

<!-- MAIN -->
<div class="main-content">

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

/* MOBILE BUTTON */
.mobile-menu{
display:none;
position:fixed;
top:10px;
left:10px;
z-index:1000;
background:#b71c1c;
color:white;
border:none;
padding:8px 12px;
border-radius:6px;
}

/* SIDEBAR */
.sidebar{
background:#b71c1c;
color:white;
width:260px;
min-height:100vh;
position:fixed;
left:0;
top:0;
padding:20px;
}

.sidebar-logo{
display:flex;
align-items:center;
gap:8px;
margin-bottom:20px;
}

.sidebar-menu{
display:flex;
flex-direction:column;
gap:10px;
}

.sidebar-menu button{
background:none;
border:none;
color:white;
text-align:left;
cursor:pointer;
font-weight:600;
}

.sidebar-menu button.selected{
color:#ffd600;
}

/* MAIN */
.main-content{
margin-left:260px;
padding:40px;
background:#f5f5f5;
min-height:100vh;
}

.page-title{
font-size:2rem;
font-weight:bold;
margin-bottom:20px;
}

/* PROFILE */
.profile-card{
background:white;
padding:30px;
border-radius:12px;
box-shadow:0 6px 16px rgba(0,0,0,0.08);
}

.section{
margin-bottom:30px;
}

.section-title{
font-weight:bold;
border-left:3px solid #b71c1c;
padding-left:10px;
margin-bottom:10px;
}

.grid{
display:grid;
grid-template-columns: repeat(3,1fr);
gap:12px;
}

.grid .full-row{
grid-column: 1 / -1;
}

.avatar-block{
display:flex;
flex-direction:column;
align-items:flex-start;
gap:10px;
}

.avatar-label{
font-size:0.875rem;
font-weight:600;
}

.avatar-preview{
width:120px;
height:120px;
object-fit:cover;
border-radius:50%;
border:2px solid #ddd;
}

.file-input{
max-width:100%;
font-size:0.875rem;
}

.field-hint{
margin:0;
font-size:0.8rem;
color:#666;
max-width:42rem;
}

.select-label{
display:flex;
flex-direction:column;
gap:6px;
font-size:0.875rem;
font-weight:600;
}

select{
padding:10px;
border-radius:8px;
border:1px solid #ddd;
background:white;
}

input{
padding:10px;
border-radius:8px;
border:1px solid #ddd;
}

.profile-form{
display:block;
}

.form-msg{
margin:0 0 16px;
padding:12px 14px;
border-radius:8px;
font-weight:600;
}

.form-msg-error{
background:#ffebee;
color:#b71c1c;
}

.form-msg-ok{
background:#e8f5e9;
color:#2e7d32;
}

.save-btn{
float:right;
background:#b71c1c;
color:white;
padding:10px 18px;
border-radius:20px;
border:none;
cursor:pointer;
}

.save-btn:hover{
filter:brightness(1.05);
}

/* BOOKINGS */
.booking-controls{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:20px;
}

.filters button{
margin-right:6px;
padding:6px 12px;
border-radius:20px;
border:none;
background:#ddd;
cursor:pointer;
}

.filters button.selected{
background:#b71c1c;
color:white;
}

.actions{
display:flex;
gap:10px;
align-items:center;
}

.book-btn{
background:#b71c1c;
color:white;
border:none;
padding:6px 14px;
border-radius:20px;
cursor:pointer;
}

.search{
padding:6px;
border-radius:20px;
border:1px solid #ccc;
}

/* BOOKING CARD */
.booking-card{
background:white;
padding:20px;
border-radius:12px;
margin-bottom:12px;
box-shadow:0 4px 10px rgba(0,0,0,0.05);
}

.booking-header{
display:flex;
justify-content:space-between;
align-items:center;
}

.status{
background:#4caf50;
color:white;
padding:4px 10px;
border-radius:20px;
font-size:0.8rem;
}

/* MOBILE */
@media(max-width:900px){

.mobile-menu{
display:block;
}

.sidebar{
transform:translateX(-100%);
}

.sidebar.open{
transform:translateX(0);
}

.main-content{
margin-left:0;
padding:70px 20px;
}

.grid{
grid-template-columns:1fr;
}

.booking-controls{
flex-direction:column;
gap:10px;
align-items:flex-start;
}

}

</style>