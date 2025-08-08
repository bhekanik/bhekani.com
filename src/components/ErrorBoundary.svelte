<script lang="ts">
  import { onMount } from 'svelte'
  import * as Sentry from '@sentry/astro'
  
  export let fallback: string = 'Something went wrong'
  
  let hasError = false
  let errorMessage = ''
  
  const handleError = (error: Error) => {
    hasError = true
    errorMessage = error.message
    Sentry.captureException(error)
  }
  
  onMount(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason))
    }
    
    const handleErrorEvent = (event: ErrorEvent) => {
      handleError(event.error)
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleErrorEvent)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleErrorEvent)
    }
  })
</script>

{#if hasError}
  <div class="text-sm text-[hsl(var(--muted-foreground))]">
    {fallback}
  </div>
{:else}
  <slot />
{/if}