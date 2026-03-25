<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Admin Dashboard</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Users</div>
			<div class="text-3xl font-semibold">{data.stats.users}</div>
		</div>
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Admin accounts</div>
			<div class="text-3xl font-semibold">{data.stats.admins}</div>
		</div>
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Destinations</div>
			<div class="text-3xl font-semibold">{data.stats.destinations}</div>
		</div>
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Packages</div>
			<div class="text-3xl font-semibold">{data.stats.packages}</div>
		</div>
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Bookings</div>
			<div class="text-3xl font-semibold">{data.stats.bookings}</div>
		</div>
		<div class="bg-white rounded-lg border p-4">
			<div class="text-sm text-gray-600">Payments</div>
			<div class="text-3xl font-semibold">{data.stats.payments}</div>
		</div>
	</div>

	<div class="bg-white rounded-lg border p-4">
		<div class="flex items-center justify-between gap-4">
			<div>
				<div class="text-sm text-gray-600">Admin Chat</div>
				<div class="text-2xl font-semibold">{data.stats.conversationsOpen} open</div>
				<div class="text-sm text-gray-600 mt-1">{data.stats.unreadMessages} unread messages</div>
			</div>
			<a href="/admin/adminchat" class="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90">
				Go to Admin Chat
			</a>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<a href="/admin/users" class="block bg-white rounded-lg border p-4 hover:bg-gray-50">
			<div class="font-semibold">Manage Users</div>
			<div class="text-sm text-gray-600">Create, update, delete accounts.</div>
		</a>
		<a href="/admin/packages" class="block bg-white rounded-lg border p-4 hover:bg-gray-50">
			<div class="font-semibold">Manage Packages</div>
			<div class="text-sm text-gray-600">Packages + images, categories, status.</div>
		</a>
		<a href="/admin/destinations" class="block bg-white rounded-lg border p-4 hover:bg-gray-50">
			<div class="font-semibold">Manage Destinations</div>
			<div class="text-sm text-gray-600">Add/update country and city data.</div>
		</a>
		<a href="/admin/bookings" class="block bg-white rounded-lg border p-4 hover:bg-gray-50">
			<div class="font-semibold">Manage Bookings</div>
			<div class="text-sm text-gray-600">Update booking and payment status.</div>
		</a>
	</div>
</div>