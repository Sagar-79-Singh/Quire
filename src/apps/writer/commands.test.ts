import { describe, expect, it, vi } from 'vitest';
import { createCommandBus, fontFamilies, fontSizes, normalizeSystemFonts, parseCsv, symbols } from './commands';
describe('writer commands', () => {
  it('dispatches to subscribers and removes them', () => { const bus = createCommandBus(); const handler = vi.fn(); const off = bus.subscribe(handler); bus.dispatch('undo'); expect(handler).toHaveBeenCalledWith({ name: 'undo', value: undefined }); expect(bus.size).toBe(1); off(); bus.dispatch('redo'); expect(handler).toHaveBeenCalledTimes(1); });
  it('parses quoted CSV fields and escaped quotes', () => { expect(parseCsv('Name,Address\n"Sagar, Jr.","Line 1\nLine 2"\n"Say ""hello""",Done')).toEqual([{ Name: 'Sagar, Jr.', Address: 'Line 1\nLine 2' }, { Name: 'Say "hello"', Address: 'Done' }]); expect(parseCsv('')).toEqual([]); expect(parseCsv('Name\n')).toEqual([]); });
  it('exposes the offline font fallback and symbol choices', () => { expect(fontFamilies).toContain('Arial'); expect(fontFamilies).toHaveLength(9); expect(fontSizes).toEqual([8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]); expect(symbols).toContain('₹'); });
  it('normalizes system font names, removes duplicates and sorts alphabetically', () => {
    expect(normalizeSystemFonts(['"Zebra Sans"', 'Arial', ' arial ', 'DejaVu Sans', ''])).toEqual(['Arial', 'DejaVu Sans', 'Zebra Sans']);
    expect(() => normalizeSystemFonts(['Arial', 2])).toThrow('System fonts must be an array of strings.');
  });
});
