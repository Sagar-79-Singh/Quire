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
    chrome: '#FFFFFF', surface: '#FFFFFF', hover: '#F3F2F1', border: '#D2D0CE',
    text: '#201F1E', secondary: '#5C5A58', canvas: '#F3F2F1', page: '#FFFFFF',
    'accent-soft': '#EBF1FA', 'on-accent': '#FFFFFF', danger: '#C42B1C',
    'danger-hover': '#E81123', 'on-danger': '#FFFFFF', success: '#107C10',
    'page-shadow': '0 2px 4px rgba(0,0,0,.10)', 'ruler-shade': 'rgba(32,31,30,.08)',
    'crop-mark': '#8A8886', 'overlay': 'rgba(0,0,0,.16)',
  },
  dark: {
    accent: '#4A90E2', 'accent-hover': '#5C9EEA', 'accent-pressed': '#3D7AC0',
    chrome: '#1F1F1F', surface: '#252525', hover: '#2D2D2D', border: '#3D3D3D',
    text: '#E1DFDD', secondary: '#A8A8A8', canvas: '#141414', page: '#2B2B2B',
    'accent-soft': '#1A2430', 'on-accent': '#101820', danger: '#FF99A4',
    'danger-hover': '#E81123', 'on-danger': '#FFFFFF', success: '#6CCB5F',
    'page-shadow': '0 2px 4px rgba(0,0,0,.35)', 'ruler-shade': 'rgba(225,223,221,.10)',
    'crop-mark': '#A8A8A8', 'overlay': 'rgba(0,0,0,.35)',
  },
} as const;

export const dimensions = {
  titleBar: 32, documentTabs: 32, windowControl: 46, ribbonTabs: 32, compactRibbon: 108,
  expandedRibbon: 140, ribbonCommands: 76, ribbonLabels: 32, statusBar: 22, rightPanel: 320, ruler: 20,
  pageGap: 24, letterWidth: 816, letterHeight: 1056, a4Width: 794, a4Height: 1123,
} as const;

export type TokenName = keyof typeof themeTokens.light;
export interface ContrastPair { name: string; foreground: TokenName; background: TokenName; }
export const contrastPairs: ContrastPair[] = [
  { name: 'text on chrome', foreground: 'text', background: 'chrome' },
  { name: 'secondary on chrome', foreground: 'secondary', background: 'chrome' },
  { name: 'text on surface', foreground: 'text', background: 'surface' },
  { name: 'secondary on surface', foreground: 'secondary', background: 'surface' },
  { name: 'text on canvas', foreground: 'text', background: 'canvas' },
  { name: 'secondary on canvas', foreground: 'secondary', background: 'canvas' },
  { name: 'text on page', foreground: 'text', background: 'page' },
  { name: 'secondary on page', foreground: 'secondary', background: 'page' },
  { name: 'text on hover', foreground: 'text', background: 'hover' },
  { name: 'secondary on hover', foreground: 'secondary', background: 'hover' },
  { name: 'accent on chrome', foreground: 'accent', background: 'chrome' },
  { name: 'accent on accent-soft', foreground: 'accent', background: 'accent-soft' },
  { name: 'on-accent on accent', foreground: 'on-accent', background: 'accent' },
  { name: 'danger on chrome', foreground: 'danger', background: 'chrome' },
  { name: 'success on chrome', foreground: 'success', background: 'chrome' },
];

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}
export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean;
  const red = parseInt(full.slice(0, 2), 16); const green = parseInt(full.slice(2, 4), 16); const blue = parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground); const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function themeVariables(theme: ResolvedTheme): Record<string, string> {
  const tokens = themeTokens[theme];
  return {
    ...Object.fromEntries(Object.entries(tokens).map(([key, value]) => [`--q-${key}`, value])),
    '--color-border': tokens.border,
    '--color-bg-popover': tokens.surface,
    '--color-bg-hover': tokens.hover,
    '--color-accent-bg': tokens['accent-soft'],
    '--color-accent-text': tokens.accent,
  };
}

export function applyTheme(element: HTMLElement, theme: ResolvedTheme): void {
  element.dataset.theme = theme;
  element.style.colorScheme = theme;
  for (const [key, value] of Object.entries(themeVariables(theme))) element.style.setProperty(key, value);
}
