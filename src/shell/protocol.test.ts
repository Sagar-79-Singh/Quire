import { describe, expect, it } from 'vitest';
import { IPC, isWindowAction } from './protocol';
describe('IPC protocol', () => {
  it('uses only namespaced channels', () => { expect(Object.values(IPC).every((channel) => channel.startsWith('quire:'))).toBe(true); });
  it.each(['minimize', 'maximize', 'close'])('allows %s', (action) => { expect(isWindowAction(action)).toBe(true); });
  it.each(['quit', '', null, 3])('rejects unlisted action %s', (action) => { expect(isWindowAction(action)).toBe(false); });
});
