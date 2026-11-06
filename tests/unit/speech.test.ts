import { describe, expect, it } from 'vitest';
import { audioId } from '../../src/domain/speech';
import { pcmToWav } from '../../src/ui/geminiTts';

describe('audioId', () => {
  it('gives the same id for the same text regardless of whitespace', () => {
    expect(audioId('Guten  Tag ')).toBe(audioId('Guten Tag'));
    expect(audioId('Guten Tag')).toMatch(/^[0-9a-f]{8}$/);
    expect(audioId('Guten Tag')).not.toBe(audioId('Guten Abend'));
  });
});

describe('pcmToWav', () => {
  it('wraps raw PCM in a 44-byte WAV header with the right sizes and sample rate', () => {
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const view = new DataView(pcmToWav(pcm, 24_000).buffer);
    const text = (offset: number) => String.fromCharCode(...new Uint8Array(view.buffer, offset, 4));
    expect(text(0)).toBe('RIFF');
    expect(text(8)).toBe('WAVE');
    expect(view.getUint32(4, true)).toBe(36 + pcm.length);
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint32(40, true)).toBe(pcm.length);
    expect(view.byteLength).toBe(44 + pcm.length);
  });
});
