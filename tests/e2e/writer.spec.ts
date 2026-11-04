import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { exportDocx } from '../../src/apps/writer/docx';
import { defaultSettings } from '../../src/apps/writer/model';

let app: ElectronApplication; let page: Page;
const consoleErrors: string[] = [];
test.beforeAll(async () => {
  globalThis.DOMParser = new JSDOM().window.DOMParser;
  app = await electron.launch({ args: ['dist-electron/main/index.js'] });
  page = await app.firstWindow();
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.waitForLoadState('domcontentloaded');
  await app.evaluate(({ BrowserWindow }) => { const window = BrowserWindow.getAllWindows()[0]; window?.setBounds({ x: 0, y: 0, width: 1440, height: 940 }); window?.show(); window?.focus(); });
});
test.afterEach(async ({ headless: _headless }, testInfo) => {
  void _headless;
  if (testInfo.status === testInfo.expectedStatus) return;
  process.stdout.write(`E2E URL ${page.url()}\n`);
  process.stdout.write(`E2E CONSOLE ${JSON.stringify(consoleErrors.slice(0, 20))}\n`);
  process.stdout.write(`E2E BODY ${(await page.locator('body').innerText().catch(() => '')).slice(0, 2000)}\n`);
  process.stdout.write(`E2E HTML ${(await page.content().catch(() => '')).slice(0, 4000)}\n`);
  const state = await page.evaluate(() => {
    const root = document.querySelector('#root');
    const home = document.querySelector('.home-screen');
    const blank = Array.from(document.querySelectorAll('button')).find((button) => button.getAttribute('aria-label') === 'Blank document');
    const rect = (element: Element | null | undefined) => { if (!element) return null; const value = element.getBoundingClientRect(); return { x: value.x, y: value.y, width: value.width, height: value.height }; };
    return { title: document.title, rootChildren: root?.childElementCount ?? 0, home: Boolean(home), homeRect: rect(home), blankRect: rect(blank), blankDisabled: blank instanceof HTMLButtonElement ? blank.disabled : null, bodyText: document.body.textContent?.slice(0, 1200) ?? '', innerWidth: window.innerWidth, innerHeight: window.innerHeight, devicePixelRatio: window.devicePixelRatio };
  }).catch((error: unknown) => ({ error: String(error) }));
  process.stdout.write(`E2E STATE ${JSON.stringify(state)}\n`);
});
test.afterAll(async () => { await app?.close(); });

test('creates, edits, formats and switches Writer tabs', async () => {
  await expect(page.getByRole('button', { name: 'Blank document', exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Blank document', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Document content' }); await expect(editor).toBeVisible();
  await editor.click(); await page.keyboard.type('Quire offline writer'); await expect(editor).toContainText('Quire offline writer');
  await page.keyboard.press('Control+A'); await page.keyboard.press('Control+B');
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
