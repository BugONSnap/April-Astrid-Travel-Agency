<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let title = "Packages";
  export let destinationLabel = "";
  export let packages: Array<{ name: string; price: string }> = [];
  export let emptyMessage = "No packages are available for this destination yet.";
  export let primaryButtonLabel = "Book Package";
  export let secondaryButtonLabel = "View All Tours";

  const dispatch = createEventDispatcher<{
    close: void;
    primaryAction: void;
  }>();

  function handleClose() {
    dispatch("close");
  }

  function handlePrimaryAction() {
    dispatch("primaryAction");
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleClose();
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
    aria-modal="true"
    role="dialog"
    aria-label="Destination package details"
    tabindex="-1"
    on:click={handleClose}
    on:keydown={handleKeyDown}
  >
    <div class="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl transition-transform duration-200 ease-out hover:shadow-2xl"
      role="button"
      tabindex="0"
      on:click|stopPropagation
      on:keydown={handleKeyDown}
    >
      <button
        class="absolute right-4 top-4 rounded-full border border-gray-200 bg-white px-3 py-1 text-xl text-gray-500 transition hover:bg-gray-100"
        type="button"
        on:click={handleClose}
        aria-label="Close modal"
      >
        ×
      </button>

      <div class="mb-6 border-b border-gray-200 pb-4">
        <p class="text-sm uppercase tracking-[0.24em] text-gray-500">{title}</p>
        <h2 class="mt-2 text-2xl font-bold text-gray-900">Packages in {destinationLabel}</h2>
        <p class="mt-2 text-sm text-gray-600">Browse available trip packages for this destination.</p>
      </div>

      {#if packages.length > 0}
        <div class="grid gap-4 sm:grid-cols-2">
          {#each packages as pkg}
            <div class="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <h3 class="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <p class="mt-3 text-xl font-bold text-red-600">{pkg.price}</p>
              <button
                class="mt-5 w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                type="button"
                on:click={handlePrimaryAction}
              >
                {primaryButtonLabel}
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <div class="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
          {emptyMessage}
        </div>
      {/if}

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          class="w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 sm:w-auto"
          type="button"
          on:click={handleClose}
        >
          Close
        </button>
        <button
          class="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto"
          type="button"
          on:click={handlePrimaryAction}
        >
          {secondaryButtonLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
