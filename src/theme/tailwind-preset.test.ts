import { describe, expect, it } from 'vitest';
import preset from './tailwind-preset.js';
describe('Tailwind preset', () => {
  it('maps semantic colors to runtime theme variables', () => {
    expect(preset.theme.extend.colors.accent).toBe('var(--q-accent)');
    expect(preset.theme.extend.colors.canvas).toBe('var(--q-canvas)');
    expect(preset.theme.extend.boxShadow.page).toBe('var(--q-page-shadow)');
    expect(preset.theme.extend.fontFamily.sans[0]).toBe('system-ui');
  });
});
