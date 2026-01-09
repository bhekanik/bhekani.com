<script lang="ts">
  import { onMount, onDestroy } from "svelte"

  interface SearchResult {
    id: string
    type: "post" | "book" | "micro" | "project"
    title: string
    slug: string
    description?: string
    score: number
  }

  let isOpen = false
  let query = ""
  let results: SearchResult[] = []
  let loading = false
  let selectedIndex = 0
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null
  let inputRef: HTMLInputElement | null = null

  const typeColors: Record<string, string> = {
    post: "bg-blue-500/20 text-blue-400",
    book: "bg-amber-500/20 text-amber-400",
    micro: "bg-green-500/20 text-green-400",
    project: "bg-purple-500/20 text-purple-400",
  }

  const typeLabels: Record<string, string> = {
    post: "Post",
    book: "Book",
    micro: "Micro",
    project: "Project",
  }

  function open() {
    isOpen = true
    query = ""
    results = []
    selectedIndex = 0
    setTimeout(() => inputRef?.focus(), 50)
  }

  function close() {
    isOpen = false
    query = ""
    results = []
  }

  async function search(q: string) {
    if (q.length < 2) {
      results = []
      return
    }

    loading = true
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (response.ok) {
        const data = await response.json()
        results = data.results || []
      } else {
        results = []
      }
    } catch {
      results = []
    } finally {
      loading = false
    }
  }

  function handleInput() {
    if (debounceTimeout) clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => search(query), 300)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected) {
        navigateTo(selected)
      }
    } else if (e.key === "Escape") {
      close()
    }
  }

  function navigateTo(result: SearchResult) {
    close()
    window.location.href = result.slug
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      if (isOpen) {
        close()
      } else {
        open()
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close()
    }
  }

  function handleSearchTriggerClick() {
    open()
  }

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKeydown)
    // Listen for clicks on search trigger buttons
    const triggers = document.querySelectorAll(".search-trigger")
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", handleSearchTriggerClick)
    })
  })

  onDestroy(() => {
    document.removeEventListener("keydown", handleGlobalKeydown)
    const triggers = document.querySelectorAll(".search-trigger")
    triggers.forEach((trigger) => {
      trigger.removeEventListener("click", handleSearchTriggerClick)
    })
    if (debounceTimeout) clearTimeout(debounceTimeout)
  })

  export { open }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
    on:click={handleBackdropClick}
  >
    <div class="flex items-start justify-center pt-[15vh]">
      <div class="w-full max-w-xl mx-4 bg-[hsl(var(--background))] border border-[hsl(var(--muted))] rounded-lg shadow-2xl overflow-hidden">
        <!-- Search Input -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--muted))]">
          <svg class="w-5 h-5 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            bind:this={inputRef}
            bind:value={query}
            on:input={handleInput}
            on:keydown={handleKeydown}
            type="text"
            placeholder="Search posts, books, projects..."
            class="flex-1 bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none"
          />
          <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded">
            esc
          </kbd>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto">
          {#if loading}
            <div class="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
              <div class="inline-block w-5 h-5 border-2 border-[hsl(var(--muted-foreground))] border-t-transparent rounded-full animate-spin"></div>
            </div>
          {:else if query.length > 0 && query.length < 2}
            <div class="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
              Type at least 2 characters to search
            </div>
          {:else if query.length >= 2 && results.length === 0}
            <div class="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
              No results found for "{query}"
            </div>
          {:else if results.length > 0}
            <ul class="py-2">
              {#each results as result, i}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <li
                  class="px-4 py-3 cursor-pointer transition-colors {i === selectedIndex ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted))]/50'}"
                  on:click={() => navigateTo(result)}
                  on:mouseenter={() => selectedIndex = i}
                >
                  <div class="flex items-start gap-3">
                    <span class="shrink-0 px-2 py-0.5 text-xs font-medium rounded {typeColors[result.type] || 'bg-gray-500/20 text-gray-400'}">
                      {typeLabels[result.type] || result.type}
                    </span>
                    <div class="min-w-0">
                      <div class="font-medium text-[hsl(var(--foreground))] truncate">
                        {result.title}
                      </div>
                      {#if result.description}
                        <div class="text-sm text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {result.description}
                        </div>
                      {/if}
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <div class="px-4 py-6 text-center text-[hsl(var(--muted-foreground))] text-sm">
              <p>Search across all content</p>
              <p class="mt-2 text-xs">
                Posts, books, micro posts, and projects
              </p>
            </div>
          {/if}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-4 py-2 border-t border-[hsl(var(--muted))] text-xs text-[hsl(var(--muted-foreground))]">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded">↑</kbd>
              <kbd class="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded">↓</kbd>
              navigate
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded">↵</kbd>
              select
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
