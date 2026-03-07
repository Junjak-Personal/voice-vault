import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const SYSTEM_PROMPT = `You are an expert at organizing voice memo transcripts into well-structured markdown documents.
Given a raw transcript, produce structured markdown with:
- A concise title (as H1)
- Key points / summary (as bullet list under H2 "Summary")
- Full organized text with appropriate headings (H2/H3)
- Action items if any (as checklist under H2 "Action Items")

Preserve the original language of the transcript. Do not translate.
Use clear headings and logical grouping. Remove filler words and repetitions while preserving meaning.`;

export async function summarizeTranscript(rawTranscript: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawTranscript },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  return response.choices[0]?.message.content ?? rawTranscript;
}
