import { h } from './dom';
import { geminiClip } from './geminiTts';

// Voice choice and API key are per device (each device has other voices; the key must never be
// deployed), so they live in localStorage, not in the synced settings.
const VOICE_KEY = 'wortschatz.tts.voice';
const RATE_KEY = 'wortschatz.tts.rate';
const GEMINI_KEY = 'wortschatz.gemini.key';
const DEFAULT_RATE = 0.9;
/** Prefix of voice values that mean "Gemini voice <name>", e.g. "gemini:Kore". */
export const GEMINI_PREFIX = 'gemini:';
const DEFAULT_GEMINI_VOICE = `${GEMINI_PREFIX}Kore`;

/** Minimal shape of SpeechSynthesisVoice, so the ranking can be unit-tested. */
export interface VoiceLike {
  name: string;
  lang: string;
  localService: boolean;
}

/**
 * Higher is more natural. Neural "Natural"/"Online" voices (Edge) and Google's network voices (Chrome)
 * sound far better than the old local system voices (e.g. Microsoft Hedda).
 */
export function voiceScore(voice: VoiceLike): number {
  if (!voice.lang.toLowerCase().startsWith('de')) return -1;
  let score = voice.lang === 'de-DE' ? 1 : 0;
  if (/natural|neural|online/i.test(voice.name)) score += 6;
  else if (/google/i.test(voice.name)) score += 4;
  else if (!voice.localService) score += 2;
  return score;
}

/** Score of old local system voices (e.g. Microsoft Hedda); hidden when anything better exists. */
const LOCAL_VOICE_MAX_SCORE = 1;

export function rankGermanVoices<T extends VoiceLike>(voices: T[]): T[] {
  const german = voices.filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a));
  const good = german.filter((v) => voiceScore(v) > LOCAL_VOICE_MAX_SCORE);
  // Offline there may be only local voices; a robotic voice is still better than none.
  return good.length ? good : german;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the choice just is not remembered.
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function germanVoices(): SpeechSynthesisVoice[] {
  return isSpeechSupported() ? rankGermanVoices(speechSynthesis.getVoices()) : [];
}

export function geminiKey(): string | null {
  return readStorage(GEMINI_KEY);
}

export function setGeminiKey(key: string): void {
  writeStorage(GEMINI_KEY, key.trim() || null);
}

/** Selected voice value: "gemini:<name>" or a browser voice name. Gemini is the default once a key exists. */
export function selectedVoice(): string {
  const saved = readStorage(VOICE_KEY);
  if (saved?.startsWith(GEMINI_PREFIX)) return geminiKey() ? saved : (germanVoices()[0]?.name ?? '');
  if (saved) return saved;
  return geminiKey() ? DEFAULT_GEMINI_VOICE : (germanVoices()[0]?.name ?? '');
}

export function setVoice(value: string): void {
  writeStorage(VOICE_KEY, value);
}

function browserVoice(): SpeechSynthesisVoice | null {
  const voices = germanVoices();
  return voices.find((v) => v.name === selectedVoice()) ?? voices[0] ?? null;
}

export function currentRate(): number {
  const rate = Number(readStorage(RATE_KEY));
  return rate >= 0.5 && rate <= 1.5 ? rate : DEFAULT_RATE;
}

export function setRate(rate: number): void {
  writeStorage(RATE_KEY, String(rate));
}

/** Calls back when the browser has loaded its voice list (it loads asynchronously). */
export function onVoicesChanged(callback: () => void): void {
  if (isSpeechSupported()) speechSynthesis.addEventListener('voiceschanged', callback);
}

let currentAudio: HTMLAudioElement | null = null;
/** Increases on every new request, so a slow Gemini answer never plays over a newer one. */
let requestNumber = 0;
let lastError: string | null = null;

/** Last Gemini error (shown in Settings), null if the last request worked. */
export function lastSpeechError(): string | null {
  return lastError;
}

function stopSpeaking(): void {
  currentAudio?.pause();
  currentAudio = null;
  if (isSpeechSupported()) speechSynthesis.cancel();
}

function speakWithBrowser(text: string): void {
  if (!isSpeechSupported()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = currentRate();
  const voice = browserVoice();
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

async function speakWithGemini(text: string, voice: string, apiKey: string, request: number): Promise<void> {
  try {
    const blob = await geminiClip(text, voice, apiKey);
    if (request !== requestNumber) return;
    lastError = null;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = currentRate() / DEFAULT_RATE;
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));
    currentAudio = audio;
    await audio.play();
  } catch (error) {
    lastError = (error as Error).message;
    console.warn('[tts] Gemini failed, using browser voice:', lastError);
    if (request === requestNumber) speakWithBrowser(text);
  }
}

/** Speaks with the selected voice; resolves when playback has started (or failed). */
export async function speakGerman(text: string): Promise<void> {
  stopSpeaking();
  const request = ++requestNumber;
  const voice = selectedVoice();
  const apiKey = geminiKey();
  if (voice.startsWith(GEMINI_PREFIX) && apiKey) {
    await speakWithGemini(text, voice.slice(GEMINI_PREFIX.length), apiKey, request);
  } else {
    speakWithBrowser(text);
  }
}

/** Small speaker button; stops propagation so it does not flip the card. */
export function speakButton(text: string): HTMLButtonElement | null {
  if (!isSpeechSupported() && !geminiKey()) return null;
  const button = h(
    'button',
    {
      class: 'speak',
      type: 'button',
      'aria-label': `Vorlesen: ${text}`,
      'data-testid': 'speak',
      onclick: async (event: Event) => {
        event.stopPropagation();
        button.classList.add('loading');
        await speakGerman(text);
        button.classList.remove('loading');
      },
    },
    '🔊',
  );
  return button;
}
