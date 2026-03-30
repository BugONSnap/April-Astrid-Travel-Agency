<script lang="ts">
import Header from '$lib/assets/header.svelte'
import { page } from '$app/stores'

type ServiceField =
	| { label: string; type: 'text' | 'date' | 'email' | 'tel' | 'number' }
	| { label: string; type: 'country' }
	| { label: string; type: 'document' }

type Service = { title: string; description: string; fields: ServiceField[] }

let selectedService = 0
let menuOpen = false
let query = ''

let isSubmitting = false
let submitError = ''
let submitSuccess = ''

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

function requiredFieldsFor(service: Service) {
	// Simple required policy: everything except optional "Return Date"
	return service.fields
		.map((f) => f.label)
		.filter((l) => l.toLowerCase() !== 'return date')
}

function validate(service: Service) {
	const required = requiredFieldsFor(service)
	const missing = required.filter((k) => !String(formData[k] ?? '').trim())
	return missing
}

async function submitForm(){
	if (isSubmitting) return
	submitError = ''
	submitSuccess = ''

	const user = $page.data.user as { user_id?: number } | null | undefined
	if (!user?.user_id) {
		submitError = 'Please log in to submit a service request.'
		return
	}

const payload = {
service: services[selectedService].title,
data: formData
}

	const missing = validate(services[selectedService])
	if (missing.length) {
		submitError = `Please fill out: ${missing.join(', ')}.`
		return
	}

	try {
		isSubmitting = true
		const res = await fetch("/api/send-request",{
			method:"POST",
			headers:{'Content-Type':'application/json'},
			body:JSON.stringify(payload)
		})

		if (!res.ok) {
			const err = await res.json().catch(() => ({}))
			submitError = typeof err.error === 'string' ? err.error : `Submit failed (${res.status}).`
			return
		}

		submitSuccess =
			'Request submitted! Open Customer Support chat to continue — staff will confirm services there and can record your booking when ready.'
		formData = {}
	} catch {
		submitError = 'Network error submitting request.'
	} finally {
		isSubmitting = false
	}
}

function fieldDomId(serviceIdx: number, label: string) {
	const slug = label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return `service-${serviceIdx}-${slug}`;
}

const services = [

{
title:"DFA Passport Appointment",
description:"We’ll help you set an appointment slot and prepare your requirements checklist.",
fields:[
{label:"Full Name",type:"text"},
{label:"Birthdate",type:"date"},
{label:"Contact Number",type:"tel"},
{label:"Email Address",type:"email"},
{label:"Preferred Appointment Date",type:"date"}
]
},

{
title:"Tourist Visa Assistance",
description:"Guidance on requirements, forms, supporting docs, and submission timeline.",
fields:[
{label:"Full Name",type:"text"},
{label:"Passport Number",type:"text"},
{label:"Destination Country",type:"country"},
{label:"Travel Date",type:"date"},
{label:"Contact Number",type:"tel"},
{label:"Email Address",type:"email"}
]
},

{
title:"International & Domestic Ticketing",
description:"Quote, booking assistance, and itinerary support for flights and domestic routes.",
fields:[
{label:"Full Name",type:"text"},
{label:"Departure City",type:"text"},
{label:"Destination City",type:"text"},
{label:"Departure Date",type:"date"},
{label:"Return Date",type:"date"},
{label:"Number of Passengers",type:"number"},
{label:"Contact Number",type:"tel"}
]
},

{
title:"Hotel Booking",
description:"Hotel options with your preferences and budget, plus booking assistance.",
fields:[
{label:"Full Name",type:"text"},
{label:"Hotel Location",type:"text"},
{label:"Check-in Date",type:"date"},
{label:"Check-out Date",type:"date"},
{label:"Number of Guests",type:"number"},
{label:"Room Type",type:"text"},
{label:"Contact Number",type:"tel"}
]
},

{
title:"Travel Insurance",
description:"Coverage recommendations and quick assistance for policy acquisition.",
fields:[
{label:"Full Name",type:"text"},
{label:"Destination Country",type:"country"},
{label:"Travel Start Date",type:"date"},
{label:"Travel End Date",type:"date"},
{label:"Number of Travelers",type:"number"},
{label:"Contact Number",type:"tel"},
{label:"Email Address",type:"email"}
]
},

{
title:"Apostille",
description:"We can assist with document processing and country-specific requirements.",
fields:[
{label:"Full Name",type:"text"},
{label:"Document Type",type:"document"},
{label:"Country of Use",type:"country"},
{label:"Contact Number",type:"tel"},
{label:"Email Address",type:"email"}
]
},

{
title:"Red Ribbon",
description:"Authentication support for documents, including guidance on purpose and steps.",
fields:[
{label:"Full Name",type:"text"},
{label:"Document Type",type:"document"},
{label:"Purpose of Authentication",type:"text"},
{label:"Contact Number",type:"tel"},
{label:"Email Address",type:"email"}
]
}

] satisfies Service[]

$: filteredServices =
	services
		.map((s, idx) => ({ ...s, idx }))
		.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()))

$: current = services[selectedService]

</script>

<Header />

<main class="min-h-[calc(100vh-80px)] bg-stone-50">
	<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex flex-col gap-1">
			<p class="text-[11px] font-semibold tracking-[0.18em] text-zinc-600 uppercase">Concierge</p>
			<h1 class="font-serif text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
				Services Offered
			</h1>
			<p class="text-sm text-zinc-600 max-w-2xl">
				Pick a service, fill out the form, and we’ll follow up in Support chat with the next steps.
			</p>
		</div>

		<div class="grid gap-5 lg:grid-cols-[360px,1fr]">
			<!-- Sidebar -->
			<aside class="hidden lg:block">
				<div class="rounded-2xl border border-red-900/10 bg-white p-4 shadow-sm">
					<div class="flex items-center gap-3 px-1 pb-3">
						<img src="/aalogo.png" alt="April-Astrid logo" class="h-9 w-9 rounded-full border border-red-900/10" />
						<div class="min-w-0">
							<p class="text-sm font-semibold text-zinc-900">April-Astrid</p>
							<p class="text-xs text-zinc-600">Other services</p>
						</div>
					</div>

					<input
						class="w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
						placeholder="Search services…"
						bind:value={query}
					/>

					<nav class="mt-3 flex flex-col gap-1">
						{#each filteredServices as service (service.title)}
							<button
								type="button"
								class={[
									"rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
									selectedService === service.idx
										? "bg-red-700 text-white shadow-sm"
										: "text-zinc-800 hover:bg-zinc-50",
								].join(" ")}
								on:click={() => (selectedService = service.idx)}
							>
								{service.title}
								<span class={selectedService === service.idx ? "block text-xs font-medium text-red-100/90" : "block text-xs font-medium text-zinc-500"}>
									{service.description}
								</span>
							</button>
						{/each}
					</nav>
				</div>
			</aside>

			<!-- Mobile selector -->
			<div class="lg:hidden">
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
					on:click={() => (menuOpen = !menuOpen)}
				>
					{menuOpen ? 'Close services' : 'Choose a service'}
				</button>

				{#if menuOpen}
					<div class="mt-3 rounded-2xl border border-red-900/10 bg-white p-4 shadow-sm">
						<input
							class="w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
							placeholder="Search services…"
							bind:value={query}
						/>
						<div class="mt-3 flex flex-col gap-1">
							{#each filteredServices as service (service.title)}
								<button
									type="button"
									class={[
										"rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
										selectedService === service.idx
											? "bg-red-700 text-white shadow-sm"
											: "text-zinc-800 hover:bg-zinc-50",
									].join(" ")}
									on:click={() => {
										selectedService = service.idx
										menuOpen = false
									}}
								>
									{service.title}
									<span class={selectedService === service.idx ? "block text-xs font-medium text-red-100/90" : "block text-xs font-medium text-zinc-500"}>
										{service.description}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Main -->
			<section class="rounded-2xl border border-red-900/10 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex flex-col gap-1">
					<p class="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">Request form</p>
					<h2 class="font-serif text-xl font-bold text-zinc-900 sm:text-2xl">{current.title}</h2>
					<p class="text-sm text-zinc-600">{current.description}</p>
				</div>

				{#if submitError}
					<div class="mt-4 rounded-xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
						{submitError}
					</div>
				{/if}

				{#if submitSuccess}
					<div class="mt-4 rounded-xl border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
						<p class="m-0">{submitSuccess}</p>
						<a href="/userchat" class="mt-2 inline-block font-semibold text-emerald-950 underline">Open Customer Support chat →</a>
					</div>
				{/if}

				<form class="mt-5 grid gap-4 sm:grid-cols-2" on:submit|preventDefault={submitForm}>
					{#each current.fields as field (field.label)}
						{@const domId = fieldDomId(selectedService, field.label)}
						<div class={field.label === 'Purpose of Authentication' ? 'sm:col-span-2' : ''}>
							<label class="block text-xs font-semibold text-zinc-700" for={domId}>{field.label}</label>

							{#if field.type === "country"}
								<select
									id={domId}
									class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
									value={formData[field.label] ?? ''}
									on:change={(e) => handleInput(field.label, (e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="" disabled selected={!(formData[field.label] ?? '').trim()}>Select Country</option>
									{#each countries as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							{:else if field.type === "document"}
								<select
									id={domId}
									class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
									value={formData[field.label] ?? ''}
									on:change={(e) => handleInput(field.label, (e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="" disabled selected={!(formData[field.label] ?? '').trim()}>Select Document</option>
									{#each documentTypes as d}
										<option value={d}>{d}</option>
									{/each}
								</select>
							{:else}
								<input
									id={domId}
									class="mt-1 w-full rounded-xl border border-red-900/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-red-700/50 focus:ring-4 focus:ring-red-700/10"
									type={field.type}
									placeholder={`Enter ${field.label}`}
									value={formData[field.label] ?? ''}
									on:input={(e) => handleInput(field.label, (e.currentTarget as HTMLInputElement).value)}
								/>
							{/if}
						</div>
					{/each}

					<div class="sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-xs text-zinc-600">
							Logged in as:
							<span class="font-semibold text-zinc-800">
								{($page.data.user?.email as string | undefined) ?? '—'}
							</span>
						</p>
						<div class="flex gap-2">
							<button
								type="button"
								class="rounded-xl border border-red-900/15 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
								on:click={() => {
									formData = {}
									submitError = ''
									submitSuccess = ''
								}}
								disabled={isSubmitting}
							>
								Clear
							</button>
							<button
								type="submit"
								class="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Submitting…' : 'Submit request'}
							</button>
						</div>
					</div>
				</form>
			</section>
		</div>
	</div>
</main>