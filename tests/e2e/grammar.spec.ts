import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('grammar tab: filter by level, open a topic and go back', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('tab-grammar').click();

  const topics = page.getByTestId('grammar-topic');
  await expect(topics.first()).toBeVisible();

  await page.getByTestId('grammar-level-B2').click();
  const levels = await topics.evaluateAll((items) => items.map((item) => item.getAttribute('data-level')));
  expect(levels.length).toBeGreaterThan(0);
  expect(new Set(levels)).toEqual(new Set(['B2']));

  const id = await topics.first().getAttribute('data-id');
  await topics.first().click();
  await expect(page.getByTestId('grammar-detail')).toHaveAttribute('data-id', id!);

  await page.getByTestId('grammar-back').click();
  await expect(page.getByTestId('grammar-level-B2')).toHaveAttribute('aria-pressed', 'true');
});

test('grammar search finds a topic by an example word', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('tab-grammar').click();
  await page.getByTestId('grammar-search').fill('weder');
  await expect(page.locator('[data-testid="grammar-topic"][data-id="zweiteilige-konnektoren"]')).toBeVisible();
});
