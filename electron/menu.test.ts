import { describe, expect, it, vi } from 'vitest';
import type { MenuItemConstructorOptions } from 'electron';
import { createMenuTemplate } from './menu';
function enabled(items: MenuItemConstructorOptions[]): MenuItemConstructorOptions[] { return items.flatMap((item) => item.submenu ? enabled(Array.isArray(item.submenu) ? item.submenu : []) : item.enabled === false || item.type === 'separator' ? [] : [item]); }
describe('native menu', () => {
  it('maps enabled actions to the same shell dispatcher', () => {
    const send = vi.fn(); const items = enabled(createMenuTemplate(send, false));
    items.forEach((item) => { if (item.click) item.click({} as never, undefined, {} as never); });
    expect(send).toHaveBeenCalledWith('new'); expect(send).toHaveBeenCalledWith('theme-dark'); expect(send).toHaveBeenCalledWith('fullscreen'); expect(send).toHaveBeenCalledTimes(items.length);
  });
  it('adds native app roles on the desktop variant that needs them', () => {
    const template = createMenuTemplate(vi.fn(), true); expect(template[0]?.label).toBe('Quire'); expect(template[0]?.submenu).toEqual(expect.arrayContaining([expect.objectContaining({ role: 'quit' })]));
  });
  it('enables file and editor actions once their modules are connected', () => {
    const items = createMenuTemplate(vi.fn(), false).flatMap((item) => Array.isArray(item.submenu) ? item.submenu : []);
    expect(items.find((item) => item.label === 'Open')?.enabled).not.toBe(false); expect(items.find((item) => item.label === 'Save')?.enabled).not.toBe(false); expect(items.find((item) => item.label === 'Undo')?.enabled).not.toBe(false);
  });
});
