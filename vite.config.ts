import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// E2E tests run against stable fixture notes, so adding or removing real words never breaks them.
const fixtureNotes = fileURLToPath(new URL('./tests/fixtures/notes.json', import.meta.url));

export default defineConfig(({ mode }) => ({
  // Relative base works on GitHub Pages regardless of the repository name.
  base: './',
  resolve: {
    alias: mode === 'e2e' ? [{ find: /^.*\/data\/cards\.json$/, replacement: fixtureNotes }] : [],
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
}));
