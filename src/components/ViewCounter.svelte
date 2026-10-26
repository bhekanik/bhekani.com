<script>
  import { onMount } from "svelte"
  import { parseViewCount } from "../utils/viewsClient"

  let { slug } = $props()
  let count = $state(undefined)
  let unavailable = $state(false)

  onMount(() => {
    const controller = new AbortController()

    const request = fetch(`/api/views?${new URLSearchParams({ slug })}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal,
    })

    void request
      .then((response) => response.ok ? response.json().then(parseViewCount) : undefined)
      .then((nextCount) => {
        if (controller.signal.aborted) return
        if (nextCount === undefined) unavailable = true
        else count = nextCount
      })
      .catch(() => {
        if (!controller.signal.aborted) unavailable = true
      })

    return () => controller.abort()
  })
</script>

{#if count !== undefined}
  <span class="text-sm text-muted-foreground transition-opacity duration-300">
    {count.toLocaleString()} views
  </span>
{:else if unavailable}
  <span class="text-sm text-muted-foreground" aria-label="View count unavailable">Views unavailable</span>
{:else}
  <span class="inline-flex items-center gap-1 text-sm text-muted-foreground">
    <span class="inline-block w-12 h-3 bg-muted rounded animate-pulse"></span>
    views
  </span>
{/if}
