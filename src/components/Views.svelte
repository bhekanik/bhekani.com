<script>
  import { onMount } from "svelte"

  let { slug } = $props()
  let data = $state(null)
  let error = $state(null)

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
      throw e
    }
  }

  onMount(async () => {
    try {
      data = await fetchImage()
    } catch (e) {
      error = e.message
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
