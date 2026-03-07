import OpenAI from 'openai';
import { createReadStream } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { mkdir, readdir, unlink, rmdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const execAsync = promisify(exec);

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
}

const CHUNK_DURATION_SEC = 600; // 10 minutes per chunk
const MAX_CONCURRENT = 3;

async function splitAudio(filePath: string): Promise<string[]> {
  const chunkDir = join(dirname(filePath), `chunks_${randomUUID()}`);
  await mkdir(chunkDir, { recursive: true });

  // Get total duration
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  );
  const totalDuration = parseFloat(stdout.trim());

  if (totalDuration <= CHUNK_DURATION_SEC) {
    // No need to split — clean up and return original
    await rmdir(chunkDir);
    return [filePath];
  }

  const chunkCount = Math.ceil(totalDuration / CHUNK_DURATION_SEC);
  const chunkPaths: string[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_DURATION_SEC;
    const chunkPath = join(chunkDir, `chunk_${String(i).padStart(3, '0')}.m4a`);
    await execAsync(
      `ffmpeg -i "${filePath}" -ss ${start} -t ${CHUNK_DURATION_SEC} -c copy -y "${chunkPath}"`
    );
    chunkPaths.push(chunkPath);
  }

  return chunkPaths;
}

async function transcribeChunk(filePath: string): Promise<{ text: string; duration: number; language: string }> {
  const response = await getOpenAI().audio.transcriptions.create({
    file: createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    language: 'ko',
  });

  return {
    text: response.text,
    duration: Math.round(response.duration ?? 0),
    language: response.language ?? 'ko',
  };
}

async function runConcurrent<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function cleanupChunks(chunkPaths: string[], originalPath: string) {
  for (const p of chunkPaths) {
    if (p !== originalPath) {
      await unlink(p).catch(() => {});
    }
  }
  // Remove chunk directory if it exists
  if (chunkPaths.length > 0 && chunkPaths[0] !== originalPath) {
    await rmdir(dirname(chunkPaths[0])).catch(() => {});
  }
}

export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  const chunkPaths = await splitAudio(filePath);

  try {
    if (chunkPaths.length === 1 && chunkPaths[0] === filePath) {
      // Small file — direct transcription
      return transcribeChunk(filePath);
    }

    // Transcribe chunks concurrently (with limit)
    const results = await runConcurrent(chunkPaths, MAX_CONCURRENT, transcribeChunk);

    const combinedText = results.map((r) => r.text).join('\n\n');
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      text: combinedText,
      language: results[0].language,
      duration: totalDuration,
    };
  } finally {
    await cleanupChunks(chunkPaths, filePath);
  }
}
