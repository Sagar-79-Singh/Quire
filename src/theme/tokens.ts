export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = ResolvedTheme | 'system';
import type { AppType } from '../shell/store';

export const appAccents: Record<AppType, string> = {
  writer: '#2B579A',
  sheets: '#217346',
  slides: '#C43E1C',
};

export const themeTokens = {
  light: {
    accent: '#2B579A', 'accent-hover': '#1F4278', 'accent-pressed': '#173266',
    chrome: '#FFFFFF', hover: '#F3F2F1', border: '#EDEBE9',
    text: '#201F1E', secondary: '#605E5C', canvas: '#F3F2F1', page: '#FFFFFF',
    'accent-soft': '#EBF1FA', 'on-accent': '#FFFFFF', danger: '#E81123',
    'page-shadow': '0 2px 4px rgba(0,0,0,.10)',
  },
  dark: {
    accent: '#4A90E2', 'accent-hover': '#5C9EEA', 'accent-pressed': '#3D7AC0',
    chrome: '#1F1F1F', hover: '#2D2D2D', border: '#3D3D3D',
    text: '#E1DFDD', secondary: '#A8A8A8', canvas: '#141414', page: '#2B2B2B',
    'accent-soft': '#26364A', 'on-accent': '#101820', danger: '#E81123',
    'page-shadow': '0 2px 4px rgba(0,0,0,.35)',
  },
} as const;

export const dimensions = {
  titleBar: 32, windowControl: 46, ribbonTabs: 32, compactRibbon: 90,
  expandedRibbon: 140, statusBar: 22, rightPanel: 320, ruler: 20,
  pageGap: 24, letterWidth: 816, letterHeight: 1056, a4Width: 794, a4Height: 1123,
} as const;

export function themeVariables(theme: ResolvedTheme): Record<string, string> {
  return Object.fromEntries(Object.entries(themeTokens[theme]).map(([key, value]) => [`--q-${key}`, value]));
}

export function applyTheme(element: HTMLElement, theme: ResolvedTheme): void {
  element.dataset.theme = theme;
  element.style.colorScheme = theme;
  for (const [key, value] of Object.entries(themeVariables(theme))) element.style.setProperty(key, value);
}
