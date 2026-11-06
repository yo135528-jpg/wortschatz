import { describe, expect, it } from 'vitest';
import { rankGermanVoices } from '../../src/ui/tts';

const hedda = { name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE', localService: true };
const karl = { name: 'Microsoft Karl - German (Austria)', lang: 'de-AT', localService: true };

describe('rankGermanVoices', () => {
  it('orders natural before Google voices and hides old local voices and other languages', () => {
    const voices = [
      hedda,
      { name: 'Google US English', lang: 'en-US', localService: false },
      { name: 'Google Deutsch', lang: 'de-DE', localService: false },
      { name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE', localService: false },
      karl,
    ];
    expect(rankGermanVoices(voices).map((v) => v.name)).toEqual([
      'Microsoft Katja Online (Natural) - German (Germany)',
      'Google Deutsch',
    ]);
  });

  it('falls back to local voices when nothing better exists (offline)', () => {
    expect(rankGermanVoices([karl, hedda]).map((v) => v.name)).toEqual([hedda.name, karl.name]);
  });
});
