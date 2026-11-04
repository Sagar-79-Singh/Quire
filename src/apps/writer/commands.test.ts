import { describe, expect, it, vi } from 'vitest';
import { createCommandBus, fontFamilies, fontSizes, parseCsv, symbols } from './commands';
describe('writer commands', () => {
  it('dispatches to subscribers and removes them', () => { const bus = createCommandBus(); const handler = vi.fn(); const off = bus.subscribe(handler); bus.dispatch('undo'); expect(handler).toHaveBeenCalledWith({ name: 'undo', value: undefined }); expect(bus.size).toBe(1); off(); bus.dispatch('redo'); expect(handler).toHaveBeenCalledTimes(1); });
  it('parses quoted CSV fields and escaped quotes', () => { expect(parseCsv('Name,Address\n"Sagar, Jr.","Line 1\nLine 2"\n"Say ""hello""",Done')).toEqual([{ Name: 'Sagar, Jr.', Address: 'Line 1\nLine 2' }, { Name: 'Say "hello"', Address: 'Done' }]); expect(parseCsv('')).toEqual([]); expect(parseCsv('Name\n')).toEqual([]); });
  it('exposes offline font and symbol choices', () => { expect(fontFamilies).toContain('Arial'); expect(fontSizes).toContain(11); expect(symbols).toContain('₹'); });
});
