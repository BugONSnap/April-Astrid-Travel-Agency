<script lang="ts">
	import { goto } from '$app/navigation';

	type Tab = 'login' | 'register';

	let activeTab: Tab = 'login';

	let showPassword = false;
	let regPassword = '';
	let regConfirmPassword = '';

	$: passwordMismatch =
		regConfirmPassword.length > 0 && regPassword !== regConfirmPassword;

	function login(e: Event) {
		e.preventDefault();
		goto('/dashboard');
	}

	function register(e: Event) {
		e.preventDefault();

		if (!passwordMismatch) {
			goto('/dashboard');
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
					class="flex-1 py-2 font-semibold rounded-l-lg
					{activeTab === 'login'
						? 'bg-red-600 text-white'
						: 'bg-gray-200'}"
					onclick={() => (activeTab = 'login')}
				>
					Login
				</button>

				<button
					class="flex-1 py-2 font-semibold rounded-r-lg
					{activeTab === 'register'
						? 'bg-red-600 text-white'
						: 'bg-gray-200'}"
					onclick={() => (activeTab = 'register')}
				>
					Register
				</button>

			</div>


			<!-- LOGIN -->
			{#if activeTab === 'login'}

				<form class="space-y-4" onsubmit={login}>

					<input
						type="email"
						placeholder="Email"
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
					/>

					<div class="relative">

						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							class="w-full rounded-full bg-gray-200
								   py-3 px-5 outline-none
								   focus:ring-2 focus:ring-red-500"
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
						class="w-full bg-red-600 text-white
							   py-3 rounded-full font-semibold
							   hover:bg-red-700 transition"
					>
						LOG IN
					</button>

				</form>


			<!-- REGISTER -->
			{:else}

				<form class="space-y-4" onsubmit={register}>

					<input
						type="email"
						placeholder="Email"
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
					/>

					<input
						type="password"
						placeholder="Password"
						bind:value={regPassword}
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
					/>

					<input
						type="password"
						placeholder="Confirm Password"
						bind:value={regConfirmPassword}
						class="w-full rounded-full bg-gray-200
							   py-3 px-5 outline-none
							   focus:ring-2 focus:ring-red-500"
					/>

					{#if passwordMismatch}
						<p class="text-sm text-red-600">
							Passwords do not match
						</p>
					{/if}

					<button
						type="submit"
						class="w-full bg-red-600 text-white
							   py-3 rounded-full font-semibold
							   hover:bg-red-700 transition"
					>
						CREATE ACCOUNT
					</button>

				</form>

			{/if}

			<p class="text-center text-xs mt-6 text-gray-500">
				April-Astrid Travel System v1.0
			</p>

		</div>

	</div>

</main>
	
