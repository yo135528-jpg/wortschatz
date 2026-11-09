import { expect, type Page } from '@playwright/test';

/** Opens (or reloads) the app, optionally on a route like '#/study/review', and waits until it is interactive. */
export async function openApp(page: Page, options: { reload?: boolean; hash?: string } = {}): Promise<void> {
  if (options.reload) await page.reload();
  else await page.goto(`/${options.hash ?? ''}`);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
}
