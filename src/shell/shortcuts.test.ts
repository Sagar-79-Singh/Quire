import { describe, expect, it, vi } from 'vitest';
import { installShortcuts, isMenuAction, resolveShortcut } from './shortcuts';
const key = (key: string, modifiers: Partial<Parameters<typeof resolveShortcut>[0]> = {}) => ({ key, ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, ...modifiers });
describe('shortcuts', () => {
  it.each([['n', 'new'], ['o', 'open'], ['s', 'save'], ['p', 'print'], ['z', 'undo'], ['y', 'redo'], ['f', 'find'], ['w', 'close-document'], ['=', 'zoom-in'], ['-', 'zoom-out'], ['0', 'zoom-reset']])('maps control+%s', (input, action) => { expect(resolveShortcut(key(input))).toBe(action); });
  it('supports command, shifted shortcuts and tab cycling', () => {
    expect(resolveShortcut(key('n', { ctrlKey: false, metaKey: true }))).toBe('new');
    expect(resolveShortcut(key('S', { shiftKey: true }))).toBe('save-as');
    expect(resolveShortcut(key('Z', { shiftKey: true }))).toBe('redo');
    expect(resolveShortcut(key('Tab'))).toBe('next-tab');
    expect(resolveShortcut(key('Tab', { shiftKey: true }))).toBe('previous-tab');
    expect(resolveShortcut(key('F11', { ctrlKey: false }))).toBe('fullscreen');
    expect(resolveShortcut(key('+', { shiftKey: true, code: 'Equal' }))).toBe('zoom-in');
  });
  it('ignores unmodified, alt and unknown combinations', () => {
    expect(resolveShortcut(key('n', { ctrlKey: false }))).toBeNull();
    expect(resolveShortcut(key('n', { altKey: true }))).toBeNull();
    expect(resolveShortcut(key('q'))).toBeNull();
    expect(resolveShortcut(key('F11', { shiftKey: true }))).toBeNull();
  });
  it('installs and removes an injectable keyboard listener', () => {
    const target = new EventTarget(); const dispatch = vi.fn();
    const remove = installShortcuts(target, dispatch);
    target.dispatchEvent(new KeyboardEvent('keydown', key('n')));
    expect(dispatch).toHaveBeenCalledWith('new');
    target.dispatchEvent(new Event('custom'));
    target.dispatchEvent(new KeyboardEvent('keydown', key('q')));
    expect(dispatch).toHaveBeenCalledOnce();
    remove(); target.dispatchEvent(new KeyboardEvent('keydown', key('n')));
    expect(dispatch).toHaveBeenCalledOnce();
  });
  it('preserves native undo and find inside inputs', () => {
    const target = new EventTarget(); const dispatch = vi.fn();
    installShortcuts(target, dispatch);
    const input = document.createElement('input'); document.body.append(input);
    const remove = installShortcuts(window, dispatch);
    input.dispatchEvent(new KeyboardEvent('keydown', { ...key('z'), bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keydown', key('z')));
    expect(dispatch).toHaveBeenCalledOnce(); remove(); input.remove();
  });
  it('validates menu messages', () => { expect(isMenuAction('new')).toBe(true); expect(isMenuAction('fs:delete')).toBe(false); expect(isMenuAction(null)).toBe(false); });
});
