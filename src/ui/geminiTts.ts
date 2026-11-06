/**
 * Live text-to-speech with Gemini (Google AI Studio key), called directly from the browser.
 * The key is entered by the user in Settings and kept only in this browser's localStorage;
 * it is never part of the code or the deployed site.
 * Each clip is cached (Cache Storage), so a sentence costs one request only once.
 */
import { audioId, normalizeSpeech } from '../domain/speech';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash-preview-tts';
/** Gemini TTS returns raw 16-bit little-endian mono PCM at 24 kHz. */
const SAMPLE_RATE = 24_000;
const CACHE_NAME = 'wortschatz-gemini-tts';

/** A few of Gemini's prebuilt voices that sound good in German. */
export const GEMINI_VOICES: [string, string][] = [
  ['Kore', 'Kore (kadın, net)'],
  ['Aoede', 'Aoede (kadın, sıcak)'],
  ['Leda', 'Leda (kadın, genç)'],
  ['Charon', 'Charon (erkek, sakin)'],
  ['Puck', 'Puck (erkek, canlı)'],
  ['Orus', 'Orus (erkek, tok)'],
];

/** Adds a WAV header so the browser can play the raw PCM. */
export function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array<ArrayBuffer> {
  const wav = new Uint8Array(44 + pcm.length);
  const view = new DataView(wav.buffer);
  const writeText = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, 'data');
  view.setUint32(40, pcm.length, true);
  wav.set(pcm, 44);
  return wav;
}

function cacheUrl(text: string, voice: string): string {
  // Synthetic same-origin URL used only as a cache key.
  return new URL(`./__tts/${voice}/${audioId(text)}.wav`, location.href).href;
}

async function openCache(): Promise<Cache | null> {
  try {
    return 'caches' in window ? await caches.open(CACHE_NAME) : null;
  } catch {
    return null;
  }
}

async function requestClip(text: string, voice: string, apiKey: string): Promise<Blob> {
  const response = await fetch(`${API}/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Say in clear, natural standard German, at a normal pace: ${normalizeSpeech(text)}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });
  if (!response.ok) {
    const status = response.status;
    throw new Error(status === 429 ? 'Gemini kotası doldu, biraz sonra tekrar dene.' : `Gemini hatası (HTTP ${status}).`);
  }
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[];
  };
  const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (!data) throw new Error('Gemini ses döndürmedi.');
  const pcm = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([pcmToWav(pcm, SAMPLE_RATE)], { type: 'audio/wav' });
}

/** Returns the clip from the cache, or fetches it from Gemini and caches it. */
export async function geminiClip(text: string, voice: string, apiKey: string): Promise<Blob> {
  const cache = await openCache();
  const url = cacheUrl(text, voice);
  const cached = await cache?.match(url);
  if (cached) return cached.blob();
  const blob = await requestClip(text, voice, apiKey);
  await cache?.put(url, new Response(blob, { headers: { 'Content-Type': 'audio/wav' } }));
  return blob;
}

export async function clearGeminiCache(): Promise<void> {
  if ('caches' in window) await caches.delete(CACHE_NAME);
}
