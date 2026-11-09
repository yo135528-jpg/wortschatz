# Wortschatz — German learning app

Static Vite + TypeScript app (no framework), deployed to GitHub Pages. Started as flashcards; now a learning app with several sections (cards, grammar, street German). Design new features as part of a learning app, not only as card features. Scheduling uses `ts-fsrs` (FSRS-7 via `DefaultScheduler`); never hand-roll the algorithm.

## Architecture (short)
- `src/data/cards.json` = CONTENT only (notes). Written by Claude, committed to git.
- Review STATE lives in the browser's IndexedDB, keyed `"<noteId>:<direction>"`.
- `src/storage/merge.ts` (pure): new cards get fresh state, existing state is never overwritten, removed notes are ignored (state kept).
- Grammar reference (Gramer tab): `src/data/grammar/{a1,a2,b1,b2}.ts`, typed + zod-validated (`src/domain/grammar.ts`), validated by `npm run validate`. Explanations in Turkish, examples in German with natural Turkish. When a book chapter teaches a topic, set `book` on it and keep content consistent with the cards.
- Street German (Sokak tab): `src/data/street/*.ts`, typed + zod-validated (`src/domain/street.ts`), validated by `npm run validate`. Topic by topic, each phrase has a `register` (`alltag`, `locker`, `jugend`, `regional` + `region`, `derb`), natural Turkish `tr`, optional `standard` (written form), `example`, `note`. Only real, current spoken German; when unsure about a phrase, leave it out.
- Each note produces up to two cards, `de2tr` and `tr2de`, each with its own FSRS state.
- Tests never depend on real content: unit and e2e tests use `tests/fixtures/notes.json` (e2e via `vite --mode e2e` alias). Add/remove words freely.
- Commands: `npm run validate` · `npm test` (Vitest) · `npm run e2e` (Playwright) · `npm run build` · `npm run new-id -- "<lemma>" <type> [gender]`.

## Language
- User is a native Turkish speaker (German ~B1/B2). Talk to the user in Turkish.
- Code, identifiers and code comments in English.

## Git
- The user is the only author. NEVER add "Co-Authored-By", "Generated with Claude Code" or any AI attribution.
- Never commit/push without explicit approval; show the commit message first. Never work on `main`.

---

# HOW TO WRITE CARDS (most important)

Cards are optimized for LEARNING, not translation. One thing to recall per card. No walls of text.

## Workflow for every new word
1. **Find the lemma** (base form): noun singular, verb infinitive, adjective base form. Use the book sentence to pick the meaning that fits that context.
2. **Check for duplicates/variants** in `cards.json` (same lemma, same word family, same expression). If the word already exists: ENRICH that note (add a book example, a missing Rektion, a note) instead of creating a new one. Never change an existing `id`.
3. **Decide the note type** and whether a fixed expression deserves its OWN note (see below).
4. **Generate the id** with `npm run new-id -- "<lemma>" <type> [gender]`. The id is frozen forever after creation.
5. Write the note, then run `npm run validate`. Fix every error before finishing.

## Per word type
- **Noun** (`type: "noun"`): `noun.gender` (der/die/das) + `noun.plural` in dictionary notation: `"-en"`, `"-e"`, `"¨-e"`, `"-"` (no change), `"-s"`, or `null` if there is no plural (Singularetantum). The UI renders `die Entscheidung, -en` and colors the gender. Add `rektion` if the noun has a typical preposition (`die Angst vor + Dat`).
- **Verb** (`type: "verb"`):
  - `praeteritum` (3rd person singular, separable written apart: `"nahm teil"`), `partizip2`, `auxiliary` (`haben` / `sein` / `haben/sein`).
  - `separablePrefix` for separable verbs (`"teil"` for `teilnehmen`), `null` otherwise. Inseparable prefixes (be-, ver-, ent-, er-, ge-, miss-, zer-) are never separable.
  - `reflexive`: `"Akk"` (sich entscheiden) or `"Dat"` (sich etwas vorstellen), `null` if not reflexive.
  - `rektion`: preposition + case (`{ "preposition": "für", "case": "Akk" }`), or a bare case with `"preposition": null` (`helfen + Dat`). Multiple entries are allowed if both are common.
- **Adjective** (`type: "adjective"`): `rektion` if it takes a preposition/case (`stolz auf + Akk`). Fill `adjective.comparative`/`superlative` ONLY for irregular forms (`gut → besser, besten`; superlative WITHOUT "am", the UI adds it). Otherwise `null`.
- **Expression** (`type: "expression"`): fixed phrases and Nomen-Verb-Verbindungen (`eine Entscheidung treffen`, `in Frage kommen`, `zur Verfügung stehen`). Give them their OWN note, even if the noun has a note too. `lemma` is the full phrase in its dictionary form.
- **Other** (`type: "other"`): adverbs, conjunctions, particles, prepositions.

## Fields of every note
- `meaningTr`: concise Turkish meaning. FIRST the meaning that fits the book context. Max ~2 short alternatives, separated by commas. Use parentheses for the object: `(bir şeye) katılmak`.
- `hintTr`: short Turkish hint shown on the tr2de front so there is exactly ONE correct German answer. Usually the word type plus what is special: `"isim"`, `"fiil, dönüşlü + edat"`, `"fiil, ayrılabilir"`, `"sıfat + edat"`, `"isim + fiil kalıbı"`. If two notes share a Turkish meaning (e.g. "karar vermek" = `sich entscheiden` and `eine Entscheidung treffen`), the hint and cloze MUST tell them apart.
- `cloze`: German gap sentence for tr2de. Write each answer in square brackets, one bracket per word: `"Wir [nehmen] an dem Kurs [teil]."`. The front shows `Wir ___ an dem Kurs ___.`, the back shows the SAME sentence solved with the answers highlighted. Never write `___` yourself (the validator rejects it). Rules:
  - The text outside the brackets must not contain the answer (the validator checks the lemma).
  - For nouns put the article in brackets too (`"[Die] [Entscheidung] fiel uns schwer."`), otherwise the article is given away (the validator checks this).
  - For separable verbs, one bracket per part (`"Wir [nehmen] an dem Kurs [teil]."`).
  - Prefer a sentence different from the examples, so the back adds context instead of repeating it.
- `clozeTr`: natural Turkish translation of the SOLVED cloze sentence (required when there is a cloze), shown under it on the tr2de back.
- `examples` (1–3):
  - If the user gives a book sentence: use it with `"fromBook": true` (fix obvious typos only).
  - Add ONE new natural B2-level sentence (`"fromBook": false`) that shows the Rektion/typical use.
  - `tr`: natural Turkish translation (shown on the back in both directions).
- `grammarTr`: short Turkish grammar explanation where it really helps (word order of two-part conjunctions, verb position after `obwohl`, adjectival nouns, n-Deklination, haben/sein choice, declension like `denselben`). Show forms with a tiny example. Otherwise omit it (defaults to `null`). Grammar goes HERE, not in `note`.
- `note`: only when it really matters: false friends (`aktuell` ≠ aktüel → "güncel"), confusables (`seit` vs `seid`), register (`umgangssprachlich`, `gehoben`), a common mistake (`eine Entscheidung machen` ✗). Otherwise `null`. One sentence, in Turkish.
- `directions`: default `["de2tr", "tr2de"]`. Use only `["de2tr"]` for words the user only needs to recognize (very rare/literary words), and say so in the summary.
- `source`: e.g. `"B2 book, Kapitel 3"` (ask once if the chapter is unknown, then reuse it).
- `tags`: lowercase, kebab-case: chapter (`kapitel-3`), topic (`arbeit`, `umwelt`), `nomen-verb` for Nomen-Verb-Verbindungen.
- `createdAt`: today's date `YYYY-MM-DD`.

## What the card faces show (rendered by the app — do not duplicate)
- de2tr front: headword with article/plural/Rektion/verb forms. Back: Turkish meaning + examples (with `tr`) + grammar + note.
- tr2de front: `hintTr` + `meaningTr` + `cloze` (no other German). Back: full German headword + solved cloze with `clozeTr` + examples (with `tr`) + grammar + note.
- `source`, `tags`, `id` are NOT shown to the user (only used for search and bookkeeping).

## Quality checklist before finishing
- [ ] Lemma correct, gender/plural/verb forms double-checked (when unsure, say so instead of guessing).
- [ ] No duplicate; existing notes enriched where appropriate.
- [ ] tr2de has exactly one correct answer (hint + cloze).
- [ ] `npm run validate` passes.
- [ ] Short summary shown to the user (see `.claude/commands/add.md`).
