<div class="header-wrapper">
	<!-- Top bar -->
	
	<!-- Main red nav bar -->
	<header class="main-header">
		<a href="/" class="brand">
			<img src="/aalogo.png" alt="April-Astrid" class="logo" />
			<span class="brand-name">April-Astrid</span>
		</a>
		<nav class="nav-links">
			<a href="/dashboard">Dashboard</a>
			<a href="/packages">Packages</a>
			<a href="/about-us">About us</a>
			<a href="/sign-up" class="sign-up">
				<span>Sign up</span>
				<svg class="user-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
			</a>
		</nav>
	</header>
</div>

<style>
	.header-wrapper {
		width: 100%;
	}

	.top-bar {
		background: #2d2d2d;
		color: #9ca3af;
		padding: 0.4rem 2rem;
		font-size: 0.875rem;
	}

	.main-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 2rem;
		background: #c41e3a;
		color: #fff;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: inherit;
		text-decoration: none;
	}

	.logo {
		height: 2.5rem;
		width: auto;
		display: block;
	}

	.brand-name {
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		font-family: Georgia, 'Times New Roman', serif;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.75rem;
	}

	.nav-links a {
		color: inherit;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.95rem;
	}

	.nav-links a:hover {
		text-decoration: underline;
	}

	.sign-up {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.user-icon {
		width: 1.25rem;
		height: 1.25rem;
	}
</style>
