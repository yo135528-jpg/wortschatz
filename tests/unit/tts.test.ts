import { describe, expect, it } from 'vitest';
import { rankGermanVoices } from '../../src/ui/tts';

describe('rankGermanVoices', () => {
  it('puts natural and Google voices before old local voices and drops other languages', () => {
    const voices = [
      { name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE', localService: true },
      { name: 'Google US English', lang: 'en-US', localService: false },
      { name: 'Google Deutsch', lang: 'de-DE', localService: false },
      { name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE', localService: false },
      { name: 'Microsoft Karl - German (Austria)', lang: 'de-AT', localService: true },
    ];
    expect(rankGermanVoices(voices).map((v) => v.name)).toEqual([
      'Microsoft Katja Online (Natural) - German (Germany)',
      'Google Deutsch',
      'Microsoft Hedda - German (Germany)',
      'Microsoft Karl - German (Austria)',
    ]);
  });
});
