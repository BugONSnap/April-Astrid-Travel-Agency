<script lang="ts">
import Header from '$lib/assets/header.svelte'

let selectedService = 0
let menuOpen = false

const countries = [
"Japan","Korea","USA","Canada","Australia",
"Singapore","Thailand","Hong Kong","Taiwan","Malaysia"
]

const documentTypes = [
"Birth Certificate",
"Marriage Certificate",
"Diploma",
"Transcript of Records",
"NBI Clearance"
]

let formData: Record<string,string> = {}

function handleInput(field:string,value:string){
formData[field] = value
}

async function submitForm(){

const payload = {
service: services[selectedService].title,
data: formData
}

await fetch("/api/send-request",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(payload)
})

alert("Request submitted successfully!")
formData = {}
}

const services = [

{
title:"DFA Passport Appointment",
fields:[
{label:"Full Name",type:"text"},
{label:"Birthdate",type:"date"},
{label:"Contact Number",type:"text"},
{label:"Email Address",type:"email"},
{label:"Preferred Appointment Date",type:"date"}
]
},

{
title:"Tourist Visa Assistance",
fields:[
{label:"Full Name",type:"text"},
{label:"Passport Number",type:"text"},
{label:"Destination Country",type:"country"},
{label:"Travel Date",type:"date"},
{label:"Contact Number",type:"text"},
{label:"Email Address",type:"email"}
]
},

{
title:"International & Domestic Ticketing",
fields:[
{label:"Full Name",type:"text"},
{label:"Departure City",type:"text"},
{label:"Destination City",type:"text"},
{label:"Departure Date",type:"date"},
{label:"Return Date",type:"date"},
{label:"Number of Passengers",type:"text"},
{label:"Contact Number",type:"text"}
]
},

{
title:"Hotel Booking",
fields:[
{label:"Full Name",type:"text"},
{label:"Hotel Location",type:"text"},
{label:"Check-in Date",type:"date"},
{label:"Check-out Date",type:"date"},
{label:"Number of Guests",type:"text"},
{label:"Room Type",type:"text"},
{label:"Contact Number",type:"text"}
]
},

{
title:"Travel Insurance",
fields:[
{label:"Full Name",type:"text"},
{label:"Destination Country",type:"country"},
{label:"Travel Start Date",type:"date"},
{label:"Travel End Date",type:"date"},
{label:"Number of Travelers",type:"text"},
{label:"Contact Number",type:"text"},
{label:"Email Address",type:"email"}
]
},

{
title:"Apostille",
fields:[
{label:"Full Name",type:"text"},
{label:"Document Type",type:"document"},
{label:"Country of Use",type:"country"},
{label:"Contact Number",type:"text"},
{label:"Email Address",type:"email"}
]
},

{
title:"Red Ribbon",
fields:[
{label:"Full Name",type:"text"},
{label:"Document Type",type:"document"},
{label:"Purpose of Authentication",type:"text"},
{label:"Contact Number",type:"text"},
{label:"Email Address",type:"email"}
]
}

]

</script>

<Header />

<button class="mobile-menu" onclick={() => menuOpen = !menuOpen}>
☰ Services
</button>

<div class="sidebar" class:open={menuOpen}>

<div class="sidebar-logo">
<img src="/aalogo.png" alt="logo">
<span>April-Astrid</span>
</div>

<nav class="sidebar-menu">

{#each services as service,index}

<button
class:selected={selectedService === index}
onclick={()=>{
selectedService=index
menuOpen=false
}}
>

{service.title}

</button>

{/each}

</nav>

</div>


<div class="main-content">

<div class="services-title">
Services Offered
</div>

<div class="service-card">

<div class="service-heading">
{services[selectedService].title}
</div>

<form
  class="service-form"
  onsubmit={(e) => {
    e.preventDefault()
    submitForm()
  }}
>
{#each services[selectedService].fields as field}

<div class="form-group">

<label>{field.label}</label>

{#if field.type === "country"}

<select
onchange={(e)=>handleInput(field.label,e.target.value)}
>

<option>Select Country</option>

{#each countries as c}
<option>{c}</option>
{/each}

</select>

{:else if field.type === "document"}

<select
onchange={(e)=>handleInput(field.label,e.target.value)}
>

<option>Select Document</option>

{#each documentTypes as d}
<option>{d}</option>
{/each}

</select>

{:else}

<input
type={field.type}
placeholder={`Enter ${field.label}`}
oninput={(e)=>handleInput(field.label,e.target.value)}
/>

{/if}

</div>

{/each}

<button class="submit-btn">
Submit Request
</button>

</form>

</div>

</div>


<style>

/* MOBILE MENU BUTTON */

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
display:flex;
flex-direction:column;
transition:transform .3s;
}

.sidebar-logo{
display:flex;
align-items:center;
gap:8px;
margin-bottom:20px;
}

.sidebar-logo img{
width:32px;
height:32px;
border-radius:50%;
}

.sidebar-menu{
display:flex;
flex-direction:column;
gap:8px;
}

.sidebar-menu button{
background:none;
border:none;
color:white;
text-align:left;
cursor:pointer;
font-weight:600;
}

.sidebar-menu button:hover{
color:#ffd600;
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

.services-title{
text-align:center;
font-size:2rem;
font-family:serif;
margin-bottom:20px;
}

.service-card{
background:white;
padding:24px;
border-radius:10px;
box-shadow:0 4px 10px rgba(0,0,0,0.1);
max-width:600px;
margin:auto;
}

.service-heading{
font-size:1.3rem;
text-align:center;
font-weight:bold;
margin-bottom:20px;
}

.service-form{
display:flex;
flex-direction:column;
gap:16px;
}

.form-group{
display:flex;
flex-direction:column;
gap:4px;
}

.form-group input,
.form-group select{
padding:8px;
border-radius:6px;
border:1px solid #ccc;
}

.submit-btn{
background:#b71c1c;
color:white;
border:none;
padding:10px;
border-radius:6px;
cursor:pointer;
}

.submit-btn:hover{
background:#8e1414;
}

/* MOBILE */

@media (max-width:900px){

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
padding:60px 20px;
}

}

</style>