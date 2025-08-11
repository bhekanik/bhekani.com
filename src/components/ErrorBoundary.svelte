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
  <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
    <p class="text-sm font-medium text-red-800 dark:text-red-200">
      {fallback}
    </p>
    {#if errorMessage && import.meta.env.DEV}
      <p class="mt-2 text-xs text-red-600 dark:text-red-300 font-mono">
        {errorMessage}
      </p>
    {/if}
  </div>
{:else}
  <slot />
{/if}