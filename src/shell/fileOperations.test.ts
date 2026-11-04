import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDocumentFile, saveDocumentFile, exportPdfFile, printDocumentFile } from './fileOperations';
import type { ShellIO } from './io';
import { resetShellStore, useShellStore } from './store';
import { useWriterStore } from '../apps/writer/store';
import { defaultSettings } from '../apps/writer/model';
const docxMocks = vi.hoisted(() => ({ importDocx: vi.fn(), exportDocx: vi.fn(), buildPrintHtml: vi.fn() }));
vi.mock('../apps/writer/docx', () => ({ importDocx: docxMocks.importDocx, exportDocx: docxMocks.exportDocx, buildPrintHtml: docxMocks.buildPrintHtml }));
function io(overrides: Partial<ShellIO> = {}): ShellIO { return { isDesktop: true, platform: 'linux', loadRecents: vi.fn(), saveRecents: vi.fn(), windowControl: vi.fn(), toggleFullscreen: vi.fn(), onMenuAction: vi.fn(() => () => {}), openFile: vi.fn().mockResolvedValue({ name: 'Imported.docx', path: '/tmp/imported.docx', data: new ArrayBuffer(4) }), saveFile: vi.fn().mockResolvedValue({ name: 'Saved.docx', path: '/tmp/saved.docx' }), exportPdf: vi.fn().mockResolvedValue({ name: 'Saved.pdf', path: '/tmp/saved.pdf' }), printFile: vi.fn().mockResolvedValue(undefined), ...overrides }; }
beforeEach(() => { resetShellStore(); useWriterStore.setState({ documents: {} }); docxMocks.importDocx.mockResolvedValue({ title: 'Imported', html: '<p>Imported text</p>', settings: { ...defaultSettings, paper: 'a4' }, warnings: ['Style adjusted'] }); docxMocks.exportDocx.mockResolvedValue(new ArrayBuffer(8)); docxMocks.buildPrintHtml.mockReturnValue('<html>Print</html>'); });
describe('file operations', () => {
  it('opens a DOCX into an isolated Writer tab and records recents', async () => {
    const adapter = io(); const result = await openDocumentFile(adapter); expect(result.ok, result.message).toBe(true); expect(result.message).toBe('Style adjusted');
    const tab = useShellStore.getState().tabs[0]; expect(tab).toMatchObject({ title: 'Imported', path: '/tmp/imported.docx' }); expect(useWriterStore.getState().documents[tab?.id ?? '']?.html).toContain('Imported text'); expect(useShellStore.getState().recents).toHaveLength(1);
    await openDocumentFile(adapter); expect(useShellStore.getState().tabs).toHaveLength(1);
  });
  it('handles cancellation and open failures', async () => {
    expect(await openDocumentFile(io({ openFile: vi.fn().mockResolvedValue(null) }))).toEqual({ ok: true });
    expect(await openDocumentFile(io({ openFile: vi.fn().mockRejectedValue(new Error('denied')) }))).toMatchObject({ ok: false });
  });
  it('saves the active document, clears dirty state and updates recents', async () => {
    const id = useShellStore.getState().openDocument({ title: 'Draft', content: 'Words' }); useWriterStore.getState().ensure(id, 'Words'); useShellStore.getState().setDocumentContent(id, 'Edited');
    const adapter = io(); const result = await saveDocumentFile(adapter); expect(result).toMatchObject({ ok: true, message: 'Document saved.' }); expect(useShellStore.getState().tabs[0]).toMatchObject({ path: '/tmp/saved.docx', dirty: false, title: 'Saved' }); expect(adapter.saveFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Draft.docx', path: null }));
    await saveDocumentFile(adapter, true); expect(adapter.saveFile).toHaveBeenLastCalledWith(expect.objectContaining({ path: null }));
  });
  it('exports PDF and prints the active document', async () => {
    const id = useShellStore.getState().openDocument({ title: 'Draft' }); useWriterStore.getState().ensure(id); const adapter = io();
    expect(await exportPdfFile(adapter)).toMatchObject({ ok: true, message: 'PDF exported.' }); expect(adapter.exportPdf).toHaveBeenCalledWith({ name: 'Draft.pdf', html: '<html>Print</html>' });
    expect(await printDocumentFile(adapter)).toEqual({ ok: true }); expect(adapter.printFile).toHaveBeenCalled();
  });
  it('requires an active document and contains failures', async () => {
    expect(await saveDocumentFile(io())).toMatchObject({ ok: false }); expect(await exportPdfFile(io())).toMatchObject({ ok: false }); expect(await printDocumentFile(io())).toMatchObject({ ok: false });
    const id = useShellStore.getState().openDocument({ title: 'Draft' }); useWriterStore.getState().ensure(id);
    expect(await saveDocumentFile(io({ saveFile: vi.fn().mockRejectedValue(new Error('disk')) }))).toMatchObject({ ok: false });
    expect(await exportPdfFile(io({ exportPdf: vi.fn().mockRejectedValue(new Error('pdf')) }))).toMatchObject({ ok: false });
    expect(await printDocumentFile(io({ printFile: vi.fn().mockRejectedValue(new Error('print')) }))).toMatchObject({ ok: false });
    expect(await saveDocumentFile(io({ saveFile: vi.fn().mockResolvedValue(null) }))).toEqual({ ok: true });
  });
});
