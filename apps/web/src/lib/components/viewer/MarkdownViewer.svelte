<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';

  interface Props {
    content: string;
  }

  let { content }: Props = $props();
  let html = $state('');

  async function renderMarkdown(md: string) {
    const { unified } = await import('unified');
    const { default: remarkParse } = await import('remark-parse');
    const { default: remarkGfm } = await import('remark-gfm');
    const { default: remarkRehype } = await import('remark-rehype');
    const { default: rehypeStringify } = await import('rehype-stringify');

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(md);

    html = DOMPurify.sanitize(String(result));
  }

  onMount(() => {
    renderMarkdown(content);
  });

  $effect(() => {
    renderMarkdown(content);
  });
</script>

<article class="prose prose-sm max-w-none dark:prose-invert">
  {@html html}
</article>
