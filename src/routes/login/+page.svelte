<script lang="ts">
	import { goto } from '$app/navigation';

	type Tab = 'login' | 'register';

	let activeTab: Tab = 'login';

	let showPassword = false;
	let regPassword = '';
	let regConfirmPassword = '';

	let loginEmail = '';
	let loginPassword = '';

	let regEmail = '';
	let regFirstName = '';
	let regLastName = '';

	let formError = '';
	let submitting = false;

	$: passwordMismatch =
		regConfirmPassword.length > 0 && regPassword !== regConfirmPassword;

	async function login(e: Event) {
		e.preventDefault();
		formError = '';
		submitting = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: loginEmail,
					password: loginPassword
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				formError = typeof data.message === 'string' ? data.message : 'Login failed';
				return;
			}
			await goto('/dashboard');
		} finally {
			submitting = false;
		}
	}

	async function register(e: Event) {
		e.preventDefault();
		formError = '';
		if (passwordMismatch) return;

		submitting = true;
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: regEmail,
					password: regPassword,
					first_name: regFirstName,
					last_name: regLastName
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				formError =
					typeof data.message === 'string' ? data.message : 'Registration failed';
				return;
			}
			await goto('/dashboard');
		} finally {
			submitting = false;
		}
	}
</script>

<main class="min-h-screen flex flex-col md:flex-row">

	<!-- BRAND SECTION -->
	<div
		class="bg-red-600 flex flex-col items-center justify-center
		       h-60 md:h-auto md:w-1/2 text-white p-6"
	>

		<img
			src="/aalogo.png"
			alt="April Astrid Travel Agency"
			class="w-32 md:w-44 rounded-full border-4 border-white"
		/>

		<h1 class="mt-4 text-xl md:text-2xl font-bold text-center">
			April-Astrid Travel Agency
		</h1>

		<p class="text-sm opacity-80 text-center mt-2">
			Travel Management System
		</p>

	</div>


	<!-- LOGIN CARD -->
	<div class="flex items-center justify-center flex-1 bg-gray-100">

		<div
			class="bg-white w-full max-w-sm
			       rounded-t-3xl md:rounded-3xl
			       p-8 shadow-xl"
		>

			<!-- TABS -->
			<div class="flex mb-6">

				<button
					type="button"
					class="flex-1 py-2 font-semibold rounded-l-lg
					{activeTab === 'login'
						? 'bg-red-600 text-white'
						: 'bg-gray-200'}"
					onclick={() => {
						activeTab = 'login';
						formError = '';
					}}
				>
					Login
				</button>

				<button
					type="button"
					class="flex-1 py-2 font-semibold rounded-r-lg
					{activeTab === 'register'
						? 'bg-red-600 text-white'
						: 'bg-gray-200'}"
					onclick={() => {
						activeTab = 'register';
						formError = '';
					}}
				>
					Register
				</button>

			</div>

			{#if formError}
				<p class="text-sm text-red-600 mb-4" role="alert">
					{formError}
				</p>
			{/if}

			<!-- LOGIN -->
			{#if activeTab === 'login'}

				<form class="space-y-4" onsubmit={login}>

					<input
						type="email"
						placeholder="Email"
						autocomplete="email"
						bind:value={loginEmail}
						required
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500
							   disabled:opacity-50"
						disabled={submitting}
					/>

					<div class="relative">

						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							autocomplete="current-password"
							bind:value={loginPassword}
							required
							class="w-full rounded-full bg-gray-200
								   py-3 px-5 outline-none
								   focus:ring-2 focus:ring-red-500"
							disabled={submitting}
						/>

						<button
							type="button"
							class="absolute right-4 top-3 text-sm text-gray-600"
							onclick={() => (showPassword = !showPassword)}
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>

					</div>

					<button
						type="submit"
						disabled={submitting}
						class="w-full bg-red-600 text-white
							   py-3 rounded-full font-semibold
							   hover:bg-red-700 transition
							   disabled:opacity-50"
					>
						{submitting ? 'Please wait…' : 'LOG IN'}
					</button>

				</form>


			<!-- REGISTER -->
			{:else}

				<form class="space-y-4" onsubmit={register}>

					<input
						type="text"
						placeholder="First name"
						autocomplete="given-name"
						bind:value={regFirstName}
						required
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
						disabled={submitting}
					/>

					<input
						type="text"
						placeholder="Last name"
						autocomplete="family-name"
						bind:value={regLastName}
						required
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
						disabled={submitting}
					/>

					<input
						type="email"
						placeholder="Email"
						autocomplete="email"
						bind:value={regEmail}
						required
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
						disabled={submitting}
					/>

					<input
						type="password"
						placeholder="Password"
						autocomplete="new-password"
						bind:value={regPassword}
						required
						minlength="8"
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
						disabled={submitting}
					/>

					<input
						type="password"
						placeholder="Confirm Password"
						autocomplete="new-password"
						bind:value={regConfirmPassword}
						required
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
						disabled={submitting}
					/>

					{#if passwordMismatch}
						<p class="text-sm text-red-600">
							Passwords do not match
						</p>
					{/if}

					<button
						type="submit"
						disabled={submitting || passwordMismatch}
						class="w-full bg-red-600 text-white
							   py-3 rounded-full font-semibold
							   hover:bg-red-700 transition
							   disabled:opacity-50"
					>
						{submitting ? 'Please wait…' : 'CREATE ACCOUNT'}
					</button>

				</form>

			{/if}

			<p class="text-center text-xs mt-6 text-gray-500">
				April-Astrid Travel System v1.0
			</p>

		</div>

	</div>

</main>
