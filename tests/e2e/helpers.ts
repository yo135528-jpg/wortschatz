import { expect, type Page } from '@playwright/test';

/** Opens (or reloads) the app and waits until it is interactive. */
export async function openApp(page: Page, options: { reload?: boolean } = {}): Promise<void> {
  if (options.reload) await page.reload();
  else await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
}
