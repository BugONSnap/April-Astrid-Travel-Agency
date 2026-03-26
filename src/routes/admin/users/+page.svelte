<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	type UserRow = (typeof data.users)[number];

	let editOpen = $state(false);
	let editDraft = $state({
		user_id: 0,
		first_name: "",
		last_name: "",
		email: "",
		role: "USER" as UserRow["role"],
		employment_status: "",
		contact_number: "",
		home_address: "",
		password: "",
	});

	function openEdit(u: UserRow) {
		editDraft = {
			user_id: u.user_id,
			first_name: u.first_name,
			last_name: u.last_name,
			email: u.email,
			role: u.role,
			employment_status: u.employment_status ?? "",
			contact_number: u.contact_number ?? "",
			home_address: u.home_address ?? "",
			password: "",
		};
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeEdit();
	}
</script>

<svelte:head>
	<title>Admin · Users</title>
</svelte:head>

<div class="ap-page ap-stack">
	<header class="ap-page-head">
		<div>
			<p class="ap-kicker">Directory</p>
			<h1 class="ap-title">Users</h1>
			<p class="ap-sub">
				Compact roster below — use <strong>Edit</strong> for changes. On phones, each user appears as a stacked card.
			</p>
		</div>
		<a href="/admin" class="ap-back">← Dashboard</a>
	</header>

	<section class="ap-card" aria-labelledby="create-user-heading">
		<h2 id="create-user-heading" class="ap-card-title">Create user</h2>
		<p class="ap-hint">New accounts receive a bcrypt-hashed password stored in the database.</p>
		<form method="post" action="?/createUser" class="ap-form-grid">
			<div class="ap-field">
				<label class="ap-label" for="cu-first">First name</label>
				<input id="cu-first" name="first_name" class="ap-input" placeholder="First name" required />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-middle">Middle name</label>
				<input id="cu-middle" name="middle_name" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-last">Last name</label>
				<input id="cu-last" name="last_name" class="ap-input" placeholder="Last name" required />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-email">Email</label>
				<input id="cu-email" name="email" type="email" class="ap-input" placeholder="email@example.com" required />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-pass">Password</label>
				<input id="cu-pass" name="password" type="password" class="ap-input" placeholder="Min 8 characters" required />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-role">Role</label>
				<select id="cu-role" name="role" class="ap-select" required>
					{#each data.roles as r}
						<option value={r}>{r}</option>
					{/each}
				</select>
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-emp">Employment</label>
				<select id="cu-emp" name="employment_status" class="ap-select">
					<option value="">—</option>
					{#each data.employmentStatuses as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-age">Age</label>
				<input id="cu-age" name="age" type="number" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-phone">Contact</label>
				<input id="cu-phone" name="contact_number" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-birth">Birthdate</label>
				<input id="cu-birth" name="birthdate" type="date" class="ap-input" />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-gender">Gender</label>
				<input id="cu-gender" name="gender" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field ap-span-2">
				<label class="ap-label" for="cu-nationality">Nationality</label>
				<input id="cu-nationality" name="nationality" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field">
				<label class="ap-label" for="cu-civil">Civil status</label>
				<input id="cu-civil" name="civil_status" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field ap-span-2">
				<label class="ap-label" for="cu-address">Home address</label>
				<input id="cu-address" name="home_address" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-field ap-span-2">
				<label class="ap-label" for="cu-photo">Profile picture URL</label>
				<input id="cu-photo" name="profile_picture" class="ap-input" placeholder="Optional" />
			</div>
			<div class="ap-form-actions ap-span-2">
				<button type="submit" class="ap-btn ap-btn--primary">Create user</button>
			</div>
		</form>
	</section>

	<section class="ap-card" aria-labelledby="user-list-heading">
		<h2 id="user-list-heading" class="ap-card-title">All users</h2>
		{#if data.users.length === 0}
			<p class="ap-empty">No users in the database yet.</p>
		{:else}
			<div class="ap-table-wrap users-table-wrap">
				<table class="ap-table users-table">
					<thead>
						<tr>
							<th class="users-col-id">ID</th>
							<th>Name</th>
							<th class="users-col-email">Email</th>
							<th class="users-col-emp">Work</th>
							<th>Role</th>
							<th class="users-col-actions">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.users as u}
							<tr>
								<td class="users-col-id" data-label="ID"><span class="ap-muted mono">#{u.user_id}</span></td>
								<td data-label="NAME">
									<div class="users-name">{u.first_name} {u.last_name}</div>
								</td>
								<td class="users-col-email users-ellipsis" data-label="EMAIL" title={u.email}>{u.email}</td>
								<td class="users-col-emp users-ellipsis" data-label="WORK" title={u.employment_status ?? ""}>
									{u.employment_status ?? "—"}
								</td>
								<td data-label="ROLE"><span class="ap-badge">{u.role}</span></td>
								<td class="users-col-actions" data-label="ACTION">
									<div class="users-actions">
										<button type="button" class="ap-btn ap-btn--secondary ap-btn--sm" onclick={() => openEdit(u)}>
											Edit
										</button>
										<form method="post" action="?/deleteUser" class="users-inline-form">
											<input type="hidden" name="user_id" value={u.user_id} />
											<button
												type="submit"
												class="ap-btn ap-btn--danger ap-btn--sm"
												onclick={(fe) => {
													if (!confirm("Delete this user? This may fail if related data exists.")) {
														fe.preventDefault();
													}
												}}
											>
												Delete
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

{#if editOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="users-overlay" onclick={onBackdropClick} role="presentation">
		<div
			class="users-sheet"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="edit-user-title"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="users-sheet-head">
				<h2 id="edit-user-title" class="users-sheet-title">Edit user</h2>
				<button type="button" class="users-sheet-close" onclick={closeEdit} aria-label="Close">×</button>
			</div>
			<p class="users-sheet-sub">#{editDraft.user_id} — changes save to the server on submit.</p>

			<form method="post" action="?/updateUser" class="ap-form-grid">
				<input type="hidden" name="user_id" value={editDraft.user_id} />
				<div class="ap-field">
					<label class="ap-label" for="ed-first">First name</label>
					<input id="ed-first" name="first_name" class="ap-input" bind:value={editDraft.first_name} required />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="ed-last">Last name</label>
					<input id="ed-last" name="last_name" class="ap-input" bind:value={editDraft.last_name} required />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="ed-email">Email</label>
					<input id="ed-email" name="email" type="email" class="ap-input" bind:value={editDraft.email} required />
				</div>
				<div class="ap-field">
					<label class="ap-label" for="ed-role">Role</label>
					<select id="ed-role" name="role" class="ap-select" bind:value={editDraft.role}>
						{#each data.roles as r}
							<option value={r}>{r}</option>
						{/each}
					</select>
				</div>
				<div class="ap-field">
					<label class="ap-label" for="ed-emp">Employment</label>
					<select id="ed-emp" name="employment_status" class="ap-select" bind:value={editDraft.employment_status}>
						<option value="">—</option>
						{#each data.employmentStatuses as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="ed-phone">Contact</label>
					<input id="ed-phone" name="contact_number" class="ap-input" bind:value={editDraft.contact_number} />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="ed-addr">Home address</label>
					<input id="ed-addr" name="home_address" class="ap-input" bind:value={editDraft.home_address} />
				</div>
				<div class="ap-field ap-span-2">
					<label class="ap-label" for="ed-pw">New password</label>
					<input
						id="ed-pw"
						name="password"
						type="password"
						class="ap-input"
						bind:value={editDraft.password}
						placeholder="Leave blank to keep current"
						autocomplete="new-password"
					/>
				</div>
				<div class="ap-form-actions ap-span-2 users-sheet-actions">
					<button type="button" class="ap-btn ap-btn--secondary" onclick={closeEdit}>Cancel</button>
					<button type="submit" class="ap-btn ap-btn--primary">Save changes</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Desktop / tablet: table; mobile: stacked “label / value” cards */
	:global(.admin-main .users-table-wrap) {
		margin: 0 -0.15rem;
	}

	:global(.admin-main .users-table) {
		min-width: 36rem;
	}

	@media (min-width: 768px) {
		:global(.admin-main .users-table) {
			min-width: 100%;
		}
	}

	:global(.admin-main .users-table td) {
		vertical-align: middle;
		padding-top: 0.55rem;
		padding-bottom: 0.55rem;
	}

	:global(.admin-main .users-col-id) {
		width: 3.25rem;
		white-space: nowrap;
	}

	:global(.admin-main .users-col-email) {
		max-width: 14rem;
	}

	:global(.admin-main .users-col-emp) {
		max-width: 8rem;
	}

	:global(.admin-main .users-col-actions) {
		width: 1%;
		white-space: nowrap;
	}

	@media (max-width: 767px) {
		:global(.admin-main .users-table-wrap) {
			overflow-x: visible;
			margin: 0;
			padding: 0;
		}

		:global(.admin-main .users-table) {
			min-width: 0 !important;
			width: 100%;
			border-collapse: separate;
			border-spacing: 0;
			display: block;
		}

		:global(.admin-main .users-table thead) {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			border: 0;
			white-space: nowrap;
		}

		:global(.admin-main .users-table tbody) {
			display: block;
		}

		:global(.admin-main .users-table tr) {
			display: block;
			border: 1px solid var(--ap-border, rgba(24, 24, 27, 0.09));
			border-radius: var(--ap-radius-sm, 0.75rem);
			margin-bottom: 0.75rem;
			padding: 0.65rem 1rem 0.85rem;
			background: #fff;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		}

		:global(.admin-main .users-table tr:last-child) {
			margin-bottom: 0;
		}

		:global(.admin-main .users-table td) {
			display: grid;
			grid-template-columns: 5.5rem minmax(0, 1fr);
			gap: 0.2rem 0.65rem;
			align-items: start;
			padding: 0.5rem 0 !important;
			border: none !important;
			width: 100% !important;
			max-width: none !important;
			white-space: normal !important;
		}

		:global(.admin-main .users-table td:not(:last-child)) {
			border-bottom: 1px solid var(--ap-border, rgba(24, 24, 27, 0.08)) !important;
		}

		:global(.admin-main .users-table td::before) {
			content: attr(data-label);
			font-size: 0.625rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: var(--ap-muted, #52525b);
			padding-top: 0.2rem;
		}

		:global(.admin-main .users-table .users-ellipsis) {
			overflow: visible;
			text-overflow: unset;
			white-space: normal;
			word-break: break-word;
		}

		:global(.admin-main .users-table .users-actions) {
			justify-content: flex-start;
			flex-wrap: wrap;
		}

		:global(.admin-main .users-table .users-col-actions) {
			white-space: normal;
		}
	}

	:global(.admin-main .users-name) {
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.3;
	}

	:global(.admin-main .users-ellipsis) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	:global(.admin-main .mono) {
		font-variant-numeric: tabular-nums;
	}

	:global(.admin-main .users-actions) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		justify-content: flex-end;
	}

	:global(.admin-main .users-inline-form) {
		display: contents;
		margin: 0;
	}

	/* Modal / sheet */
	.users-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0;
		box-sizing: border-box;
	}

	@media (min-width: 640px) {
		.users-overlay {
			align-items: center;
			padding: 1rem;
		}
	}

	.users-sheet {
		width: 100%;
		max-width: 32rem;
		max-height: min(92vh, 640px);
		overflow-y: auto;
		background: #fff;
		border-radius: 1rem 1rem 0 0;
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.18);
		padding: 1.15rem 1.25rem 1.35rem;
		box-sizing: border-box;
	}

	@media (min-width: 640px) {
		.users-sheet {
			border-radius: 1rem;
			max-height: 90vh;
			box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
		}
	}

	.users-sheet-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.35rem;
	}

	.users-sheet-title {
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: #0a0a0a;
	}

	.users-sheet-sub {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: #52525b;
	}

	.users-sheet-close {
		appearance: none;
		border: none;
		background: #f4f4f5;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		font-size: 1.35rem;
		line-height: 1;
		cursor: pointer;
		color: #3f3f46;
		flex-shrink: 0;
	}

	.users-sheet-close:hover {
		background: #e4e4e7;
	}

	.users-sheet-actions {
		justify-content: flex-end !important;
	}
</style>
