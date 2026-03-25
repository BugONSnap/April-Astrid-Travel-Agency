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
let bookings = [
{
title: "Greece, Santorini",
package: "Greece Star Package",
destination: "Santorini",
date: "March 19 - 20, 2026",
people: 3,
price: "$3500",
status: "Scheduled"
},
{
title: "Japan, Tokyo",
package: "Sakura Tour",
destination: "Tokyo",
date: "April 10 - 15, 2026",
people: 2,
price: "$2800",
status: "Scheduled"
}
]

let filter = $state("All")
let search = $state("")
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

{#if form?.message}
<p class="form-msg form-msg-error" role="alert">{form.message}</p>
{/if}
{#if form?.success}
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

{#each bookings as b}
<div class="booking-card">

<div class="booking-header">
<h3>{b.title}</h3>
<span class="status">{b.status}</span>
</div>

<div class="booking-body">
<p><b>Package:</b> {b.package}</p>
<p><b>Destination/s:</b> {b.destination}</p>
<p><b>Date:</b> {b.date}</p>
<p><b>People in total:</b> {b.people}</p>
<p><b>Price Total:</b> {b.price}</p>
</div>

</div>
{/each}

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