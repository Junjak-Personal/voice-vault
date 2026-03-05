<script lang="ts">
  import type { Memo } from '$lib/api/types.js';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { formatDate, formatDuration } from '$lib/utils.js';
  import { groupStore } from '$lib/stores/groups.svelte.js';

  interface Props {
    memo: Memo;
  }

  let { memo }: Props = $props();

  const groupIds = $derived(memo.memo_groups?.map((mg) => mg.group_id) ?? []);
  const assignedGroups = $derived(
    groupStore.groups.filter((g) => groupIds.includes(g.id)),
  );
</script>

<a
  href="/memos/{memo.id}"
  class="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
  data-testid="memo-card"
>
  <div class="flex items-start justify-between gap-2">
    <h3 class="font-semibold text-card-foreground line-clamp-1">{memo.title}</h3>
    {#if memo.duration_sec}
      <span class="shrink-0 text-sm text-muted-foreground">
        {formatDuration(memo.duration_sec)}
      </span>
    {/if}
  </div>

  {#if memo.summary_md}
    <p class="mt-1 text-sm text-muted-foreground line-clamp-2">
      {memo.summary_md.slice(0, 150).replace(/[#*_`]/g, '')}
    </p>
  {:else}
    <p class="mt-1 text-sm text-muted-foreground italic">Processing...</p>
  {/if}

  <div class="mt-3 flex items-center gap-2">
    <span class="text-xs text-muted-foreground">{formatDate(memo.created_at)}</span>
    {#each assignedGroups as group}
      <Badge color={group.color ?? undefined}>{group.name}</Badge>
    {/each}
  </div>
</a>
