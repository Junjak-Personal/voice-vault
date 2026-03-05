<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';
  import { auth } from '$lib/stores/auth.svelte.js';

  let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-background">
  {#if auth.isAuthenticated}
    <header class="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <a href="/memos" class="text-lg font-bold text-foreground">Voice Vault</a>
        <div class="flex items-center gap-4">
          <a href="/memos" class="text-sm text-muted-foreground hover:text-foreground">Memos</a>
          <a href="/upload" class="text-sm text-muted-foreground hover:text-foreground">Upload</a>
          <a href="/groups" class="text-sm text-muted-foreground hover:text-foreground">Groups</a>
          <button
            class="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            onclick={() => { auth.logout(); window.location.href = '/login'; }}
          >Logout</button>
        </div>
      </nav>
    </header>
  {/if}

  <main class="mx-auto max-w-5xl px-4 py-6">
    {@render children()}
  </main>
</div>
