<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';

  interface Props {
    content: string;
    onSave: (markdown: string) => void;
  }

  let { content, onSave }: Props = $props();
  let element: HTMLDivElement | undefined = $state();
  let editor: Editor | undefined;

  onMount(() => {
    if (!element) return;
    editor = new Editor({
      element,
      extensions: [StarterKit],
      content,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none',
        },
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  export function getContent() {
    return editor?.getHTML() ?? content;
  }

  export function save() {
    onSave(getContent());
  }
</script>

<div class="rounded-md border border-input">
  <div bind:this={element}></div>
</div>
