/**
 * Typed-answer checking for drills and typed reviews.
 * "almost" = right word with a small slip (one typo, missing umlaut); it counts as correct
 * but the UI shows the exact spelling.
 */
export type Verdict = 'correct' | 'almost' | 'wrong';

/** Lowercases, unifies apostrophes/quotes and whitespace, drops sentence punctuation. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[’`´]/g, "'")
    .replace(/[„“”"«»]/g, '')
    .replace(/[.,!?;:…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('de');
}

/** Typing without a German keyboard: ä → ae, ß → ss. */
export function transliterate(value: string): string {
  return value.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/** Edit distance where swapping two neighbouring letters ("nug" → "ung") is one typo (Damerau, OSA). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, d[i - 2]![j - 2]! + 1);
      d[i]![j] = value;
    }
  }
  return d[a.length]![b.length]!;
}

/** Allowed typos: none for very short words, 1 for words, ~1 per 12 chars for sentences. */
function typoBudget(length: number): number {
  if (length < 4) return 0;
  return Math.max(1, Math.floor(length / 12));
}

/** Compares one typed answer against all accepted spellings. */
export function checkAnswer(typed: string, accepted: readonly string[]): Verdict {
  const input = normalizeAnswer(typed);
  if (!input) return 'wrong';
  let best: Verdict = 'wrong';
  for (const option of accepted) {
    const target = normalizeAnswer(option);
    if (input === target) return 'correct';
    if (transliterate(input) === transliterate(target)) best = 'almost';
    else if (levenshtein(input, target) <= typoBudget(target.length)) best = 'almost';
  }
  return best;
}

export interface DiffToken {
  text: string;
  /** ok = typed correctly; missing = expected but not typed; extra = typed but not expected. */
  kind: 'ok' | 'missing' | 'extra';
}

/** Word-level diff (LCS) for dictation feedback. */
export function diffWords(typed: string, expected: string): DiffToken[] {
  const a = normalizeAnswer(typed).split(' ').filter(Boolean);
  const b = expected.replace(/\s+/g, ' ').trim().split(' ');
  const bNorm = b.map((word) => normalizeAnswer(word));
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] = a[i] === bNorm[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === bNorm[j]) {
      tokens.push({ text: b[j]!, kind: 'ok' });
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || table[i]![j + 1]! >= table[i + 1]![j]!)) {
      tokens.push({ text: b[j]!, kind: 'missing' });
      j++;
    } else {
      tokens.push({ text: a[i]!, kind: 'extra' });
      i++;
    }
  }
  return tokens;
}
