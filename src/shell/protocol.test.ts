import { describe, expect, it } from 'vitest';
import { IPC, isPrintRequest, isSaveRequest, isWindowAction, MAX_DOCUMENT_BYTES } from './protocol';
describe('IPC protocol', () => {
  it('uses fixed whitelisted channels', () => { expect(Object.values(IPC).every((channel) => channel.startsWith('quire:'))).toBe(true); expect(new Set(Object.values(IPC)).size).toBe(Object.values(IPC).length); });
  it('validates window actions', () => { expect(isWindowAction('minimize')).toBe(true); expect(isWindowAction('maximize')).toBe(true); expect(isWindowAction('close')).toBe(true); expect(isWindowAction('delete')).toBe(false); });
  it('validates save payloads and size limits', () => { expect(isSaveRequest({ name: 'a.docx', path: null, data: new ArrayBuffer(4) })).toBe(true); expect(isSaveRequest({ name: 'a', path: '/tmp/a.docx', data: new ArrayBuffer(0) })).toBe(true); expect(isSaveRequest({ name: '', path: null, data: new ArrayBuffer(0) })).toBe(false); expect(isSaveRequest({ name: 'a', path: null, data: new ArrayBuffer(MAX_DOCUMENT_BYTES + 1) })).toBe(false); expect(isSaveRequest(null)).toBe(false); });
  it('validates print payloads', () => { expect(isPrintRequest({ name: 'a', html: '<html />' })).toBe(true); expect(isPrintRequest({ name: 'a', html: 1 })).toBe(false); expect(isPrintRequest(null)).toBe(false); });
});
