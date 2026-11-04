import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { exportDocx } from '../../src/apps/writer/docx';
import { defaultSettings } from '../../src/apps/writer/model';

let app: ElectronApplication; let page: Page;
test.beforeAll(async () => { globalThis.DOMParser = new JSDOM().window.DOMParser; app = await electron.launch({ args: ['dist-electron/main/index.js'] }); page = await app.firstWindow(); });
test.afterAll(async () => { await app?.close(); });

test('creates, edits, formats and switches Writer tabs', async () => {
  await page.getByRole('button', { name: 'Blank document', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Document content' }); await expect(editor).toBeVisible();
  await editor.click(); await page.keyboard.type('Quire offline writer'); await expect(editor).toContainText('Quire offline writer');
  await page.keyboard.press('Control+A'); await page.getByRole('tab', { name: 'Home', exact: true }).click(); await page.getByRole('button', { name: 'Bold', exact: true }).first().click();
  await expect(editor.locator('b, strong')).toHaveCount(1);
  await page.getByRole('button', { name: 'New document', exact: true }).last().click(); await expect(page.getByRole('tablist', { name: 'Open documents' }).getByRole('tab')).toHaveCount(2);
});

test('opens a DOCX fixture and exports a PDF through native dialogs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'quire-e2e-'));
  const docxPath = join(dir, 'fixture.docx'); const bytes = await exportDocx({ html: '<h1>Fixture</h1><p>Round trip content.</p>', settings: defaultSettings }, 'Fixture'); await writeFile(docxPath, new Uint8Array(bytes));
  await app.evaluate(async ({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, docxPath);
  await page.keyboard.press('Control+O'); await expect(page.getByRole('textbox', { name: 'Document content' })).toContainText('Round trip content.');
  const pdfPath = join(dir, 'export.pdf');
  await app.evaluate(async ({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, pdfPath);
  await page.getByRole('button', { name: 'File', exact: true }).click(); await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  await expect.poll(async () => app.evaluate(async (_electron, path) => { const { stat } = await import('node:fs/promises'); try { return (await stat(path)).size; } catch { return 0; } }, pdfPath)).toBeGreaterThan(1000);
});

test('changes theme, zoom and ribbon mode without losing content', async () => {
  await page.getByRole('tab', { name: 'View', exact: true }).click(); await page.getByRole('button', { name: 'Zoom in', exact: true }).first().click();
  await page.getByRole('button', { name: 'Classic ribbon', exact: true }).click(); await expect(page.locator('.ribbon-surface')).toHaveClass(/expanded/);
  await page.getByRole('combobox', { name: 'Search for tools and actions' }).fill('Dark theme'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
