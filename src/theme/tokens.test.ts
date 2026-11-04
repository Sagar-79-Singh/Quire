import { describe, expect, it } from 'vitest';
import { appAccents, applyTheme, dimensions, themeTokens, themeVariables } from './tokens';
describe('theme tokens', () => {
  it('defines exact chrome dimensions and app accents', () => {
    expect(dimensions).toMatchObject({ titleBar: 32, statusBar: 22, compactRibbon: 90, expandedRibbon: 140, rightPanel: 320, a4Width: 794, a4Height: 1123 });
    expect(appAccents).toEqual({ writer: '#2B579A', sheets: '#217346', slides: '#C43E1C' });
    expect(themeTokens.light.canvas).toBe('#F3F2F1'); expect(themeTokens.dark.page).toBe('#2B2B2B');
  });
  it('applies all custom properties and color scheme', () => {
    const element = document.createElement('div');
    applyTheme(element, 'dark');
    expect(element.dataset.theme).toBe('dark'); expect(element.style.colorScheme).toBe('dark');
    expect(element.style.getPropertyValue('--q-accent')).toBe(themeTokens.dark.accent);
    expect(themeVariables('light')['--q-chrome']).toBe('#FFFFFF');
    applyTheme(element, 'light'); expect(element.style.getPropertyValue('--q-page')).toBe('#FFFFFF');
  });
});
