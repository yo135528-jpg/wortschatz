import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('street tab: open a topic, see phrases, go back', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('tab-library').click();
  await page.getByTestId('lib-street').click();
  await expect(page.getByTestId('mode-tr2de')).toBeHidden();

  const topics = page.getByTestId('street-topic');
  await expect(topics.first()).toBeVisible();
  const id = await topics.first().getAttribute('data-id');
  await topics.first().click();

  await expect(page.getByTestId('street-detail')).toHaveAttribute('data-id', id!);
  await expect(page.getByTestId('street-phrase').first()).toBeVisible();

  await page.getByTestId('street-back').click();
  await expect(topics.first()).toBeVisible();
});

test('street search and register filter show matching phrases', async ({ page }) => {
  await openApp(page, { hash: '#/library/street' });

  await page.getByTestId('street-search').fill('pleite');
  await expect(page.getByTestId('street-phrase').filter({ hasText: 'Ich bin pleite.' })).toBeVisible();

  await page.getByTestId('street-search').fill('');
  await page.getByTestId('street-register-derb').click();
  const phrases = page.getByTestId('street-phrase');
  await expect(phrases.first()).toBeVisible();
  const classes = await phrases.evaluateAll((items) => items.map((item) => item.className));
  expect(classes.every((name) => name.includes('r-derb'))).toBe(true);
});

test('a street phrase can be added to the cards and survives a reload', async ({ page }) => {
  await openApp(page, { hash: '#/library/street/geld' });
  const phrase = page.getByTestId('street-phrase').filter({ hasText: 'Ich bin pleite.' });
  await phrase.getByTestId('add-card').click();
  await expect(phrase.getByTestId('add-card')).toHaveText('✓ Kartlarda');

  await openApp(page, { hash: '#/library/words', reload: false });
  await page.getByTestId('search').fill('pleite');
  await expect(page.getByTestId('note-item')).toHaveCount(1);

  // After a reload the search is empty: 5 fixture words + the added phrase.
  await openApp(page, { reload: true });
  await expect(page.getByTestId('note-item')).toHaveCount(6);
  await expect(page.locator('[data-testid="note-item"]').filter({ hasText: 'Ich bin pleite.' })).toHaveCount(1);
});
