<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client.js';
  import type { UploadResponse, ProcessingStatus } from '$lib/api/types.js';
  import Button from '$lib/components/ui/Button.svelte';

  let file = $state<File | null>(null);
  let uploading = $state(false);
  let processing = $state(false);
  let status = $state('');
  let error = $state('');
  let dragOver = $state(false);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const dropped = e.dataTransfer?.files[0];
    if (dropped && isAudioFile(dropped)) {
      file = dropped;
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      file = input.files[0];
    }
  }

  function isAudioFile(f: File) {
    return f.type.startsWith('audio/') || f.name.endsWith('.m4a');
  }

  async function handleUpload() {
    if (!file) return;
    error = '';
    uploading = true;
    status = 'Uploading...';

    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await api.post<UploadResponse>('/upload', formData);

      uploading = false;
      processing = true;
      status = 'Transcribing...';

      // Poll for status
      const memoId = res.memo_id;
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await api.get<ProcessingStatus>(`/upload/status/${memoId}`);
        status = s.status === 'transcribing'
          ? 'Transcribing audio...'
          : s.status === 'summarizing'
            ? 'Generating summary...'
            : 'Complete!';

        if (s.status === 'completed') {
          goto(`/memos/${memoId}`);
          return;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Upload failed';
      uploading = false;
      processing = false;
      status = '';
    }
  }
</script>

<svelte:head>
  <title>Upload - Voice Vault</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
  <h1 class="text-2xl font-bold">Upload Voice Memo</h1>

  {#if error}
    <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
  {/if}

  <div
    role="button"
    tabindex="0"
    class="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors {dragOver ? 'border-primary bg-primary/5' : 'border-border'}"
    ondragover={(e) => { e.preventDefault(); dragOver = true; }}
    ondragleave={() => { dragOver = false; }}
    ondrop={handleDrop}
    onclick={() => document.getElementById('file-input')?.click()}
    onkeydown={(e) => { if (e.key === 'Enter') document.getElementById('file-input')?.click(); }}
  >
    <input
      id="file-input"
      type="file"
      accept="audio/*,.m4a"
      class="hidden"
      onchange={handleFileSelect}
    />

    {#if file}
      <p class="text-sm font-medium">{file.name}</p>
      <p class="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
    {:else}
      <p class="text-muted-foreground">Drop audio file here or click to select</p>
      <p class="text-xs text-muted-foreground">Supports m4a, mp3, wav, webm, ogg (max 50MB)</p>
    {/if}
  </div>

  {#if status}
    <div class="flex items-center gap-3 rounded-md bg-muted px-4 py-3">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      <span class="text-sm">{status}</span>
    </div>
  {/if}

  <Button
    class="w-full"
    disabled={!file || uploading || processing}
    onclick={handleUpload}
    data-testid="upload-submit-button"
  >
    {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload & Process'}
  </Button>
</div>
