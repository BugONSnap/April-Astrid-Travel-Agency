<script lang="ts">
import Header from '$lib/assets/header.svelte'

let selectedMenu = 0
let menuOpen = false

const menuItems = [
"Profile",
"My Bookings",
"Saved Tours",
"Payments",
"Payment History",
"Account Settings",
"Explore"
]

// PROFILE DATA
let formData = {
lastName: "Doe",
firstName: "Jane",
middleName: "Navarro",
nickname: "",
birthDate: "2004-02-22",
age: "20",
sex: "F",
religion: "Roman Catholic",
nationality: "Filipino"
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

let filter = "All"
let search = ""
</script>

<Header />

<button class="mobile-menu" on:click={() => menuOpen = !menuOpen}>
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
class:selected={selectedMenu === index}
on:click={() => {
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

<div class="section">
<div class="section-title">1 PERSONAL INFORMATION</div>
<div class="grid">
<input placeholder="Last Name" bind:value={formData.lastName} />
<input placeholder="First Name" bind:value={formData.firstName} />
<input placeholder="Middle Name" bind:value={formData.middleName} />
<input placeholder="Nickname" bind:value={formData.nickname} />
<input type="date" bind:value={formData.birthDate} />
<input placeholder="Age" bind:value={formData.age} />
<input placeholder="Sex" bind:value={formData.sex} />
<input placeholder="Religion" bind:value={formData.religion} />
<input placeholder="Nationality" bind:value={formData.nationality} />
</div>
</div>

<div class="section">
<div class="section-title">2 CONTACT INFORMATION</div>
<div class="grid">
<input placeholder="Email Address" />
<input placeholder="Contact Number" />
<input placeholder="Address" />
<input placeholder="City" />
</div>
</div>

<div class="section">
<div class="section-title">3 OTHERS</div>
<div class="grid">
<input placeholder="Preferred Language" />
<input placeholder="Time Zone" />
</div>
</div>

<button class="save-btn">💾 Save and Continue</button>

</div>

{/if}

<!-- ================= BOOKINGS ================= -->
{#if selectedMenu === 1}

<div class="page-title">My Bookings</div>

<div class="booking-controls">

<div class="filters">
<button class:selected={filter==="All"} on:click={()=>filter="All"}>All</button>
<button on:click={()=>filter="Scheduled"}>Scheduled</button>
<button on:click={()=>filter="New"}>New</button>
<button on:click={()=>filter="Old"}>Old</button>
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

input{
padding:10px;
border-radius:8px;
border:1px solid #ddd;
}

.save-btn{
float:right;
background:#b71c1c;
color:white;
padding:10px 18px;
border-radius:20px;
border:none;
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