import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetShellStore, useShellStore } from '../shell/store';
import { ToastProvider } from '../components/ui/Toast';
import { parseTheme, THEME_KEY, ThemeProvider, ThemeToggle, useTheme } from './ThemeProvider';

beforeEach(() => { resetShellStore(); });
function wrap(storage?: Pick<Storage, 'getItem' | 'setItem'>) { return render(<ToastProvider><ThemeProvider storage={storage}><ThemeToggle /></ThemeProvider></ToastProvider>); }
describe('ThemeProvider', () => {
  it('cycles light, dark and system and persists the preference', async () => {
    wrap(); expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark'); expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--q-page')).toBe('#2B2B2B');
    await userEvent.click(screen.getByRole('button', { name: 'System theme' })); expect(useShellStore.getState().theme).toBe('system');
    await userEvent.click(screen.getByRole('button', { name: 'Light theme' })); expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });
  it('restores persisted settings and responds to OS theme changes', async () => {
    let listener: (() => void) | undefined;
    const media = { matches: false, media: '', onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn((_name: string, callback: EventListenerOrEventListenerObject) => { listener = () => { if (typeof callback === 'function') callback(new Event('change')); else callback.handleEvent(new Event('change')); }; }), removeEventListener: vi.fn(), dispatchEvent: vi.fn() };
    vi.mocked(window.matchMedia).mockImplementationOnce(() => media);
    const storage = { getItem: () => 'system', setItem: vi.fn() }; const { unmount } = wrap(storage);
    await waitFor(() => { expect(storage.setItem).toHaveBeenCalledWith(THEME_KEY, 'system'); });
    media.matches = true; act(() => { listener?.(); }); expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    unmount(); expect(media.removeEventListener).toHaveBeenCalled();
  });
  it('contains storage failures and renders a toast', async () => {
    wrap({ getItem: () => { throw new Error('Denied'); }, setItem: () => { throw new Error('Denied'); } });
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);
  });
  it('validates preferences and exposes a cycle action', async () => {
    expect(parseTheme('dark')).toBe('dark'); expect(parseTheme('light')).toBe('light'); expect(parseTheme('system')).toBe('system'); expect(parseTheme('invalid')).toBeNull();
    function Probe() { const { cycleTheme } = useTheme(); return <button onClick={cycleTheme}>Cycle</button>; }
    render(<ToastProvider><ThemeProvider><Probe /></ThemeProvider></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Cycle' })); expect(useShellStore.getState().theme).toBe('light');
  });
  it('requires the provider', () => { function Probe() { useTheme(); return null; } expect(() => render(<Probe />)).toThrow('ThemeProvider'); });
});
