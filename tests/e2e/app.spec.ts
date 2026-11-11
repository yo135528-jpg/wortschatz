import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('today screen starts a review and the back button returns', async ({ page }) => {
  await openApp(page);
  await expect(page.getByTestId('today-plan')).toContainText('5 kart');
  await expect(page.getByTestId('daily-phrase')).toBeVisible();

  await page.getByTestId('start-review').click();
  await expect(page.getByTestId('card')).toBeVisible();
  await expect(page.getByTestId('mode-mixed')).toBeVisible();

  await page.goBack();
  await expect(page.getByTestId('today-plan')).toBeVisible();
  await expect(page.getByTestId('mode-mixed')).toBeHidden();
});

test('back button closes a grammar topic instead of leaving the app', async ({ page }) => {
  await openApp(page, { hash: '#/library/grammar' });
  const first = page.getByTestId('grammar-topic').first();
  const id = await first.getAttribute('data-id');
  await first.click();
  await expect(page).toHaveURL(new RegExp(`#/library/grammar/${id}$`));

  await page.goBack();
  await expect(page.getByTestId('grammar-list')).toBeVisible();
  await expect(page.getByTestId('lib-grammar')).toHaveAttribute('aria-current', 'true');
});

test('artikel drill: answer, get feedback, finish the round', async ({ page }) => {
  await openApp(page, { hash: '#/study' });
  await page.getByTestId('study-artikel').click();
  await page.getByTestId('drill-go').click();

  // Fixture has two nouns; answer every question with "die" until the summary shows.
  for (let i = 0; i < 6; i++) {
    if (await page.getByTestId('drill-done').isVisible()) break;
    await page.getByTestId('drill-choice').filter({ hasText: /^die$/ }).click();
    await expect(page.getByTestId('drill-feedback')).toBeVisible();
    await page.getByTestId('drill-next').click();
  }
  await expect(page.getByTestId('drill-done')).toContainText('doğru');
});

test('typing drill accepts the right answer with Enter', async ({ page }) => {
  await openApp(page, { hash: '#/study/schreiben' });
  await page.getByTestId('drill-go').click();
  const question = page.getByTestId('drill-question');
  const id = await question.getAttribute('data-id');
  const answers: Record<string, string> = {
    'entscheidung-86e2': 'die Entscheidung',
    'entscheiden-bb52': 'sich entscheiden',
    'teilnehmen-2109': 'teilnehmen',
  };
  await page.getByTestId('drill-input-0').fill(answers[id!] ?? 'xyz');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('drill-feedback')).toHaveClass(answers[id!] ? /is-correct/ : /is-wrong/);
});

test('global search finds words, grammar and street phrases', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('global-search').fill('Entscheidung');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('search-word').first()).toContainText('Entscheidung');

  await page.getByTestId('search-word').first().click();
  await expect(page.locator('[data-testid="note-item"][data-id="entscheidung-86e2"]')).toHaveClass(/open/);
});

test('a word links to its grammar topic and the topic lists the word back', async ({ page }) => {
  await openApp(page, { hash: '#/library/words/entscheiden-bb52' });
  const links = page.locator('[data-testid="note-item"][data-id="entscheiden-bb52"] [data-testid="grammar-links"]');
  await links.getByRole('link', { name: /Reflexive|reflexive/i }).click();
  await expect(page.getByTestId('grammar-detail')).toHaveAttribute('data-id', 'reflexive-verben');
  await expect(page.getByTestId('grammar-words')).toContainText('entscheiden');
});

test('adjective drill explains the ending and a weak skill shows up in the study hub', async ({ page }) => {
  await openApp(page, { hash: '#/study' });
  await expect(page.getByTestId('weak-spots')).toBeHidden();
  await page.getByTestId('study-adjektiv').click();
  await page.getByTestId('drill-go').click();

  // Always answering "-es" is mostly wrong, so the skill ends up weak.
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('drill-done').isVisible()) break;
    await expect(page.getByTestId('drill-question')).toContainText('___');
    await page.getByTestId('drill-choice').filter({ hasText: /^-es$/ }).click();
    await expect(page.getByTestId('drill-feedback')).toContainText('→');
    await page.getByTestId('drill-next').click();
  }
  await expect(page.getByTestId('drill-done')).toBeVisible();

  await page.getByTestId('drill-back').click();
  await expect(page.getByTestId('weak-spots')).toContainText('Sıfat çekimi');
});
