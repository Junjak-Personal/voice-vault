<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { Snippet } from 'svelte';

  interface Props {
    color?: string;
    class?: string;
    children: Snippet;
  }

  let { color, class: className, children }: Props = $props();
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
    'border border-border',
    className,
  )}
  style={color ? `background-color: ${color}20; color: ${color}; border-color: ${color}40` : ''}
>
  {@render children()}
</span>
