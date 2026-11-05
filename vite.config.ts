import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base works on GitHub Pages regardless of the repository name.
  base: './',
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
