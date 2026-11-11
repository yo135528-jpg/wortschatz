import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test.beforeEach(async ({ page }) => {
  await openApp(page, { hash: '#/study/review' });
  await expect(page.getByTestId('card')).toBeVisible();
});

test('flips the card with a click and with Space', async ({ page }) => {
  const card = page.getByTestId('card');
  await expect(card.getByTestId('back')).toBeHidden();

  await card.click();
  await expect(card).toHaveClass(/is-flipped/);
  await expect(card.getByTestId('back')).toBeVisible();
  await expect(page.getByTestId('rate-good')).toBeVisible();

  // Next card via keyboard: Space flips.
  await page.keyboard.press('3');
  await expect(page.getByTestId('card')).not.toHaveClass(/is-flipped/);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('card')).toHaveClass(/is-flipped/);
});

test('rating a card moves to the next one and shows intervals', async ({ page }) => {
  const firstKey = await page.getByTestId('card').getAttribute('data-key');
  await expect(page.getByTestId('remaining')).toHaveText('5 kart kaldı');

  await page.getByTestId('show-answer').click();
  await expect(page.getByTestId('rate-easy')).toContainText(/\d+ (dk|sa|gün|ay|yıl)/);
  await page.getByTestId('rate-good').click();

  await expect(page.getByTestId('card')).not.toHaveAttribute('data-key', firstKey!);
  await expect(page.getByTestId('remaining')).toHaveText('4 kart kaldı');

  await page.getByTestId('tab-progress').click();
  await expect(page.getByTestId('stat-learned')).toHaveText('1');
});

test('mode toggle filters the queue by direction and is remembered', async ({ page }) => {
  // Mixed mode: one direction per new note per day, starting with de2tr.
  await expect(page.getByTestId('card')).toHaveAttribute('data-direction', 'de2tr');

  await page.getByTestId('mode-tr2de').click();
  await expect(page.getByTestId('mode-tr2de')).toHaveAttribute('aria-pressed', 'true');
  const card = page.getByTestId('card');
  await expect(card).toHaveAttribute('data-direction', 'tr2de');
  // tr2de front shows the Turkish meaning, not the German headword.
  await expect(card.getByTestId('front').getByTestId('meaning')).toHaveText('karar');
  await expect(card.getByTestId('front').getByTestId('headword')).toHaveCount(0);

  await openApp(page, { reload: true });
  await expect(page.getByTestId('card')).toHaveAttribute('data-direction', 'tr2de');
});

test('back side shows the Turkish translation of examples in both directions', async ({ page }) => {
  for (const mode of ['mode-de2tr', 'mode-tr2de'] as const) {
    await page.getByTestId(mode).click();
    const card = page.getByTestId('card');
    await card.click();
    await expect(card.getByTestId('back').getByTestId('example-tr').first()).toBeVisible();
  }
});

test('tr2de back solves the same gap sentence and translates it', async ({ page }) => {
  await page.getByTestId('mode-tr2de').click();
  const card = page.getByTestId('card');
  // Fixture "entscheidung-86e2": "[Die] [Entscheidung] für das neue Projekt fiel uns nicht leicht."
  await expect(card.getByTestId('front').getByTestId('cloze')).toHaveText(
    '___ ___ für das neue Projekt fiel uns nicht leicht.',
  );

  await card.click();
  const solution = card.getByTestId('back').getByTestId('cloze-solution');
  await expect(solution).toContainText('Die Entscheidung für das neue Projekt fiel uns nicht leicht.');
  await expect(solution.locator('mark')).toHaveText(['Die', 'Entscheidung']);
  await expect(solution.getByTestId('cloze-tr')).toHaveText('Yeni proje için karar vermek bize kolay gelmedi.');
});

test('undo brings back the last rated card', async ({ page }) => {
  const firstKey = await page.getByTestId('card').getAttribute('data-key');
  await expect(page.getByTestId('undo')).toBeDisabled();
  await page.getByTestId('show-answer').click();
  await page.getByTestId('rate-good').click();
  await expect(page.getByTestId('remaining')).toHaveText('4 kart kaldı');

  await page.getByTestId('undo').click();
  await expect(page.getByTestId('card')).toHaveAttribute('data-key', firstKey!);
  await expect(page.getByTestId('remaining')).toHaveText('5 kart kaldı');
  await expect(page.getByTestId('undo')).toBeDisabled();
});

test('typed answers: tr2de card checks the typed gap words', async ({ page }) => {
  await page.getByTestId('mode-tr2de').click();
  await page.getByTestId('review-options').click();
  await page.getByTestId('type-answers').check();
  const key = await page.getByTestId('card').getAttribute('data-key');
  // Fixture cloze answers per note (gap words in reading order).
  const answers: Record<string, string> = {
    'entscheidung-86e2:tr2de': 'Die Entscheidung',
    'entscheiden-bb52:tr2de': 'für entschieden',
    'teilnehmen-2109:tr2de': 'nehmen an teil',
  };
  await page.getByTestId('type-input').fill(answers[key!] ?? 'falsch');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('card')).toHaveClass(/is-flipped/);
  await expect(page.getByTestId('typed-verdict')).toHaveClass(answers[key!] ? /is-correct/ : /is-wrong/);
});

test('scope filter is remembered', async ({ page }) => {
  // All fixture notes share one source, so the queue size stays the same; the choice must persist.
  await page.getByTestId('review-options').click();
  await page.getByTestId('review-scope').selectOption({ label: 'Seed example' });
  await expect(page.getByTestId('remaining')).toHaveText('5 kart kaldı');
  await openApp(page, { reload: true });
  await expect(page.getByTestId('review-scope')).toHaveValue('c:Seed example');
});
