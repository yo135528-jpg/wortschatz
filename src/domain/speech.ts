/** Whitespace-normalized text, so equal sentences share one cached clip. */
export function normalizeSpeech(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Stable cache id for a clip: FNV-1a 32-bit of the normalized text, 8 hex chars. */
export function audioId(text: string): string {
  const normalized = normalizeSpeech(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
