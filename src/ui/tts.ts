import { h } from './dom';

// Voice choice is per device (each device has different voices), so it lives in localStorage,
// not in the synced settings.
const VOICE_KEY = 'wortschatz.tts.voice';
const RATE_KEY = 'wortschatz.tts.rate';
const DEFAULT_RATE = 0.9;

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

export function rankGermanVoices<T extends VoiceLike>(voices: T[]): T[] {
  return voices.filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a));
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
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

/** The voice the user picked, or the most natural one available. */
export function currentVoice(): SpeechSynthesisVoice | null {
  const voices = germanVoices();
  const saved = readStorage(VOICE_KEY);
  return voices.find((v) => v.name === saved) ?? voices[0] ?? null;
}

export function setVoice(name: string): void {
  writeStorage(VOICE_KEY, name);
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

export function speakGerman(text: string): void {
  if (!isSpeechSupported()) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = currentRate();
  const voice = currentVoice();
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

/** Small speaker button; stops propagation so it does not flip the card. */
export function speakButton(text: string): HTMLButtonElement | null {
  if (!isSpeechSupported()) return null;
  return h(
    'button',
    {
      class: 'speak',
      type: 'button',
      'aria-label': `Vorlesen: ${text}`,
      'data-testid': 'speak',
      onclick: (event: Event) => {
        event.stopPropagation();
        speakGerman(text);
      },
    },
    '🔊',
  );
}
