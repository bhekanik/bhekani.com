<script lang="ts">
  import { onMount } from "svelte"

  export let slug: string
  let data: { count: number } | null = null
  let error: string | null = null

  const fetchImage = async () => {
    try {
      const url = `/api/views?${new URLSearchParams({ slug })}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
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
  <p class="text-sm text-[hsl(var(--muted-foreground))]">
    Views: {data.count}
  </p>
{:else if error}
  <p class="text-sm text-[hsl(var(--muted-foreground))]">Views: 1</p>
{:else}
  <p>Loading...</p>
{/if}
