<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let mode = $state<'login' | 'register'>('login');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;

    try {
      if (mode === 'login') {
        await auth.login(email, password);
        goto('/memos');
      } else {
        await auth.register(email, password);
        error = '';
        mode = 'login';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Voice Vault</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
  <div class="w-full max-w-sm space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Voice Vault</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
      </p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      {#if error}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      {/if}

      <div class="space-y-2">
        <label for="email" class="text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          bind:value={email}
          required
          autocomplete="email"
          data-testid="login-email-input"
        />
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium">Password</label>
        <Input
          id="password"
          type="password"
          bind:value={password}
          required
          minlength={6}
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          data-testid="login-password-input"
        />
      </div>

      <Button type="submit" class="w-full" disabled={loading} data-testid="login-submit-button">
        {#if loading}
          Processing...
        {:else}
          {mode === 'login' ? 'Sign In' : 'Register'}
        {/if}
      </Button>
    </form>

    <div class="text-center">
      <button
        class="text-sm text-muted-foreground underline hover:text-foreground cursor-pointer"
        onclick={() => { mode = mode === 'login' ? 'register' : 'login'; error = ''; }}
      >
        {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
      </button>
    </div>
  </div>
</div>
