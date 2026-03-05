import OpenAI from 'openai';
import { createReadStream } from 'node:fs';

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

export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  const response = await getOpenAI().audio.transcriptions.create({
    file: createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    language: 'ko',
  });

  return {
    text: response.text,
    language: response.language ?? 'ko',
    duration: Math.round(response.duration ?? 0),
  };
}
