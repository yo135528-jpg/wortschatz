# Wortschatz

Mobile-first German vocabulary flashcards (DE ⇄ TR) with FSRS scheduling ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)).

- Card content: `src/data/cards.json` (validated with zod, see `CLAUDE.md` for the card-writing rules).
- Review state: IndexedDB in the browser. Use **Ayarlar → Dışa aktar / İçe aktar** for backups and moving between devices.

```bash
npm install
npm run dev        # local dev server
npm run validate   # validate cards.json
npm test           # unit tests (Vitest)
npm run e2e        # e2e tests (Playwright)
npm run build      # production build in dist/
```

Deployment: every push to `main` runs the tests and deploys `dist/` to GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).
