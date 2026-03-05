<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte.js';
  import { onMount } from 'svelte';

  onMount(() => {
    if (auth.isAuthenticated) {
      goto('/memos');
    } else {
      goto('/login');
    }
  });
</script>
