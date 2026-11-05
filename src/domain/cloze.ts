/**
 * Cloze sentences mark each answer in square brackets:
 *   "Wir [nehmen] an dem Kurs [teil]."
 * The front shows the gaps ("Wir ___ an dem Kurs ___."), the back the full sentence
 * with the answers highlighted, so the learner can check exactly what they tried.
 */

export type ClozePart = { kind: 'text'; value: string } | { kind: 'gap'; answer: string };

const GAP = /\[([^[\]]+)\]/g;

/** Splits a cloze into plain text and gaps, in reading order. */
export function parseCloze(cloze: string): ClozePart[] {
  const parts: ClozePart[] = [];
  let last = 0;
  for (const match of cloze.matchAll(GAP)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: 'text', value: cloze.slice(last, index) });
    parts.push({ kind: 'gap', answer: (match[1] ?? '').trim() });
    last = index + match[0].length;
  }
  if (last < cloze.length) parts.push({ kind: 'text', value: cloze.slice(last) });
  return parts;
}

/** Front-side text: every gap replaced by "___". */
export function clozeWithGaps(cloze: string): string {
  return cloze.replace(GAP, '___');
}

/** Back-side text: brackets removed, answers filled in. Also used for speech. */
export function clozeSolved(cloze: string): string {
  return cloze.replace(GAP, '$1');
}

/** The answers in reading order. */
export function clozeAnswers(cloze: string): string[] {
  return parseCloze(cloze).flatMap((part) => (part.kind === 'gap' ? [part.answer] : []));
}

/** Problems with the cloze syntax itself; empty when it is well formed. */
export function clozeSyntaxErrors(cloze: string): string[] {
  const errors: string[] = [];
  if (cloze.includes('___')) errors.push('use [answer] instead of "___" to mark a gap');
  if (clozeAnswers(cloze).length === 0) errors.push('cloze needs at least one [answer] gap');
  if (/[[\]]/.test(cloze.replace(GAP, ''))) errors.push('cloze has an unbalanced or nested bracket');
  return errors;
}
