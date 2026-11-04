import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileOperations } from './files';
import type { BinaryFS, FileDialogs, PrintWindow } from './files';
let fs: BinaryFS; let dialogs: FileDialogs; let printWindow: PrintWindow;
beforeEach(() => {
  fs = { readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])), writeFile: vi.fn().mockResolvedValue(undefined), rename: vi.fn().mockResolvedValue(undefined), mkdir: vi.fn().mockResolvedValue(undefined), size: vi.fn().mockResolvedValue(3) };
  dialogs = { open: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/tmp/file.docx'] }), save: vi.fn().mockResolvedValue({ canceled: false, filePath: '/tmp/out.docx' }) };
  printWindow = { loadURL: vi.fn().mockResolvedValue(undefined), printToPDF: vi.fn().mockResolvedValue(new Uint8Array([4, 5])), print: vi.fn().mockResolvedValue(undefined), destroy: vi.fn() };
});
function create() { return createFileOperations({ getWindow: () => ({ isDestroyed: () => false }), getRecents: vi.fn().mockResolvedValue([{ id: 'r', title: 'Recent', path: '/tmp/file.docx', appType: 'writer', templateId: 'blank', modifiedAt: 1 }]), fs, dialogs, createPrintWindow: () => printWindow }); }
describe('desktop file operations', () => {
  it('opens only allowed DOCX files and returns bytes', async () => {
    const files = create(); const result = await files.openDocument(); expect(result?.name).toBe('file.docx'); expect(result?.data.byteLength).toBe(3); expect(fs.readFile).toHaveBeenCalledWith('/tmp/file.docx');
    await expect(files.openDocument('/etc/passwd')).rejects.toThrow(); await expect(files.openDocument('/tmp/file.txt')).rejects.toThrow();
  });
  it('handles cancelled dialogs and oversized files', async () => {
    vi.mocked(dialogs.open).mockResolvedValue({ canceled: true, filePaths: [] }); expect(await create().openDocument()).toBeNull();
    vi.mocked(dialogs.open).mockResolvedValue({ canceled: false, filePaths: ['/tmp/file.docx'] }); vi.mocked(fs.size).mockResolvedValue(51 * 1024 * 1024); await expect(create().openDocument()).rejects.toThrow();
  });
  it('saves atomically to dialog-selected paths', async () => {
    const files = create(); const result = await files.saveDocument({ name: 'Draft', path: null, data: new Uint8Array([9]).buffer }); expect(result).toEqual({ name: 'out.docx', path: '/tmp/out.docx' }); expect(fs.writeFile).toHaveBeenCalledWith('/tmp/out.docx.quire-tmp', new Uint8Array([9])); expect(fs.rename).toHaveBeenCalled();
    await expect(files.saveDocument({ name: 'Draft', path: '/tmp/other.docx', data: new ArrayBuffer(0) })).rejects.toThrow();
    vi.mocked(dialogs.save).mockResolvedValue({ canceled: true }); expect(await files.saveDocument({ name: 'Draft', path: null, data: new ArrayBuffer(0) })).toBeNull();
  });
  it('exports vector PDF through a hidden print window and cleans up', async () => {
    const files = create(); vi.mocked(dialogs.save).mockResolvedValue({ canceled: false, filePath: '/tmp/out.pdf' });
    const result = await files.exportPdf({ name: 'Draft', html: '<html><body>Vector</body></html>' }); expect(result?.path).toBe('/tmp/out.pdf'); expect(printWindow.loadURL).toHaveBeenCalledWith(expect.stringContaining('data:text/html')); expect(printWindow.printToPDF).toHaveBeenCalledWith({ printBackground: true, preferCSSPageSize: true }); expect(printWindow.destroy).toHaveBeenCalled();
    vi.mocked(printWindow.loadURL).mockRejectedValue(new Error('load')); await expect(files.exportPdf({ name: 'Draft', html: '<html />' })).rejects.toThrow(); expect(printWindow.destroy).toHaveBeenCalledTimes(2);
  });
  it('prints through the native print dialog', async () => { await create().printDocument({ name: 'Draft', html: '<html />' }); expect(printWindow.print).toHaveBeenCalledWith({ silent: false, printBackground: true }); expect(printWindow.destroy).toHaveBeenCalled(); });
});
