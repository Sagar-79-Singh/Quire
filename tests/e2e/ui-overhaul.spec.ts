import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({ args: ['dist-electron/main/index.js'] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});
test.afterAll(async () => { await app?.close(); });

async function setSize(width: number, height: number): Promise<void> {
  await app.evaluate(({ BrowserWindow }, bounds) => {
    const window = BrowserWindow.getAllWindows()[0];
    window?.setBounds({ x: 0, y: 0, ...bounds });
    window?.show();
    window?.focus();
  }, { width, height });
  await page.setViewportSize({ width, height });
}
async function openBlank(): Promise<void> {
  const blank = page.getByRole('button', { name: 'Blank document', exact: true });
  if (await blank.isVisible().catch(() => false)) await blank.click();
  await expect(page.getByRole('textbox', { name: 'Document content' })).toBeVisible({ timeout: 15000 });
}
async function rect(selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const value = element.getBoundingClientRect();
    return { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom };
  });
}

for (const size of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
  test(`phase 6 layout at ${size.width}x${size.height}`, async () => {
    await setSize(size.width, size.height);
    await openBlank();
    const title = await rect('.title-bar');
    const tabs = await rect('.file-tabline');
    const ribbonTabs = await rect('.ribbon-tabline');
    const ribbon = await rect('.ribbon-surface');
    const status = await rect('.status-bar');
    expect(title.height).toBe(32);
    expect(tabs.height).toBe(32);
    expect(ribbonTabs.height).toBe(32);
    expect(ribbon.height).toBe(90);
    expect(status.height).toBe(22);
    expect(Math.abs(tabs.y - title.bottom)).toBeLessThanOrEqual(2);
    expect(Math.abs(ribbonTabs.y - tabs.bottom)).toBeLessThanOrEqual(2);
    expect(Math.abs(ribbon.y - ribbonTabs.bottom)).toBeLessThanOrEqual(2);
    expect(Math.abs(status.bottom - size.height)).toBeLessThanOrEqual(2);

    const small = await page.locator('.ribbon-surface .ribbon-button-sm').evaluateAll((buttons) => buttons.map((button) => { const r = button.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
    for (const button of small) { expect(button.width).toBeLessThanOrEqual(24); expect(button.height).toBeLessThanOrEqual(24); }
    const family = await rect('.font-family');
    const fontSize = await rect('.font-size');
    expect(family.y + family.height).toBeLessThanOrEqual(ribbon.y + 58 + 1);
    expect(fontSize.y + fontSize.height).toBeLessThanOrEqual(ribbon.y + 58 + 1);
    const overflowing = await page.locator('.ribbon-surface').evaluate((element) => Array.from(element.querySelectorAll('*')).filter((child) => child instanceof HTMLElement && child.tagName !== 'OPTION' && child.scrollWidth > child.clientWidth + 1).map((child) => `${child.tagName}.${child.className}`));
    if (overflowing.length) process.stdout.write(`RIBBOW_OVERFLOW ${JSON.stringify(overflowing)}\n`);
    expect(overflowing).toHaveLength(0);

    const hiddenCount = await page.locator('.ribbon-surface').evaluate((element) => (element.getAttribute('data-hidden-groups') ?? '').split(',').filter(Boolean).length);
    if (size.width === 1920) expect(hiddenCount).toBe(0);
    else expect(hiddenCount).toBeLessThanOrEqual(2);
    const more = page.getByRole('button', { name: 'More commands' });
    if (hiddenCount === 0) await expect(more).toBeDisabled();
    else { await more.click(); await expect(page.getByRole('dialog', { name: 'More commands' })).toBeVisible(); await page.keyboard.press('Escape'); }

    const horizontal = await rect('.ruler-horizontal');
    const vertical = await rect('.ruler-vertical');
    const paper = await rect('.paper-page');
    expect(Math.abs(horizontal.x - paper.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(horizontal.right - paper.right)).toBeLessThanOrEqual(1);
    expect(horizontal.height).toBe(20);
    expect(Math.abs(vertical.x - (paper.x - 20))).toBeLessThanOrEqual(1);
    expect(Math.abs(vertical.y - paper.y)).toBeLessThanOrEqual(1);

    await expect(page.locator('[data-document-name]')).toHaveCount(1);
    await page.getByRole('tab', { name: 'File', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'File' })).toBeVisible();
    await page.keyboard.press('Escape');

    const editor = page.getByRole('textbox', { name: 'Document content' });
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-testid="writer-editor"]');
      if (!root) return;
      root.innerHTML = Array.from({ length: 80 }, (_, index) => `<p data-block="overflow-${index}">Paragraph ${index + 1} with enough words to occupy a real line on the page.</p>`).join('');
      root.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('.status-left')).toContainText(/Page 1 of [2-9]/, { timeout: 15000 });
    await page.locator('.pages-scroll').evaluate((element) => { element.scrollTop = element.scrollHeight; });
    const lastPage = await page.locator('.paper-page').last().boundingBox();
    expect(lastPage).not.toBeNull();
    if (lastPage) expect(lastPage.y + lastPage.height).toBeLessThanOrEqual(size.height - 22 + 24);

    const before = await rect('.paper-page');
    await page.locator('.pages-scroll').hover();
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await expect.poll(async () => (await rect('.paper-page')).width).toBeGreaterThan(before.width);
    const after = await rect('.paper-page');
    const rulerAfter = await rect('.ruler-horizontal');
    expect(Math.abs(rulerAfter.width - after.width)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Control+Shift+P');
    await expect.poll(async () => (await rect('.right-panel')).width).toBeGreaterThanOrEqual(319);
    await page.keyboard.press('Control+Shift+P');
    await expect.poll(async () => (await rect('.right-panel')).width).toBeLessThanOrEqual(1);
    await page.keyboard.press('Control+F1');
    await expect(page.locator('.ribbon-surface')).toHaveClass(/is-expanded/);
    await expect.poll(async () => (await rect('.ribbon-surface')).height).toBe(140);
    await page.keyboard.press('Control+F1');
    await expect.poll(async () => (await rect('.ribbon-surface')).height).toBe(90);

    await page.getByRole('combobox', { name: 'Search for tools and actions' }).fill('Dark theme');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const secondary = await page.locator('.ribbon-group-label').first().evaluate((element) => getComputedStyle(element).color);
    expect(secondary).not.toBe('');
  });
}
