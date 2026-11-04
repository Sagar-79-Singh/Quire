import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from '../i18n/en';
import { useShellStore } from '../shell/store';
import type { ThemePreference } from './tokens';
import { applyTheme } from './tokens';
import type { ResolvedTheme } from './tokens';
import { Icon } from '../components/ui/Icon';
import { useToast } from '../components/ui/Toast';

export const THEME_KEY = 'quire.theme';
export function parseTheme(value: unknown): ThemePreference | null { return value === 'light' || value === 'dark' || value === 'system' ? value : null; }
interface ThemeContextValue { preference: ThemePreference; resolved: ResolvedTheme; setTheme: (theme: ThemePreference) => void; cycleTheme: () => void; }
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children, storage }: { children: ReactNode; storage?: Pick<Storage, 'getItem' | 'setItem'> }) {
  const preference = useShellStore((state) => state.theme);
  const setPreference = useShellStore((state) => state.setTheme);
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const notify = useToast();
  const resolved: ResolvedTheme = preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
  useEffect(() => {
    try { const saved = parseTheme((storage ?? window.localStorage).getItem(THEME_KEY)); if (saved) setPreference(saved); }
    catch { notify(en.toast.themeSave); }
    setHydrated(true);
  }, [storage, setPreference, notify]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (): void => { setSystemDark(media.matches); };
    update(); media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    applyTheme(document.documentElement, resolved);
    if (!hydrated) return;
    try { (storage ?? window.localStorage).setItem(THEME_KEY, preference); }
    catch { notify(en.toast.themeSave); }
  }, [resolved, preference, hydrated, storage, notify]);
  const cycleTheme = useCallback(() => {
    const options: ThemePreference[] = ['light', 'dark', 'system'];
    setPreference(options[(options.indexOf(preference) + 1) % options.length] ?? 'system');
  }, [preference, setPreference]);
  const value = useMemo(() => ({ preference, resolved, setTheme: setPreference, cycleTheme }), [preference, resolved, setPreference, cycleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(): ThemeContextValue { const value = useContext(ThemeContext); if (!value) throw new Error('useTheme requires ThemeProvider'); return value; }
export function ThemeToggle() {
  const { preference, setTheme } = useTheme();
  return <div className="theme-toggle" role="group" aria-label={en.theme.appearance}>
    {([{ id: 'light', icon: 'sun', label: en.ribbon.light }, { id: 'dark', icon: 'moon', label: en.ribbon.dark }, { id: 'system', icon: 'monitor', label: en.ribbon.system }] as const).map((item) => <button key={item.id} type="button" aria-label={item.label} title={item.label} aria-pressed={preference === item.id} onClick={() => { setTheme(item.id); }}><Icon name={item.icon} /><span>{en.theme[item.id]}</span></button>)}
  </div>;
}
