<script>
  import { onDestroy, onMount, tick } from "svelte"
  import { feedback } from "../scripts/feedback"
  import { hasMeaningfulSearchText } from "../utils/search"

  const typeColors = {
    post: "bg-accent/15 text-links",
    book: "bg-muted text-foreground",
    micro: "bg-muted text-muted-foreground",
    project: "bg-foreground text-background",
  }
  const typeLabels = {
    post: "Post",
    book: "Book",
    micro: "Micro",
    project: "Project",
  }

  let isOpen = $state(false)
  let query = $state("")
  let results = $state([])
  let state = $state("idle")
  let debounceTimeout
  let requestController
  let generation = 0
  let inputRef = $state()
  let dialogRef = $state()
  let invokingElement

  export async function open() {
    if (isOpen) return

    invokingElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    isOpen = true
    resetSearch()
    await tick()
    if (!dialogRef?.open) dialogRef?.showModal()
    inputRef?.focus()
  }

  function resetSearch() {
    cancelPendingSearch()
    query = ""
    results = []
    state = "idle"
  }

  function cancelPendingSearch() {
    generation += 1
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
      debounceTimeout = undefined
    }
    requestController?.abort()
    requestController = undefined
  }

  function close() {
    if (!isOpen && !dialogRef?.open) return
    isOpen = false
    resetSearch()
    if (dialogRef?.open) dialogRef.close()
    invokingElement?.focus()
    invokingElement = undefined
  }

  function handleNativeCancel(event) {
    event.preventDefault()
    close()
  }

  function handleNativeClose() {
    if (isOpen) close()
  }

  function handleDialogKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
    }
  }

  function hasSearchableQuery(value) {
    return hasMeaningfulSearchText(value)
  }

  function handleInput() {
    cancelPendingSearch()
    results = []
    if (!hasSearchableQuery(query)) {
      state = "idle"
      return
    }

    const requestGeneration = generation
    const requestQuery = query
    state = "debouncing"
    debounceTimeout = setTimeout(() => {
      debounceTimeout = undefined
      void search(requestQuery, requestGeneration)
    }, 250)
  }

  async function search(requestQuery, requestGeneration) {
    if (!isOpen || requestGeneration !== generation || requestQuery !== query) return

    const controller = new AbortController()
    requestController = controller
    state = "loading"
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(requestQuery)}`, { signal: controller.signal })
      const data = await response.json().catch(() => ({}))
      if (!isOpen || requestGeneration !== generation || requestQuery !== query) return

      if (response.ok) {
        results = Array.isArray(data.results) ? data.results : []
        state = results.length > 0 ? "results" : "empty"
      } else {
        results = []
        state = response.status === 429 ? "rate-limited" : "error"
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      if (!isOpen || requestGeneration !== generation || requestQuery !== query) return
      results = []
      state = "error"
    } finally {
      if (isOpen && requestGeneration === generation && requestController === controller) {
        requestController = undefined
      }
    }
  }

  function retry() {
    if (!hasSearchableQuery(query)) return
    cancelPendingSearch()
    void search(query, generation)
  }

  function handleGlobalKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      if (isOpen) close()
      else void open()
    }
  }

  function handleResultActivate() {
    feedback.play("tick")
    feedback.haptic("tap")
  }

  function statusMessage() {
    if (state === "debouncing" || state === "loading") return "Searching…"
    if (state === "results") return `${results.length} result${results.length === 1 ? "" : "s"} found.`
    if (state === "empty") return "No matching published content found."
    if (state === "rate-limited") return "Too many searches. Please try again shortly."
    if (state === "error") return "Search is temporarily unavailable."
    if (query.trim() !== "") return "Use at least 2 letters or numbers to search."
    return "Search posts, books, micro posts, and projects."
  }

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKeydown)
    const triggers = [...document.querySelectorAll(".search-trigger")]
    for (const trigger of triggers) trigger.addEventListener("click", open)

    return () => {
      document.removeEventListener("keydown", handleGlobalKeydown)
      for (const trigger of triggers) trigger.removeEventListener("click", open)
    }
  })

  onDestroy(cancelPendingSearch)
</script>

<dialog
  bind:this={dialogRef}
  class="search-dialog"
  aria-labelledby="search-title"
  oncancel={handleNativeCancel}
  onclose={handleNativeClose}
  onkeydown={handleDialogKeydown}
>
  <div class="search-shell">
    <div class="search-header">
      <div>
        <p class="search-kicker">Finder</p>
        <h2 id="search-title">Search this site</h2>
      </div>
      <button type="button" class="search-close" onclick={close} aria-label="Close search">Close <kbd>Esc</kbd></button>
    </div>

    <div class="search-input-row">
      <label for="site-search" class="visually-hidden">Search published posts, books, micro posts, and projects</label>
      <svg class="search-icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        bind:this={inputRef}
        bind:value={query}
        oninput={handleInput}
        id="site-search"
        type="search"
        autocomplete="off"
        placeholder="Search posts, books, projects…"
      />
    </div>

    <p class="search-status" role="status" aria-live="polite">{statusMessage()}</p>

    <div class="search-results">
      {#if state === "loading" || state === "debouncing"}
        <div class="search-notice" aria-hidden="true"><span class="search-spinner"></span></div>
      {:else if state === "results"}
        <ul>
          {#each results as result}
            <li>
              <a href={result.slug} onclick={handleResultActivate}>
                <span class="result-type {typeColors[result.type]}">{typeLabels[result.type]}</span>
                <span class="result-copy">
                  <strong>{result.title}</strong>
                  {#if result.description}<span>{result.description}</span>{/if}
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {:else if state === "empty"}
        <div class="search-notice">
          <p>No results for “{query}”. Try a shorter title or browse the <a href="/posts">archive</a>.</p>
        </div>
      {:else if state === "error" || state === "rate-limited"}
        <div class="search-notice">
          <p>{state === "rate-limited" ? "Search is taking a short break." : "The search index could not be reached."}</p>
          <button type="button" class="retry-button" onclick={retry}>Try again</button>
        </div>
      {:else}
        <div class="search-notice">
          <p>Search across all published content.</p>
        </div>
      {/if}
    </div>
  </div>
</dialog>

<style>
  .search-dialog {
    width: min(42rem, calc(100vw - 2rem));
    max-width: none;
    max-height: min(42rem, calc(100dvh - 2rem));
    margin: auto;
    padding: 0;
    color: var(--foreground);
    background: var(--background);
    border: var(--rule) solid var(--border);
    box-shadow: var(--shadow-ink);
  }
  .search-dialog::backdrop { background: rgb(0 0 0 / 0.58); }
  .search-shell { display: grid; max-height: inherit; }
  .search-header { display: flex; align-items: start; justify-content: space-between; gap: var(--space-4); padding: var(--space-5); border-bottom: var(--rule) solid var(--border); }
  .search-kicker { margin: 0 0 var(--space-1); font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted-foreground); }
  .search-header h2 { margin: 0; font-family: var(--font-display); font-size: 1.5rem; }
  .search-close, .retry-button { color: inherit; background: var(--muted); border: var(--rule) solid var(--border); cursor: pointer; font: inherit; }
  .search-close { flex: none; padding: 0.375rem 0.5rem; font-size: 0.8125rem; }
  .search-close kbd { margin-left: 0.25rem; font-family: var(--font-mono); font-size: 0.7rem; }
  .search-input-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: var(--rule) solid var(--border); }
  .search-icon { width: 1.25rem; height: 1.25rem; flex: none; color: var(--muted-foreground); }
  .search-input-row input { width: 100%; min-width: 0; border: 0; outline: 0; color: inherit; background: transparent; font: inherit; font-size: 1.125rem; }
  .search-input-row input::placeholder { color: var(--muted-foreground); }
  .search-status { min-height: 1.5rem; margin: 0; padding: var(--space-2) var(--space-5); font-size: 0.8125rem; color: var(--muted-foreground); border-bottom: var(--rule) solid var(--border); }
  .search-results { min-height: 9rem; overflow-y: auto; overscroll-behavior: contain; }
  .search-results ul { margin: 0; padding: 0; list-style: none; }
  .search-results li + li { border-top: var(--rule) solid var(--border); }
  .search-results a { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); color: inherit; text-decoration: none; }
  .search-results a:hover, .search-results a:focus-visible { background: var(--muted); outline: none; }
  .result-type { flex: none; margin-top: 0.125rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: var(--font-mono); font-size: 0.6875rem; text-transform: uppercase; }
  .result-copy { display: grid; min-width: 0; gap: 0.2rem; }
  .result-copy strong, .result-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-copy span { color: var(--muted-foreground); font-size: 0.875rem; }
  .search-notice { display: grid; place-items: center; gap: var(--space-3); min-height: 9rem; padding: var(--space-5); text-align: center; color: var(--muted-foreground); }
  .search-notice p { margin: 0; }
  .search-notice a { display: inline; padding: 0; color: var(--links); text-decoration: underline; }
  .retry-button { padding: 0.4rem 0.625rem; }
  .search-spinner { width: 1.25rem; height: 1.25rem; border: 2px solid var(--muted-foreground); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 30rem) { .search-dialog { width: calc(100vw - 1rem); max-height: calc(100dvh - 1rem); } .search-header, .search-input-row, .search-status, .search-results a { padding-left: var(--space-4); padding-right: var(--space-4); } }
</style>
