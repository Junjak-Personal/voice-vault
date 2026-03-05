import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthEnv } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

export const groupRoutes = new Hono<AuthEnv>();

groupRoutes.use('*', authMiddleware);

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateGroupSchema = createGroupSchema.partial();

// List groups
groupRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data ?? []);
});

// Create group
groupRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data, 201);
});

// Update group
groupRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase
    .from('groups')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// Delete group
groupRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});
