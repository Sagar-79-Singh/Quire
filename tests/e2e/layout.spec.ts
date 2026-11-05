import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Locator, Page } from '@playwright/test';

let app: ElectronApplication;
let page: Page;

async function setWindowSize(width: number, height: number): Promise<void> {
  await app.evaluate(({ BrowserWindow }, size) => {
    const window = BrowserWindow.getAllWindows()[0];
    window?.setBounds({ x: 0, y: 0, ...size });
    window?.show();
    window?.focus();
  }, { width, height });
  await page.setViewportSize({ width, height });
}

async function openBlankDocument(): Promise<void> {
  const blank = page.getByRole('button', { name: 'Blank document', exact: true });
  if (await blank.isVisible().catch(() => false)) await blank.click();
  await expect(page.getByRole('textbox', { name: 'Document content' })).toBeVisible({ timeout: 15000 });
}

async function requiredBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected a visible layout element.');
  return box;
}

async function rect(locator: Locator): Promise<{ x: number; y: number; width: number; height: number; right: number; bottom: number }> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
  });
}

test.beforeAll(async () => {
  app = await electron.launch({ args: ['dist-electron/main/index.js'] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await setWindowSize(1920, 1080);
});

test.afterAll(async () => { await app?.close(); });

test('keeps system fonts, rulers and ribbon groups aligned', async () => {
  await openBlankDocument();

  const fontTrigger = page.getByRole('button', { name: 'Font family' });
  const fontChevron = fontTrigger.locator('svg.font-dropdown-chevron');
  await expect(fontChevron).toBeVisible();
  const chevronBox = await requiredBox(fontChevron);
  expect(chevronBox.width).toBe(12);
  expect(chevronBox.height).toBe(12);
  await expect(page.getByRole('combobox', { name: 'Font family' })).toHaveCount(0);
  await fontTrigger.click();
  const fontListbox = page.getByRole('listbox', { name: 'Font family options' });
  await expect(fontListbox).toBeVisible();
  await expect(fontListbox).toBeFocused();
  expect(await fontListbox.evaluate((element) => element.tagName.toLowerCase())).toBe('div');
  expect(await fontListbox.evaluate((element) => getComputedStyle(element).maxHeight)).toBe('400px');
  expect(await fontListbox.evaluate((element) => getComputedStyle(element).width)).toBe('260px');
  const fontNames = await fontListbox.getByRole('option').allTextContents();
  expect(fontNames.length).toBeGreaterThanOrEqual(10);
  expect(fontNames.some((font) => /glyph|icon|symbol/i.test(font))).toBe(false);
  await expect(fontListbox.getByText('Theme Fonts', { exact: true })).toHaveCSS('position', 'sticky');
  await expect(fontListbox.getByText('All Fonts', { exact: true })).toHaveCSS('position', 'sticky');
  await expect(fontListbox.getByRole('option').first()).toHaveCSS('height', '28px');
  await page.keyboard.press('Escape');

  const paper = await rect(page.locator('.paper-page').first());
  const horizontal = await rect(page.locator('.ruler-horizontal'));
  const vertical = await rect(page.locator('.ruler-vertical'));
  expect(Math.abs(horizontal.x - paper.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(horizontal.right - paper.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(vertical.x - (paper.x - 20))).toBeLessThanOrEqual(2);
  expect(Math.abs(vertical.y - paper.y)).toBeLessThanOrEqual(1);
  expect(vertical.width).toBe(20);
  expect(Math.abs(vertical.height - paper.height)).toBeLessThanOrEqual(1);

  const zeroTick = page.locator('.ruler-horizontal .ruler-tick:not(.ruler-tick-minor)').first();
  const zeroLabel = zeroTick.locator('small');
  await expect(zeroLabel).toHaveText('0');
  const zeroBox = await requiredBox(zeroTick);
  const zeroLabelBox = await requiredBox(zeroLabel);
  const textAreaLeft = await page.locator('.page-content-layer').evaluate((element) => element.getBoundingClientRect().left);
  const zeroTextLeft = await zeroLabel.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().left;
  });
  const firstTopLeftCropMark = await requiredBox(page.locator('.crop-marks i:nth-child(1)').first());
  expect(Math.abs(zeroBox.x - textAreaLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(zeroLabelBox.x - textAreaLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(zeroTextLeft - textAreaLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(firstTopLeftCropMark.x + 6 - textAreaLeft)).toBeLessThanOrEqual(1);
  const verticalLabel = page.locator('.ruler-vertical .ruler-tick:not(.ruler-tick-minor) small').first();
  const verticalTickBox = await requiredBox(page.locator('.ruler-vertical .ruler-tick:not(.ruler-tick-minor)').first());
  const verticalLabelBox = await requiredBox(verticalLabel);
  expect(await verticalLabel.evaluate((element) => getComputedStyle(element).writingMode)).toBe('horizontal-tb');
  expect(await verticalLabel.evaluate((element) => getComputedStyle(element).fontSize)).toBe('9px');
  expect(Math.abs(verticalLabelBox.y - verticalTickBox.y)).toBeLessThanOrEqual(1);

  const fontGroup = page.locator('[data-ribbon-group="Font"]');
  const fontRows = fontGroup.locator('[data-ribbon-row]');
  await expect(fontRows).toHaveCount(2);
  const familyBox = await requiredBox(fontTrigger);
  const sizeTrigger = page.getByTestId('font-size-trigger');
  const sizeBox = await requiredBox(sizeTrigger);
  expect(familyBox.width).toBe(130);
  expect(familyBox.height).toBe(22);
  expect(sizeBox.width).toBe(60);
  expect(sizeBox.height).toBe(22);
  const boldBox = await requiredBox(fontGroup.getByRole('button', { name: 'Bold' }));
  const italicBox = await requiredBox(fontGroup.getByRole('button', { name: 'Italic' }));
  const underlineBox = await requiredBox(fontGroup.getByRole('button', { name: 'Underline' }));
  expect(Math.abs(boldBox.y - familyBox.y)).toBeGreaterThan(10);
  expect(Math.abs(italicBox.y - boldBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(underlineBox.y - boldBox.y)).toBeLessThanOrEqual(1);

  const paragraphGroup = page.locator('[data-ribbon-group="Paragraph"]');
  const paragraphRows = paragraphGroup.locator('[data-ribbon-row]');
  await expect(paragraphRows).toHaveCount(2);
  const bulletsBox = await requiredBox(paragraphGroup.getByRole('button', { name: 'Bullets' }));
  const alignLeftBox = await requiredBox(paragraphGroup.getByRole('button', { name: 'Align left' }));
  expect(Math.abs(alignLeftBox.y - bulletsBox.y)).toBeGreaterThan(10);

  const clipboard = page.locator('[data-ribbon-group="Clipboard"]');
  const cutBox = await requiredBox(clipboard.getByRole('button', { name: 'Cut' }));
  const copyBox = await requiredBox(clipboard.getByRole('button', { name: 'Copy' }));
  const painterBox = await requiredBox(clipboard.getByRole('button', { name: 'Format painter' }));
  expect(Math.abs(cutBox.x - copyBox.x)).toBeLessThanOrEqual(1);
  expect(copyBox.y).toBeGreaterThan(cutBox.y);
  expect(painterBox.y).toBeGreaterThan(copyBox.y);
  expect(cutBox.width).toBe(24);
  expect(cutBox.height).toBe(24);
  expect(copyBox.width).toBe(24);
  expect(copyBox.height).toBe(24);

  const pasteBox = await requiredBox(clipboard.getByRole('button', { name: 'Paste' }));
  expect(pasteBox.width).toBe(60);
  expect(pasteBox.height).toBe(66);

  const styles = page.locator('[data-ribbon-group="Styles"]');
  const normalStyle = await requiredBox(styles.getByRole('button', { name: 'Normal' }));
  expect(normalStyle.width).toBe(60);
  expect(normalStyle.height).toBe(66);
  await expect(styles.getByRole('button', { name: 'Next styles' })).toBeVisible();
  await expect(styles.getByRole('button', { name: 'Previous styles' })).toBeVisible();

  const textColor = page.locator('[data-ribbon-group="Font"] .ribbon-color[title="Text color"]');
  const highlight = page.locator('[data-ribbon-group="Font"] .ribbon-color[title="Highlight"]');
  await expect(textColor.locator('svg').first()).toHaveAttribute('stroke', 'currentColor');
  await expect(highlight.locator('svg').first()).toHaveAttribute('stroke', 'currentColor');
  await expect(textColor.locator('.color-bar')).toBeVisible();
  await expect(highlight.locator('.color-bar')).toBeVisible();
});
