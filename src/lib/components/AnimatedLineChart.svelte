<script lang="ts">
	type Series = {
		id: string;
		label: string;
		color: string;
		data: number[];
	};

	type Props = {
		title: string;
		subtitle?: string;
		xLabels: string[];
		series: Series[];
		yMax?: number;
		height?: number;
	};

	let {
		title,
		subtitle = "",
		xLabels,
		series,
		yMax,
		height = 220,
	}: Props = $props();

	const vbW = 529;
	const vbH = 286;
	const padL = 52;
	const padR = 18;
	const padT = 14;
	const padB = 34;
	const gridLines = 9;

	const plotW = vbW - padL - padR;
	const plotH = vbH - padT - padB;

	const safeSeries = $derived(series.filter((s) => Array.isArray(s.data) && s.data.length > 0));
	const n = $derived(Math.max(1, xLabels.length));

	const computedYMax = $derived.by(() => {
		if (typeof yMax === "number" && Number.isFinite(yMax) && yMax > 0) return yMax;
		let max = 0;
		for (const s of safeSeries) for (const v of s.data) max = Math.max(max, Number(v) || 0);
		return Math.max(1, max);
	});

	function xAt(i: number) {
		if (n <= 1) return padL;
		return padL + (plotW * i) / (n - 1);
	}

	function yAt(v: number) {
		const t = Math.max(0, Math.min(1, (Number(v) || 0) / computedYMax));
		return padT + plotH * (1 - t);
	}

	function pointsFor(data: number[]) {
		const pts: string[] = [];
		for (let i = 0; i < n; i++) {
			const v = data[i] ?? 0;
			pts.push(`${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`);
		}
		return pts.join(" ");
	}

	const yTicks = $derived.by(() => {
		const out: Array<{ y: number; label: string }> = [];
		for (let i = 0; i < gridLines; i++) {
			const t = i / (gridLines - 1);
			const v = Math.round(computedYMax * (1 - t));
			out.push({ y: padT + plotH * t, label: String(v) });
		}
		return out;
	});

	const xTicks = $derived.by(() => {
		// Keep labels readable: show up to 12 ticks
		const maxTicks = 12;
		const step = Math.max(1, Math.ceil(n / maxTicks));
		const out: Array<{ x: number; label: string }> = [];
		for (let i = 0; i < n; i += step) {
			out.push({ x: xAt(i), label: xLabels[i] ?? String(i + 1) });
		}
		if (n > 1 && (out.at(-1)?.label ?? "") !== (xLabels[n - 1] ?? "")) {
			out.push({ x: xAt(n - 1), label: xLabels[n - 1] ?? String(n) });
		}
		return out;
	});
</script>

<section class="alc">
	<div class="alc-head">
		<div class="alc-titles">
			<h3 class="alc-title">{title}</h3>
			{#if subtitle}
				<p class="alc-sub">{subtitle}</p>
			{/if}
		</div>
		<div class="alc-legend" aria-label="Legend">
			{#each safeSeries as s (s.id)}
				<span class="alc-legend-item">
					<span class="alc-dot" style={`--c:${s.color}`}></span>
					{s.label}
				</span>
			{/each}
		</div>
	</div>

	<svg
		class="container"
		viewBox={`0 0 ${vbW} ${vbH}`}
		role="img"
		aria-label={title}
		style={`height:${height}px`}
	>
		<g id="grid" opacity="0.10" stroke="rgba(17, 24, 39, 0.55)" stroke-linecap="square">
			{#each yTicks as yt (yt.y)}
				<path d={`M ${padL} ${yt.y} L ${vbW - padR} ${yt.y}`} />
			{/each}
		</g>

		<g id="y_axis" font-size="11" fill="rgba(17, 24, 39, 0.62)" font-weight="600">
			{#each yTicks as yt (yt.y)}
				<text x={8} y={yt.y + 4}>{yt.label}</text>
			{/each}
		</g>

		<g id="x_axis" font-size="11" fill="rgba(17, 24, 39, 0.62)" font-weight="600">
			{#each xTicks as xt (xt.x)}
				<text x={xt.x - 6} y={vbH - 10}>{xt.label}</text>
			{/each}
		</g>

		<g id="GRAPHS" stroke-linecap="round" stroke-width="7" stroke-linejoin="round">
			{#each safeSeries as s (s.id)}
				<polyline
					class="alc-line"
					data-line={s.id}
					stroke={s.color}
					points={pointsFor(s.data)}
				/>
			{/each}
		</g>
	</svg>
</section>

<style>
	.alc {
		width: 100%;
	}

	.alc-head {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	@media (min-width: 640px) {
		.alc-head {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.alc-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 800;
		font-family: Georgia, "Times New Roman", serif;
		color: #111827;
		letter-spacing: -0.01em;
	}

	.alc-sub {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: #52525b;
	}

	.alc-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: #52525b;
		font-weight: 700;
	}

	.alc-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.alc-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: var(--c);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
	}

	svg.container {
		display: block;
		width: 100%;
	}

	.alc-line {
		stroke-dasharray: 1200;
		stroke-dashoffset: 1200;
		animation: alc-dash 2.8s ease-in forwards;
	}

	@keyframes alc-dash {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>

