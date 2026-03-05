<script lang="ts">
  import { memoStore } from '$lib/stores/memos.svelte.js';
  import MemoCard from './MemoCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    memoStore.applySearch();
  }

  function handleReset() {
    memoStore.resetSearch();
  }

  const totalPages = $derived(Math.ceil(memoStore.total / 20));
</script>

<div class="space-y-4">
  <form onsubmit={handleSearch} class="flex gap-2">
    <Input
      type="search"
      placeholder="Search memos..."
      bind:value={memoStore.searchInput}
      data-testid="memo-search-input"
    />
    <Button type="submit" variant="outline" data-testid="memo-search-submit">Search</Button>
    {#if memoStore.appliedQuery}
      <Button type="button" variant="secondary" onclick={handleReset}>Clear</Button>
    {/if}
  </form>

  {#if memoStore.loading}
    <div class="flex justify-center py-8">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  {:else if memoStore.memos.length === 0}
    <div class="py-12 text-center text-muted-foreground">
      <p>No memos found.</p>
      <a href="/upload" class="mt-2 inline-block text-primary underline">Upload your first voice memo</a>
    </div>
  {:else}
    <div class="grid gap-3">
      {#each memoStore.memos as memo (memo.id)}
        <MemoCard {memo} />
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="flex justify-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={memoStore.page <= 1}
          onclick={() => memoStore.fetch(memoStore.page - 1)}
        >Previous</Button>
        <span class="flex items-center px-2 text-sm text-muted-foreground">
          Page {memoStore.page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={memoStore.page >= totalPages}
          onclick={() => memoStore.fetch(memoStore.page + 1)}
        >Next</Button>
      </div>
    {/if}
  {/if}
</div>
