<script lang="ts">
  import { onMount } from "svelte"

  export let slug: string
  let data: { count: number } | null = null
  let error: string | null = null

  const fetchImage = async () => {
    try {
      const url = `/api/views?${new URLSearchParams({ slug })}`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("Error fetching view count:", e)
      }
      throw e
    }
  }

  onMount(async () => {
    try {
      data = await fetchImage()
    } catch (e) {
      error = (e as Error).message
    }
  })
</script>

{#if data}
  <span class="text-sm text-[hsl(var(--muted-foreground))] transition-opacity duration-300">
    {data.count.toLocaleString()} views
  </span>
{:else if error}
  <span class="text-sm text-[hsl(var(--muted-foreground))]">-</span>
{:else}
  <span class="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
    <span class="inline-block w-12 h-3 bg-[hsl(var(--muted))] rounded animate-pulse"></span>
    views
  </span>
{/if}
