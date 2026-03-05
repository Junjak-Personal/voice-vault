<script lang="ts">
  import { onMount } from 'svelte';
  import { memoStore } from '$lib/stores/memos.svelte.js';
  import { groupStore } from '$lib/stores/groups.svelte.js';
  import MemoList from '$lib/components/memo/MemoList.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  onMount(() => {
    groupStore.fetch();
    memoStore.fetch();
  });

  function filterByGroup(groupId: string | null) {
    memoStore.selectedGroupId = groupId;
    memoStore.fetch(1);
  }
</script>

<svelte:head>
  <title>Memos - Voice Vault</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Memos</h1>
    <a href="/upload">
      <Button>Upload Audio</Button>
    </a>
  </div>

  {#if groupStore.groups.length > 0}
    <div class="flex flex-wrap gap-2">
      <button
        class="cursor-pointer"
        onclick={() => filterByGroup(null)}
      >
        <Badge class={!memoStore.selectedGroupId ? 'bg-primary text-primary-foreground' : ''}>
          All
        </Badge>
      </button>
      {#each groupStore.groups as group (group.id)}
        <button
          class="cursor-pointer"
          onclick={() => filterByGroup(group.id)}
        >
          <Badge
            color={group.color ?? undefined}
            class={memoStore.selectedGroupId === group.id ? 'ring-2 ring-ring' : ''}
          >
            {group.name}
          </Badge>
        </button>
      {/each}
    </div>
  {/if}

  <MemoList />
</div>
