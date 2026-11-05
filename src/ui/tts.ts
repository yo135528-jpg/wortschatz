import { h } from './dom';

let germanVoice: SpeechSynthesisVoice | null = null;

function pickGermanVoice(): void {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  germanVoice = voices.find((v) => v.lang === 'de-DE') ?? voices.find((v) => v.lang.startsWith('de')) ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickGermanVoice();
  // Voices load asynchronously in most browsers.
  speechSynthesis.addEventListener('voiceschanged', pickGermanVoice);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakGerman(text: string): void {
  if (!isSpeechSupported()) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.9;
  if (germanVoice) utterance.voice = germanVoice;
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
