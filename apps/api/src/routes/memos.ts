import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthEnv } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

export const memoRoutes = new Hono<AuthEnv>();

memoRoutes.use('*', authMiddleware);

const updateMemoSchema = z.object({
  title: z.string().min(1).optional(),
  summary_md: z.string().optional(),
  raw_transcript: z.string().optional(),
});

// List memos with optional group filter and search
memoRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const groupId = c.req.query('group_id');
  const search = c.req.query('search');
  const page = Number(c.req.query('page') ?? '1');
  const limit = Number(c.req.query('limit') ?? '20');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('memos')
    .select('*, memo_groups(group_id)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,raw_transcript.ilike.%${search}%,summary_md.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  let memos = data ?? [];

  // Filter by group if specified (post-filter since Supabase join filtering is limited)
  if (groupId) {
    memos = memos.filter((m) =>
      Array.isArray(m.memo_groups) && m.memo_groups.some((mg) => mg.group_id === groupId),
    );
  }

  return c.json({ memos, total: count ?? 0, page, limit });
});

// Get single memo
memoRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('memos')
    .select('*, memo_groups(group_id)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return c.json({ error: 'Memo not found' }, 404);
  }

  return c.json(data);
});

// Update memo
memoRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateMemoSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase
    .from('memos')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// Delete memo
memoRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

// Assign groups to memo
memoRoutes.put('/:id/groups', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const { group_ids } = await c.req.json() as { group_ids: string[] };

  // Verify memo belongs to user
  const { data: memo } = await supabase
    .from('memos')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!memo) {
    return c.json({ error: 'Memo not found' }, 404);
  }

  // Replace all group assignments
  await supabase.from('memo_groups').delete().eq('memo_id', id);

  if (group_ids.length > 0) {
    const { error } = await supabase
      .from('memo_groups')
      .insert(group_ids.map((group_id) => ({ memo_id: id, group_id })));

    if (error) {
      return c.json({ error: error.message }, 500);
    }
  }

  return c.json({ success: true });
});
