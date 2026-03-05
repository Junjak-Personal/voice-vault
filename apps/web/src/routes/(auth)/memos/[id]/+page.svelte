<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client.js';
  import type { Memo } from '$lib/api/types.js';
  import MarkdownViewer from '$lib/components/viewer/MarkdownViewer.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let memo = $state<Memo | null>(null);
  let loading = $state(true);
  let editing = $state(false);
  let editContent = $state('');
  let saving = $state(false);
  let showRaw = $state(false);

  onMount(async () => {
    try {
      memo = await api.get<Memo>(`/memos/${$page.params.id}`);
      editContent = memo.summary_md ?? '';
    } catch {
      goto('/memos');
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    if (!memo) return;
    saving = true;
    try {
      memo = await api.patch<Memo>(`/memos/${memo.id}`, { summary_md: editContent });
      editing = false;
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!memo || !confirm('Delete this memo?')) return;
    await api.delete(`/memos/${memo.id}`);
    goto('/memos');
  }
</script>

<svelte:head>
  <title>{memo?.title ?? 'Memo'} - Voice Vault</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center py-12">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
{:else if memo}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <a href="/memos" class="text-sm text-muted-foreground hover:text-foreground">&larr; Back</a>
        <h1 class="mt-1 text-2xl font-bold">{memo.title}</h1>
      </div>
      <div class="flex gap-2">
        {#if editing}
          <Button variant="outline" onclick={() => { editing = false; editContent = memo!.summary_md ?? ''; }}>
            Cancel
          </Button>
          <Button onclick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        {:else}
          <Button variant="outline" onclick={() => { showRaw = !showRaw; }}>
            {showRaw ? 'Summary' : 'Raw Transcript'}
          </Button>
          <Button variant="outline" onclick={() => { editing = true; }}>Edit</Button>
          <Button variant="destructive" onclick={handleDelete}>Delete</Button>
        {/if}
      </div>
    </div>

    {#if editing}
      <div class="space-y-2">
        <textarea
          class="w-full min-h-[400px] rounded-md border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          bind:value={editContent}
        ></textarea>
      </div>
    {:else if showRaw}
      <div class="rounded-md border border-border bg-muted p-4">
        <h2 class="mb-2 font-semibold">Raw Transcript</h2>
        <p class="whitespace-pre-wrap text-sm">{memo.raw_transcript ?? 'No transcript available'}</p>
      </div>
    {:else if memo.summary_md}
      <MarkdownViewer content={memo.summary_md} />
    {:else}
      <p class="text-muted-foreground">Processing... refresh in a moment.</p>
    {/if}
  </div>
{/if}
