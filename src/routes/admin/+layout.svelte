<script lang="ts">
	import AdminHeader from "$lib/assets/admin-header.svelte";

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-stone-50">
	<AdminHeader />

	<main class="admin-main flex-1 w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
		{@render children()}
	</main>
</div>

<style>
	:global(.admin-main) {
		/* Align with public site: header/footer brand #c41e3a */
		--ap-ink: #111827;
		--ap-muted: #52525b;
		--ap-border: rgba(127, 29, 29, 0.12);
		--ap-accent: #c41e3a;
		--ap-brand-deep: #7f1d1d;
		--ap-radius: 1rem;
		--ap-radius-sm: 0.75rem;
	}

	/* Page chrome */
	:global(.admin-main .ap-page) {
		max-width: 100%;
	}

	:global(.admin-main .ap-page-head) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--ap-border);
	}

	@media (min-width: 640px) {
		:global(.admin-main .ap-page-head) {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	:global(.admin-main .ap-kicker) {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ap-muted);
		margin: 0 0 0.35rem;
	}

	:global(.admin-main .ap-title) {
		font-family: Georgia, "Times New Roman", serif;
		font-size: clamp(1.5rem, 3.5vw, 2rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ap-ink);
		margin: 0;
		line-height: 1.15;
	}

	:global(.admin-main .ap-sub) {
		margin: 0.35rem 0 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--ap-muted);
		max-width: 42rem;
	}

	:global(.admin-main .ap-back) {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ap-muted);
		text-decoration: none;
		white-space: nowrap;
		transition: color 0.15s ease;
	}

	:global(.admin-main .ap-back:hover) {
		color: var(--ap-accent);
	}

	:global(.admin-main .ap-back:focus-visible) {
		outline: 2px solid var(--ap-accent);
		outline-offset: 2px;
		border-radius: 4px;
	}

	/* Sections & cards */
	:global(.admin-main .ap-stack) {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	:global(.admin-main .ap-card) {
		background: #fff;
		border: 1px solid var(--ap-border);
		border-radius: var(--ap-radius);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		padding: 1.25rem 1.35rem;
	}

	:global(.admin-main .ap-card-title) {
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.0625rem;
		font-weight: 700;
		margin: 0 0 1rem;
		color: var(--ap-ink);
	}

	:global(.admin-main .ap-hint) {
		margin: -0.5rem 0 1rem;
		font-size: 0.8125rem;
		color: var(--ap-muted);
		line-height: 1.45;
	}

	:global(.admin-main .ap-empty) {
		margin: 0;
		padding: 1.25rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--ap-muted);
		background: #fafafa;
		border-radius: var(--ap-radius-sm);
		border: 1px dashed var(--ap-border);
	}

	/* Forms */
	:global(.admin-main .ap-form-grid) {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.875rem;
	}

	@media (min-width: 768px) {
		:global(.admin-main .ap-form-grid) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1rem;
		}

		:global(.admin-main .ap-span-2) {
			grid-column: span 2;
		}
	}

	:global(.admin-main .ap-field) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	:global(.admin-main .ap-label) {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--ap-muted);
	}

	:global(.admin-main .ap-input),
	:global(.admin-main .ap-select),
	:global(.admin-main .ap-textarea) {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.85rem;
		font-size: 0.875rem;
		color: var(--ap-ink);
		background: #fff;
		border: 1px solid var(--ap-border);
		border-radius: var(--ap-radius-sm);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	:global(.admin-main .ap-input:focus),
	:global(.admin-main .ap-select:focus),
	:global(.admin-main .ap-textarea:focus) {
		outline: none;
		border-color: rgba(196, 30, 58, 0.45);
		box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.12);
	}

	:global(.admin-main .ap-textarea) {
		min-height: 88px;
		resize: vertical;
		line-height: 1.45;
	}

	:global(.admin-main .ap-form-actions) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: flex-end;
		padding-top: 0.25rem;
	}

	:global(.admin-main .ap-nested-form) {
		min-width: min(100%, 16rem);
	}

	/* Buttons */
	:global(.admin-main .ap-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.15rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: var(--ap-radius-sm);
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			transform 0.12s ease,
			box-shadow 0.15s ease,
			background 0.15s ease;
		line-height: 1.2;
	}

	:global(.admin-main .ap-btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (hover: hover) {
		:global(.admin-main .ap-btn:hover:not(:disabled)) {
			transform: translateY(-1px);
		}
	}

	:global(.admin-main .ap-btn:focus-visible) {
		outline: 2px solid var(--ap-accent);
		outline-offset: 2px;
	}

	:global(.admin-main .ap-btn--primary) {
		background: var(--ap-accent);
		color: #fff;
	}

	@media (hover: hover) {
		:global(.admin-main .ap-btn--primary:hover:not(:disabled)) {
			background: var(--ap-brand-deep);
			box-shadow: 0 10px 24px rgba(196, 30, 58, 0.28);
		}
	}

	:global(.admin-main .ap-btn--secondary) {
		background: #f4f4f5;
		color: var(--ap-ink);
		border-color: var(--ap-border);
	}

	:global(.admin-main .ap-btn--danger) {
		background: #fee2e2;
		color: #991b1b;
		border-color: #fecaca;
	}

	:global(.admin-main .ap-btn--block) {
		width: 100%;
	}

	:global(.admin-main .ap-btn--sm) {
		padding: 0.45rem 0.8rem;
		font-size: 0.8125rem;
	}

	/* Tables */
	:global(.admin-main .ap-table-wrap) {
		overflow-x: auto;
		margin: 0 -0.35rem;
		padding: 0 0.35rem;
		-webkit-overflow-scrolling: touch;
	}

	:global(.admin-main .ap-table) {
		width: 100%;
		min-width: 720px;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	:global(.admin-main .ap-table th) {
		text-align: left;
		padding: 0.65rem 0.75rem;
		font-weight: 600;
		color: var(--ap-muted);
		background: #fafafa;
		border-bottom: 1px solid var(--ap-border);
		white-space: nowrap;
	}

	:global(.admin-main .ap-table td) {
		padding: 0.75rem;
		border-bottom: 1px solid var(--ap-border);
		vertical-align: top;
		color: var(--ap-ink);
	}

	:global(.admin-main .ap-table tr:last-child td) {
		border-bottom: none;
	}

	:global(.admin-main .ap-muted) {
		color: var(--ap-muted);
		font-size: 0.8125rem;
	}

	:global(.admin-main .ap-badge) {
		display: inline-block;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.45rem;
		border-radius: 4px;
		background: #f4f4f5;
		color: var(--ap-muted);
	}

	:global(.admin-main .ap-thumb) {
		width: 4rem;
		height: 2.5rem;
		object-fit: cover;
		border-radius: var(--ap-radius-sm);
		border: 1px solid var(--ap-border);
	}

	/* Package list item */
	:global(.admin-main .ap-package-item) {
		border: 1px solid var(--ap-border);
		border-radius: var(--ap-radius);
		padding: 1.15rem 1.25rem;
		background: #fafafa;
	}

	:global(.admin-main .ap-delete-form) {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--ap-border);
	}

	:global(.admin-main .ap-package-head) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		:global(.admin-main .ap-package-head) {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
		}
	}

	/* Chat layout */
	:global(.admin-main .ap-chat) {
		display: flex;
		flex-direction: column;
		min-height: min(70vh, 720px);
		border: 1px solid var(--ap-border);
		border-radius: var(--ap-radius);
		overflow: hidden;
		background: #fff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	@media (min-width:768px) {
		:global(.admin-main .ap-chat) {
			flex-direction: row;
			min-height: min(75vh, 800px);
		}
	}

	:global(.admin-main .ap-chat-inbox) {
		width: 100%;
		max-height: 40vh;
		overflow-y: auto;
		border-bottom: 1px solid var(--ap-border);
		background: #fafafa;
	}

	@media (min-width: 768px) {
		:global(.admin-main .ap-chat-inbox) {
			width: 320px;
			max-height: none;
			border-bottom: none;
			border-right: 1px solid var(--ap-border);
			flex-shrink: 0;
		}
	}

	@media (min-width: 1024px) {
		:global(.admin-main .ap-chat-inbox) {
			width: 360px;
		}
	}

	:global(.admin-main .ap-chat-inbox-title) {
		padding: 1rem 1.1rem;
		font-family: Georgia, "Times New Roman", serif;
		font-weight: 700;
		font-size: 1rem;
		margin: 0;
		border-bottom: 1px solid var(--ap-border);
		background: #fff;
	}

	:global(.admin-main .ap-chat-thread-btn) {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.85rem 1.1rem;
		font-size: 0.875rem;
		border: none;
		border-bottom: 1px solid var(--ap-border);
		background: transparent;
		cursor: pointer;
		color: var(--ap-ink);
		transition: background 0.12s ease;
	}

	@media (hover: hover) {
		:global(.admin-main .ap-chat-thread-btn:hover) {
			background: #f4f4f5;
		}
	}

	:global(.admin-main .ap-chat-thread-btn--active) {
		background: #fff;
		box-shadow: inset 3px 0 0 var(--ap-accent);
	}

	:global(.admin-main .ap-chat-main) {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: #f4f4f5;
	}

	:global(.admin-main .ap-chat-banner) {
		padding: 1rem 1.15rem;
		background: linear-gradient(135deg, #c41e3a 0%, #991b1b 55%, #7f1d1d 100%);
		color: #fef2f2;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	:global(.admin-main .ap-chat-messages) {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.admin-main .ap-chat-bubble) {
		max-width: 85%;
		padding: 0.65rem 0.85rem;
		border-radius: var(--ap-radius-sm);
		font-size: 0.875rem;
		line-height: 1.45;
		word-break: break-word;
	}

	@media (min-width: 640px) {
		:global(.admin-main .ap-chat-bubble) {
			max-width: 70%;
		}
	}

	:global(.admin-main .ap-chat-bubble--them) {
		background: #fff;
		border: 1px solid var(--ap-border);
		align-self: flex-start;
	}

	:global(.admin-main .ap-chat-bubble--me) {
		background: var(--ap-accent);
		color: #fff;
		align-self: flex-end;
	}

	:global(.admin-main .ap-chat-input-row) {
		display: flex;
		gap: 0.65rem;
		padding: 0.85rem 1rem;
		background: #fff;
		border-top: 1px solid var(--ap-border);
	}

	:global(.admin-main .ap-chat-input) {
		flex: 1;
		min-width: 0;
	}

	:global(.admin-main .ap-chat-empty) {
		margin: 1rem;
		padding: 1rem;
		font-size: 0.875rem;
		color: var(--ap-muted);
		text-align: center;
	}
</style>
