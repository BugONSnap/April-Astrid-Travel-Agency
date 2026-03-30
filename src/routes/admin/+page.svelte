<script lang="ts">
	import {
		ArcElement,
		BarElement,
		CategoryScale,
		Chart,
		Filler,
		Legend,
		LinearScale,
		LineElement,
		PointElement,
		Tooltip,
	} from "chart.js";
	import type { PageProps } from "./$types";

	Chart.register(
		ArcElement,
		BarElement,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		Tooltip,
		Legend,
		Filler,
	);

	let { data }: PageProps = $props();

	let bookingCanvas = $state<HTMLCanvasElement | null>(null);
	let paymentCanvas = $state<HTMLCanvasElement | null>(null);
	let trendCanvas = $state<HTMLCanvasElement | null>(null);

	/* `bind:this` on $state runs after `onMount`, so charts never mounted. Use $effect after canvases exist. */
	$effect(() => {
		const b = bookingCanvas;
		const p = paymentCanvas;
		const t = trendCanvas;
		const charts = data.charts;
		if (!b || !p || !t) return;

		const brand = "#c41e3a";
		const brandMid = "#991b1b";
		const brandDeep = "#7f1d1d";
		const muted = "#6b7280";
		const grid = "rgba(127, 29, 29, 0.08)";
		const emptyFill = "rgba(148, 163, 184, 0.35)";

		const legend = {
			position: "bottom" as const,
			labels: {
				boxWidth: 10,
				padding: 12,
				font: { size: 11 },
				color: muted,
			},
		};

		const bookingValues = charts.bookingStatus.data;
		const bookingAllZero = bookingValues.every((n) => Number(n) === 0);
		const bookingDisplay = bookingAllZero ? bookingValues.map(() => 1) : bookingValues;
		const bookingColors = bookingAllZero
			? bookingValues.map(() => emptyFill)
			: ["#fca5a5", brand, brandMid, "#374151"];

		const instances: Chart[] = [];

		const payMax = Math.max(1, ...charts.paymentStatus.data.map((n) => Number(n)));
		const trendMax = Math.max(1, ...charts.bookingsTrend.data.map((n) => Number(n)));

		instances.push(
			new Chart(b, {
				type: "doughnut",
				data: {
					labels: charts.bookingStatus.labels,
					datasets: [
						{
							data: bookingDisplay,
							backgroundColor: bookingColors,
							borderWidth: 0,
							hoverOffset: 6,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend,
						tooltip: {
							callbacks: {
								label(ctx) {
									const i = ctx.dataIndex;
									const raw = charts.bookingStatus.data[i] ?? 0;
									const label = charts.bookingStatus.labels[i] ?? "";
									if (bookingAllZero) return `${label}: 0`;
									return `${label}: ${raw}`;
								},
							},
						},
					},
				},
			}),
		);

		instances.push(
			new Chart(p, {
				type: "bar",
				data: {
					labels: charts.paymentStatus.labels,
					datasets: [
						{
							label: "Payments",
							data: charts.paymentStatus.data,
							backgroundColor: [brandMid, brand],
							borderRadius: 6,
							borderSkipped: false,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						x: {
							grid: { display: false },
							ticks: { color: muted, font: { size: 11 } },
						},
						y: {
							beginAtZero: true,
							suggestedMax: payMax,
							grid: { color: grid },
							ticks: {
								color: muted,
								font: { size: 11 },
								precision: 0,
							},
						},
					},
				},
			}),
		);

		instances.push(
			new Chart(t, {
				type: "line",
				data: {
					labels: charts.bookingsTrend.labels,
					datasets: [
						{
							label: "New bookings",
							data: charts.bookingsTrend.data,
							borderColor: brand,
							backgroundColor: "rgba(196, 30, 58, 0.12)",
							tension: 0.35,
							fill: true,
							pointBackgroundColor: brandDeep,
							pointBorderColor: "#fff",
							pointBorderWidth: 2,
							pointRadius: 4,
							spanGaps: true,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend },
					scales: {
						x: {
							grid: { display: false },
							ticks: { color: muted, font: { size: 11 } },
						},
						y: {
							beginAtZero: true,
							suggestedMax: trendMax,
							grid: { color: grid },
							ticks: {
								color: muted,
								font: { size: 11 },
								precision: 0,
							},
						},
					},
				},
			}),
		);

		queueMicrotask(() => {
			for (const c of instances) {
				try {
					c.resize();
				} catch {
					/* ignore */
				}
			}
		});

		return () => {
			for (const c of instances) c.destroy();
		};
	});

	const statCards = $derived([
		{
			key: "users",
			label: "Customers",
			caption: "Registered users",
			value: data.stats.users,
			accent: "rose" as const,
		},
		{
			key: "admins",
			label: "Admin seats",
			caption: "Admin accounts",
			value: data.stats.admins,
			accent: "slate" as const,
		},
		{
			key: "destinations",
			label: "Destinations",
			caption: "Regions & cities",
			value: data.stats.destinations,
			accent: "emerald" as const, 
		},
		{
			key: "packages",
			label: "Packages",
			caption: "Published trips",
			value: data.stats.packages,
			accent: "sky" as const,
		},
		{
			key: "bookings",
			label: "Bookings",
			caption: "All reservations",
			value: data.stats.bookings,
			accent: "amber" as const,
		},
		{
			key: "payments",
			label: "Payments",
			caption: "Payment records",
			value: data.stats.payments,
			accent: "violet" as const,
		},
	]);

	const quickLinks = $derived([
		{
			href: "/admin/users",
			title: "Users",
			body: "Accounts, roles, and profile data.",
			tag: "CRUD",
		},
		{
			href: "/admin/destinations",
			title: "Destinations",
			body: "Countries, cities, and cover media.",
			tag: "CRUD",
		},
		{
			href: "/admin/packages",
			title: "Packages",
			body: "Pricing, categories, gallery links.",
			tag: "CRUD",
		},
		{
			href: "/admin/bookings",
			title: "Bookings",
			body: "Status, travel dates, headcount.",
			tag: "Ops",
		},
		{
			href: "/admin/payments",
			title: "Payments",
			body: "Amounts, methods, references.",
			tag: "Finance",
		},
		{
			href: "/admin/adminchat",
			title: "Support inbox",
			body: "Reply to customer conversations.",
			tag: "Chat",
		},
	]);

	function formatCount(n: number | string): string {
		const num = typeof n === "string" ? Number(n) : n;
		if (Number.isNaN(num)) return String(n);
		return num.toLocaleString();
	}

	function todayLabel(): string {
		return new Intl.DateTimeFormat("en-PH", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		}).format(new Date());
	}
</script>

<svelte:head>
	<title>Admin · Dashboard</title>
</svelte:head>

<div class="dashboard">
	<header class="dashboard-header">
		<div class="dashboard-header-text">
			<p class="dashboard-kicker">Operations overview</p>
			<h1 class="dashboard-title">Dashboard</h1>
			<p class="dashboard-subtitle">{todayLabel()}</p>
		</div>
		<div class="dashboard-header-meta">
			<span class="dashboard-pill">Live data</span>
			<span class="dashboard-pill dashboard-pill-muted">Agency CMS</span>
		</div>
	</header>

	<section class="dashboard-stats" aria-label="Key metrics">
		{#each statCards as s (s.key)}
			<div class={`stat-card stat-card-${s.accent}`}>
				<div class="stat-card-top">
					<span class="stat-label">{s.label}</span>
					<span class="stat-caption">{s.caption}</span>
				</div>
				<p class="stat-value" aria-live="polite">{formatCount(s.value)}</p>
			</div>
		{/each}
	</section>

	<section class="dashboard-section dashboard-charts-wrap" aria-labelledby="charts-heading">
		<div class="section-head">
			<h2 id="charts-heading" class="section-title">Insights</h2>
			<p class="section-hint">Live booking mix, payment records, and the last {data.charts.bookingsTrend.labels.length} days of new bookings</p>
		</div>
		<div class="charts-grid">
			<div class="chart-card">
				<h3 class="chart-card-title">Bookings by status</h3>
				<div class="chart-canvas-wrap">
					<canvas bind:this={bookingCanvas} aria-label="Doughnut chart of booking counts by status"></canvas>
				</div>
			</div>
			<div class="chart-card">
				<h3 class="chart-card-title">Payments by status</h3>
				<div class="chart-canvas-wrap">
					<canvas bind:this={paymentCanvas} aria-label="Bar chart of payment counts by status"></canvas>
				</div>
			</div>
			<div class="chart-card chart-card--wide">
				<h3 class="chart-card-title">New bookings (daily)</h3>
				<div class="chart-canvas-wrap chart-canvas-wrap--trend">
					<canvas bind:this={trendCanvas} aria-label="Line chart of new bookings per day"></canvas>
				</div>
			</div>
		</div>
	</section>

	<section class="dashboard-spotlight" aria-label="Support">
		<div class="spotlight-copy">
			<p class="spotlight-kicker">Messaging</p>
			<h2 class="spotlight-title">Admin chat</h2>
			<p class="spotlight-desc">
				<strong class="tabular">{formatCount(data.stats.conversationsOpen)}</strong> open threads ·
				<strong class="tabular">{formatCount(data.stats.unreadMessages)}</strong> unread
			</p>
		</div>
		<a href="/admin/adminchat" class="spotlight-cta">
			Open inbox
			<svg class="spotlight-cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M5 12h14M13 5l7 7-7 7" />
			</svg>
		</a>
	</section>

	<section class="dashboard-section" aria-labelledby="quick-links-heading">
		<div class="section-head">
			<h2 id="quick-links-heading" class="section-title">Quick actions</h2>
			<p class="section-hint">Jump to management tools</p>
		</div>
		<div class="quick-grid">
			{#each quickLinks as link (link.href)}
				<a href={link.href} class="quick-card">
					<div class="quick-card-top">
						<span class="quick-title">{link.title}</span>
						<span class="quick-tag">{link.tag}</span>
					</div>
					<p class="quick-body">{link.body}</p>
					<span class="quick-arrow" aria-hidden="true">→</span>
				</a>
			{/each}
		</div>
	</section>
</div>

<style>
	.dashboard {
		--dash-bg: #fafaf9;
		--dash-ink: #111827;
		--dash-muted: #52525b;
		--dash-border: rgba(127, 29, 29, 0.12);
		--dash-accent: #c41e3a;
		--dash-brand-deep: #7f1d1d;
		--radius: 1rem;
		--radius-sm: 0.75rem;
		max-width: 100%;
	}

	.dashboard-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.75rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--dash-border);
	}

	@media (min-width: 640px) {
		.dashboard-header {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.dashboard-kicker {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--dash-muted);
		margin: 0 0 0.35rem;
	}

	.dashboard-title {
		font-family: Georgia, "Times New Roman", serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--dash-ink);
		margin: 0;
		line-height: 1.15;
	}

	.dashboard-subtitle {
		margin: 0.35rem 0 0;
		font-size: 0.9375rem;
		color: var(--dash-muted);
	}

	.dashboard-header-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.dashboard-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--dash-accent);
		color: #fff;
	}

	.dashboard-pill-muted {
		background: rgba(196, 30, 58, 0.12);
		color: var(--dash-brand-deep);
	}

	/* Stats: 1 col phone · 2 col tablet · 3 col desktop */
	.dashboard-stats {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.875rem;
		margin-bottom: 1.25rem;
	}

	@media (min-width: 640px) {
		.dashboard-stats {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}
	}

	@media (min-width: 1024px) {
		.dashboard-stats {
			grid-template-columns: repeat(3, 1fr);
			gap: 1.125rem;
		}
	}

	.stat-card {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius);
		padding: 1.125rem 1.25rem;
		background: #fff;
		border: 1px solid var(--dash-border);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		transition: box-shadow 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
	}

	@media (hover: hover) {
		.stat-card:hover {
			box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
			border-color: rgba(24, 24, 27, 0.12);
			transform: translateY(-1px);
		}
	}

	.stat-card::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: var(--radius) 0 0 var(--radius);
		opacity: 0.92;
	}

	.stat-card-rose::before {
		background: var(--dash-accent);
	}
	.stat-card-slate::before {
		background: var(--dash-brand-deep);
	}
	.stat-card-emerald::before {
		background: #059669;
	}
	.stat-card-sky::before {
		background: #0284c7;
	}
	.stat-card-amber::before {
		background: #d97706;
	}
	.stat-card-violet::before {
		background: #7c3aed;
	}

	.stat-card-top {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dash-ink);
	}

	.stat-caption {
		font-size: 0.75rem;
		color: var(--dash-muted);
	}

	.stat-value {
		margin: 0.75rem 0 0;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		color: var(--dash-ink);
		line-height: 1.1;
	}

	.tabular {
		font-variant-numeric: tabular-nums;
	}

	.dashboard-spotlight {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		align-items: stretch;
		margin-bottom: 2rem;
		padding: 1.25rem 1.35rem;
		border-radius: var(--radius);
		background: linear-gradient(135deg, #c41e3a 0%, #991b1b 45%, #7f1d1d 100%);
		color: #fef2f2;
		border: 1px solid rgba(127, 29, 29, 0.35);
		box-shadow: 0 16px 40px rgba(127, 29, 29, 0.22);
	}

	@media (min-width: 640px) {
		.dashboard-spotlight {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 1.5rem 1.75rem;
		}
	}

	.spotlight-kicker {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.72);
		margin: 0 0 0.35rem;
	}

	.spotlight-title {
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.spotlight-desc {
		margin: 0.5rem 0 0;
		font-size: 0.9375rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.45;
	}

	.spotlight-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-shrink: 0;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 600;
		background: #fff;
		color: var(--dash-brand-deep);
		text-decoration: none;
		transition: background 0.15s ease, transform 0.15s ease;
	}

	.spotlight-cta:hover {
		background: #fef2f2;
	}

	.spotlight-cta:focus-visible {
		outline: 2px solid var(--dash-accent);
		outline-offset: 2px;
	}

	.spotlight-cta-icon {
		flex-shrink: 0;
	}

	.dashboard-section {
		margin-top: 0.25rem;
	}

	.dashboard-charts-wrap {
		margin-bottom: 2rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 900px) {
		.charts-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.chart-card--wide {
			grid-column: 1 / -1;
		}
	}

	.chart-card {
		background: #fff;
		border: 1px solid var(--dash-border);
		border-radius: var(--radius);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		padding: 1rem 1.15rem 0.85rem;
	}

	.chart-card-title {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 700;
		font-family: Georgia, "Times New Roman", serif;
		color: var(--dash-ink);
		letter-spacing: -0.01em;
	}

	.chart-canvas-wrap {
		position: relative;
		height: 220px;
		width: 100%;
		min-height: 180px;
	}

	.chart-canvas-wrap--trend {
		height: 260px;
		min-height: 200px;
	}

	.chart-canvas-wrap canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.section-head {
		margin-bottom: 1rem;
	}

	.section-title {
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--dash-ink);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.section-hint {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--dash-muted);
	}

	/* Quick links: 1 col · 2 col tablet · 3 col desktop */
	.quick-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.875rem;
	}

	@media (min-width: 640px) {
		.quick-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}
	}

	@media (min-width: 1024px) {
		.quick-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.quick-card {
		position: relative;
		display: block;
		padding: 1.125rem 1.25rem 1.35rem;
		border-radius: var(--radius);
		background: #fff;
		border: 1px solid var(--dash-border);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
	}

	@media (hover: hover) {
		.quick-card:hover {
			box-shadow: 0 14px 32px rgba(0, 0, 0, 0.07);
			border-color: rgba(196, 30, 58, 0.22);
			transform: translateY(-2px);
		}
	}

	.quick-card:focus-visible {
		outline: 2px solid var(--dash-accent);
		outline-offset: 2px;
	}

	.quick-card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.quick-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--dash-ink);
	}

	.quick-tag {
		flex-shrink: 0;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.45rem;
		border-radius: 4px;
		background: #f4f4f5;
		color: #52525b;
	}

	.quick-body {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--dash-muted);
		padding-right: 1.5rem;
	}

	.quick-arrow {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		font-size: 1.125rem;
		color: var(--dash-accent);
		font-weight: 600;
		opacity: 0.85;
	}
</style>
