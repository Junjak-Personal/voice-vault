import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({
    user: { id: data.user.id, email: data.user.email },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

authRoutes.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json();
  if (!refresh_token) {
    return c.json({ error: 'Missing refresh_token' }, 400);
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error || !data.session) {
    return c.json({ error: error?.message ?? 'Failed to refresh' }, 401);
  }

  return c.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
});

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ user: { id: data.user?.id, email: data.user?.email } }, 201);
});
