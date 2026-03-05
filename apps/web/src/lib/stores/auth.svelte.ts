import { api } from '$lib/api/client.js';
import type { LoginResponse } from '$lib/api/types.js';

interface AuthState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

function createAuthStore() {
  let state = $state<AuthState>({
    userId: null,
    email: null,
    isAuthenticated: false,
  });

  // Initialize from localStorage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('session');
    const user = localStorage.getItem('user');
    if (raw && user) {
      try {
        const parsed = JSON.parse(user) as { id: string; email: string };
        state = { userId: parsed.id, email: parsed.email, isAuthenticated: true };
      } catch {
        localStorage.removeItem('session');
        localStorage.removeItem('user');
      }
    }
  }

  return {
    get userId() { return state.userId; },
    get email() { return state.email; },
    get isAuthenticated() { return state.isAuthenticated; },

    async login(email: string, password: string) {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      localStorage.setItem('session', JSON.stringify(res.session));
      localStorage.setItem('user', JSON.stringify(res.user));
      state = { userId: res.user.id, email: res.user.email, isAuthenticated: true };
    },

    async register(email: string, password: string) {
      await api.post('/auth/register', { email, password });
    },

    logout() {
      localStorage.removeItem('session');
      localStorage.removeItem('user');
      state = { userId: null, email: null, isAuthenticated: false };
    },
  };
}

export const auth = createAuthStore();
