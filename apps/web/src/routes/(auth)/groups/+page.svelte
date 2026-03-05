<script lang="ts">
  import { onMount } from 'svelte';
  import { groupStore } from '$lib/stores/groups.svelte.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  let newName = $state('');
  let newColor = $state('#6366f1');
  let editingId = $state<string | null>(null);
  let editName = $state('');
  let editColor = $state('');

  onMount(() => {
    groupStore.fetch();
  });

  async function handleCreate(e: SubmitEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await groupStore.create(newName.trim(), undefined, newColor);
    newName = '';
    newColor = '#6366f1';
  }

  function startEdit(id: string, name: string, color: string | null) {
    editingId = id;
    editName = name;
    editColor = color ?? '#6366f1';
  }

  async function handleUpdate() {
    if (!editingId || !editName.trim()) return;
    await groupStore.update(editingId, { name: editName.trim(), color: editColor });
    editingId = null;
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this group?')) return;
    await groupStore.remove(id);
  }
</script>

<svelte:head>
  <title>Groups - Voice Vault</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
  <h1 class="text-2xl font-bold">Groups</h1>

  <form onsubmit={handleCreate} class="flex gap-2">
    <Input
      bind:value={newName}
      placeholder="New group name"
      data-testid="group-name-input"
    />
    <input
      type="color"
      bind:value={newColor}
      class="h-10 w-10 cursor-pointer rounded border border-input"
    />
    <Button type="submit" data-testid="group-create-button">Add</Button>
  </form>

  <div class="space-y-2">
    {#each groupStore.groups as group (group.id)}
      <div class="flex items-center justify-between rounded-md border border-border p-3">
        {#if editingId === group.id}
          <div class="flex flex-1 items-center gap-2">
            <Input bind:value={editName} class="flex-1" />
            <input
              type="color"
              bind:value={editColor}
              class="h-10 w-10 cursor-pointer rounded border border-input"
            />
            <Button size="sm" onclick={handleUpdate}>Save</Button>
            <Button size="sm" variant="outline" onclick={() => { editingId = null; }}>Cancel</Button>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <Badge color={group.color ?? undefined}>{group.name}</Badge>
            {#if group.description}
              <span class="text-sm text-muted-foreground">{group.description}</span>
            {/if}
          </div>
          <div class="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onclick={() => startEdit(group.id, group.name, group.color)}
            >Edit</Button>
            <Button
              size="sm"
              variant="ghost"
              onclick={() => handleDelete(group.id)}
            >Delete</Button>
          </div>
        {/if}
      </div>
    {/each}

    {#if groupStore.groups.length === 0 && !groupStore.loading}
      <p class="py-8 text-center text-muted-foreground">No groups yet. Create one above.</p>
    {/if}
  </div>
</div>
