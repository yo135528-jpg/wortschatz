import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('export/import round-trip restores review state', async ({ page }, testInfo) => {
  await openApp(page);

  // Review two cards so there is state worth backing up.
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('show-answer').click();
    await page.getByTestId('rate-good').click();
  }

  await page.getByTestId('tab-settings').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^wortschatz-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = testInfo.outputPath('backup.json');
  await download.saveAs(backupPath);

  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.format).toBe('wortschatz-backup');
  expect(backup.logs).toHaveLength(2);

  // Wipe the browser database to simulate a new device.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wortschatz');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      }),
  );
  await openApp(page, { reload: true });
  await page.getByTestId('tab-stats').click();
  await expect(page.getByTestId('stat-learned')).toHaveText('0');

  // Import the backup.
  await page.getByTestId('tab-settings').click();
  page.once('dialog', (dialog) => dialog.accept());
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('import').click();
  await (await chooserPromise).setFiles(backupPath);
  await expect(page.getByTestId('backup-status')).toHaveText('✓ İçe aktarıldı.');

  await page.getByTestId('tab-stats').click();
  await expect(page.getByTestId('stat-learned')).toHaveText('2');
});

test('import rejects an invalid file', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('tab-settings').click();
  page.once('dialog', (dialog) => dialog.accept());
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('import').click();
  await (await chooserPromise).setFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": 1}'),
  });
  await expect(page.getByTestId('backup-status')).toContainText('✗');
});
