/**
 * Generates natural AI audio (Gemini TTS via Google AI Studio) for every German text in cards.json.
 * Clips go to public/audio/<id>.mp3, the list of available clips to src/data/audio.json.
 * Resumable: existing clips are skipped, so it can be stopped and re-run at any time.
 *
 * Setup: put GEMINI_API_KEY=... into .env.local (git-ignored).
 * Run:   npm run audio                 (all missing clips)
 *        npm run audio -- --limit 5    (try a few first)
 *        npm run audio -- --list-models
 *        npm run audio -- --voice Kore --model gemini-2.5-flash-preview-tts
 *        npm run audio -- --prune      (also delete clips no card uses any more)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { Mp3Encoder } from '@breezystack/lamejs';
import { parseNotes } from '../src/domain/schema';
import { audioId, speechTexts } from '../src/domain/speech';

const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const CARDS = root('src/data/cards.json');
const MANIFEST = root('src/data/audio.json');
const AUDIO_DIR = root('public/audio');
const API = 'https://generativelanguage.googleapis.com/v1beta';
/** Gemini TTS returns raw 16-bit little-endian mono PCM at 24 kHz. */
const SAMPLE_RATE = 24_000;
const MP3_KBPS = 48;

interface Manifest {
  model: string | null;
  voice: string | null;
  clips: Record<string, string>;
}

const { values: args } = parseArgs({
  options: {
    limit: { type: 'string' },
    voice: { type: 'string', default: 'Kore' },
    model: { type: 'string', default: 'gemini-2.5-flash-preview-tts' },
    rpm: { type: 'string', default: '10' },
    prune: { type: 'boolean', default: false },
    'list-models': { type: 'boolean', default: false },
  },
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('✗ GEMINI_API_KEY missing. Create .env.local with: GEMINI_API_KEY=<your key from aistudio.google.com/apikey>');
  process.exit(1);
}
const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function listModels(): Promise<void> {
  const response = await fetch(`${API}/models?pageSize=200`, { headers });
  const body = (await response.json()) as { models?: { name: string }[] };
  for (const model of body.models ?? []) if (/tts/i.test(model.name)) console.log(model.name.replace('models/', ''));
}

/** Calls Gemini TTS; on rate limit (429) waits the suggested delay and retries. */
async function synthesize(text: string): Promise<Int16Array> {
  const body = {
    contents: [{ parts: [{ text: `Say in clear, natural standard German, at a normal pace: ${text}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: args.voice } } },
    },
  };
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${API}/models/${args.model}:generateContent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[];
      };
      const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
      if (!data) throw new Error(`no audio in response: ${JSON.stringify(json).slice(0, 300)}`);
      const bytes = Buffer.from(data, 'base64');
      return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.length / 2));
    }
    const errorText = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= 6) throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
    if (/per day|PerDay/i.test(errorText)) throw new Error('daily quota reached, run again tomorrow (progress is saved)');
    const suggested = /"retryDelay":\s*"(\d+)s"/.exec(errorText)?.[1];
    const waitSeconds = suggested ? Number(suggested) + 1 : 15 * attempt;
    console.log(`  … ${response.status}, waiting ${waitSeconds}s`);
    await sleep(waitSeconds * 1000);
  }
}

function toMp3(pcm: Int16Array): Buffer {
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const chunks: Uint8Array[] = [];
  const blockSize = 1152;
  for (let i = 0; i < pcm.length; i += blockSize) chunks.push(encoder.encodeBuffer(pcm.subarray(i, i + blockSize)));
  chunks.push(encoder.flush());
  return Buffer.concat(chunks);
}

function saveManifest(manifest: Manifest): void {
  const sorted = Object.fromEntries(Object.entries(manifest.clips).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify({ ...manifest, clips: sorted }, null, 2)}\n`);
}

async function main(): Promise<void> {
  if (args['list-models']) return listModels();

  const notes = parseNotes(JSON.parse(readFileSync(CARDS, 'utf8')));
  const wanted = new Map<string, string>();
  for (const note of notes) for (const text of speechTexts(note)) wanted.set(audioId(text), text);

  mkdirSync(AUDIO_DIR, { recursive: true });
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
  if (manifest.voice && (manifest.voice !== args.voice || manifest.model !== args.model)) {
    console.log(`Note: existing clips use ${manifest.voice} / ${manifest.model}; new clips use ${args.voice} / ${args.model}.`);
  }
  manifest.voice = args.voice;
  manifest.model = args.model;

  if (args.prune) {
    for (const file of readdirSync(AUDIO_DIR)) {
      const id = file.replace(/\.mp3$/, '');
      if (!wanted.has(id)) {
        unlinkSync(`${AUDIO_DIR}/${file}`);
        delete manifest.clips[id];
      }
    }
  }

  const missing = [...wanted].filter(([id]) => !manifest.clips[id] || !existsSync(`${AUDIO_DIR}/${id}.mp3`));
  const todo = args.limit ? missing.slice(0, Number(args.limit)) : missing;
  console.log(`${wanted.size} texts, ${wanted.size - missing.length} done, generating ${todo.length}…`);

  const minGapMs = 60_000 / Number(args.rpm);
  for (const [index, [id, text]] of todo.entries()) {
    const started = Date.now();
    try {
      writeFileSync(`${AUDIO_DIR}/${id}.mp3`, toMp3(await synthesize(text)));
    } catch (error) {
      saveManifest(manifest);
      console.error(`✗ stopped at "${text}": ${(error as Error).message}`);
      process.exit(1);
    }
    manifest.clips[id] = text;
    saveManifest(manifest);
    console.log(`✓ ${index + 1}/${todo.length} ${text}`);
    const wait = minGapMs - (Date.now() - started);
    if (wait > 0 && index < todo.length - 1) await sleep(wait);
  }
  saveManifest(manifest);
  console.log('✓ done');
}

await main();
