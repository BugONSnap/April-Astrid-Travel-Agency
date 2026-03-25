<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Manage Users</h1>
		<a href="/admin" class="text-sm text-gray-600 hover:underline">Back to dashboard</a>
	</div>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Create user</h2>
		<form method="post" action="?/createUser" class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<input name="first_name" placeholder="First name" class="input" required />
			<input name="middle_name" placeholder="Middle name (optional)" class="input" />
			<input name="last_name" placeholder="Last name" class="input" required />
			<input name="email" placeholder="Email" type="email" class="input" required />
			<input name="password" placeholder="Password" type="password" class="input" required />

			<select name="role" class="input" required>
				{#each data.roles as r}
					<option value={r}>{r}</option>
				{/each}
			</select>

			<select name="employment_status" class="input">
				<option value="">—</option>
				{#each data.employmentStatuses as s}
					<option value={s}>{s}</option>
				{/each}
			</select>

			<input name="age" placeholder="Age (optional)" type="number" class="input" />
			<input name="contact_number" placeholder="Contact number (optional)" class="input" />
			<input name="birthdate" placeholder="Birthdate (YYYY-MM-DD)" type="date" class="input" />
			<input name="gender" placeholder="Gender (optional)" class="input" />
			<input name="nationality" placeholder="Nationality (optional)" class="input" />
			<input name="civil_status" placeholder="Civil status (optional)" class="input" />
			<input name="home_address" placeholder="Home address (optional)" class="input md:col-span-2" />
			<input name="profile_picture" placeholder="Profile picture URL (optional)" class="input md:col-span-2" />

			<div class="md:col-span-2 flex justify-end">
				<button type="submit" class="btn-primary">Create</button>
			</div>
		</form>
	</section>

	<section class="bg-white border rounded-lg p-4">
		<h2 class="font-semibold mb-3">Existing users</h2>
		<div class="overflow-x-auto">
			<table class="min-w-[880px] w-full text-sm">
				<thead>
					<tr class="text-left border-b">
						<th class="p-2">ID</th>
						<th class="p-2">Name</th>
						<th class="p-2">Email</th>
						<th class="p-2">Role</th>
						<th class="p-2">Update (quick)</th>
						<th class="p-2">Delete</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as u}
						<tr class="border-b align-top">
							<td class="p-2">{u.user_id}</td>
							<td class="p-2">
								{u.first_name} {u.last_name}
							</td>
							<td class="p-2">{u.email}</td>
							<td class="p-2">{u.role}</td>
							<td class="p-2">
								<form method="post" action="?/updateUser" class="space-y-2">
									<input type="hidden" name="user_id" value={u.user_id} />
									<input
										name="first_name"
										class="input w-full"
										value={u.first_name}
										required
									/>
									<input
										name="last_name"
										class="input w-full"
										value={u.last_name}
										required
									/>
									<input name="email" class="input w-full" value={u.email} type="email" required />

									<select name="role" class="input w-full">
										{#each data.roles as r}
											<option value={r} selected={u.role === r}>
												{r}
											</option>
										{/each}
									</select>

									<select name="employment_status" class="input w-full">
										<option value="">—</option>
										{#each data.employmentStatuses as s}
											<option
												value={s}
												selected={u.employment_status === s}
											>
												{s}
											</option>
										{/each}
									</select>

									<input
										name="contact_number"
										class="input w-full"
										placeholder="Contact (optional)"
									/>
									<input name="home_address" class="input w-full" placeholder="Address (optional)" />
									<input
										name="password"
										class="input w-full"
										placeholder="New password (optional)"
										type="password"
									/>

									<button type="submit" class="btn-secondary w-full">Update</button>
								</form>
							</td>
							<td class="p-2">
								<form method="post" action="?/deleteUser">
									<input type="hidden" name="user_id" value={u.user_id} />
									<button type="submit" class="btn-danger w-full" onclick="return confirm('Delete this user?')">
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<style>
	.input {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 10px;
		background: #fff;
	}

	.btn-primary {
		background: #000;
		color: #fff;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #111827;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
		border: 1px solid #e5e7eb;
	}

	.btn-danger {
		background: #fee2e2;
		color: #991b1b;
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 700;
		border: 1px solid #fecaca;
	}
</style>

