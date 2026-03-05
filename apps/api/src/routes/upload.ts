import { Hono } from 'hono';
import { authMiddleware, type AuthEnv } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';
import type { Memo } from '../types/database.js';
import { transcribeAudio } from '../services/whisper.js';
import { summarizeTranscript } from '../services/summarize.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const uploadRoutes = new Hono<AuthEnv>();

uploadRoutes.use('*', authMiddleware);

const AUDIO_DIR = process.env.AUDIO_DIR ?? '/data/audio';
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/webm', 'audio/ogg'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

uploadRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const formData = await c.req.formData();
  const file = formData.get('audio');

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No audio file provided' }, 400);
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: 'File too large (max 50MB)' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.m4a')) {
    return c.json({ error: `Unsupported file type: ${file.type}` }, 400);
  }

  // Save file to disk
  const ext = file.name.split('.').pop() ?? 'm4a';
  const fileId = randomUUID();
  const userDir = join(AUDIO_DIR, userId);
  await mkdir(userDir, { recursive: true });
  const filePath = join(userDir, `${fileId}.${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Create memo with pending status
  const { data: memo, error: insertError } = await supabase
    .from('memos')
    .insert({
      user_id: userId,
      title: file.name.replace(/\.[^.]+$/, ''),
      audio_path: filePath,
      language: 'ko',
    })
    .select('id, title')
    .single<Pick<Memo, 'id' | 'title'>>();

  if (insertError || !memo) {
    return c.json({ error: 'Failed to create memo' }, 500);
  }

  // Process in background (transcribe + summarize)
  processAudio(memo.id, filePath).catch((err) => {
    console.error(`Failed to process audio for memo ${memo.id}:`, err);
  });

  return c.json({ memo_id: memo.id, status: 'processing' }, 202);
});

// Get processing status
uploadRoutes.get('/status/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('memos')
    .select('id, title, raw_transcript, summary_md')
    .eq('id', id)
    .eq('user_id', userId)
    .single<Pick<Memo, 'id' | 'title' | 'raw_transcript' | 'summary_md'>>();

  if (error || !data) {
    return c.json({ error: 'Memo not found' }, 404);
  }

  const status = data.summary_md
    ? 'completed'
    : data.raw_transcript
      ? 'summarizing'
      : 'transcribing';

  return c.json({ id: data.id, status });
});

async function processAudio(memoId: string, filePath: string) {
  // Step 1: Transcribe
  const transcription = await transcribeAudio(filePath);

  await supabase
    .from('memos')
    .update({
      raw_transcript: transcription.text,
      duration_sec: transcription.duration,
      language: transcription.language,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memoId);

  // Step 2: Summarize
  const summary = await summarizeTranscript(transcription.text);

  // Extract title from first H1 in summary
  const titleMatch = summary.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? 'Untitled Memo';

  await supabase
    .from('memos')
    .update({
      summary_md: summary,
      title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memoId);
}
