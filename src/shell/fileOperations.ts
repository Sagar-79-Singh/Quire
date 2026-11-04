import { en } from '../i18n/en';
import { exportDocx, importDocx, buildPrintHtml } from '../apps/writer/docx';
import { useWriterStore } from '../apps/writer/store';
import { htmlToText } from '../apps/writer/model';
import { getActiveDocument, useShellStore } from './store';
import type { RecentDocument } from './store';
import type { ShellIO } from './io';
export interface FileOperationResult { ok: boolean; message?: string; }
export async function openDocumentFile(io: ShellIO, path?: string): Promise<FileOperationResult> {
  try {
    const file = await io.openFile(path); if (!file) return { ok: true };
    const imported = await importDocx(file.data);
    const existing = useShellStore.getState().tabs.find((tab) => tab.path === file.path && file.path);
    if (existing) { useShellStore.getState().activateDocument(existing.id); return { ok: true }; }
    const title = file.name.replace(/\.docx$/i, '') || imported.title || en.common.untitled;
    const id = useShellStore.getState().openDocument({ title, path: file.path ?? undefined, content: htmlToText(imported.html) });
    useWriterStore.getState().ensure(id); useWriterStore.getState().load(id, { html: imported.html, settings: imported.settings });
    if (file.path) useShellStore.getState().addRecent({ id, title, path: file.path, appType: 'writer', templateId: 'blank', modifiedAt: Date.now() });
    if (imported.warnings.length) return { ok: true, message: imported.warnings[0] };
    return { ok: true };
  } catch { return { ok: false, message: en.toast.file }; }
}
export async function saveDocumentFile(io: ShellIO, saveAs = false): Promise<FileOperationResult> {
  const tab = getActiveDocument(useShellStore.getState()); if (!tab) return { ok: false, message: en.common.noDocument };
  const writer = useWriterStore.getState().documents[tab.id]; if (!writer) return { ok: false, message: en.common.noDocument };
  try {
    const data = await exportDocx({ html: writer.html, settings: writer.settings }, tab.title);
    const result = await io.saveFile({ name: `${tab.title.replace(/\.docx$/i, '')}.docx`, path: saveAs ? null : tab.path, data });
    if (!result) return { ok: true };
    useShellStore.getState().markSaved(tab.id, result.path, result.name.replace(/\.docx$/i, ''));
    const recent: RecentDocument = { id: tab.id, title: result.name.replace(/\.docx$/i, ''), path: result.path, appType: 'writer', templateId: tab.templateId, modifiedAt: Date.now() };
    useShellStore.getState().addRecent(recent);
    return { ok: true, message: en.toast.saved };
  } catch { return { ok: false, message: en.toast.file }; }
}
export async function exportPdfFile(io: ShellIO): Promise<FileOperationResult> {
  const tab = getActiveDocument(useShellStore.getState()); const writer = tab ? useWriterStore.getState().documents[tab.id] : undefined;
  if (!tab || !writer) return { ok: false, message: en.common.noDocument };
  try { const result = await io.exportPdf({ name: `${tab.title}.pdf`, html: buildPrintHtml(writer.html, writer.settings, tab.title) }); return { ok: true, message: result ? en.toast.exported : undefined }; }
  catch { return { ok: false, message: en.toast.pdf }; }
}
export async function printDocumentFile(io: ShellIO): Promise<FileOperationResult> {
  const tab = getActiveDocument(useShellStore.getState()); const writer = tab ? useWriterStore.getState().documents[tab.id] : undefined;
  if (!tab || !writer) return { ok: false, message: en.common.noDocument };
  try { await io.printFile({ name: tab.title, html: buildPrintHtml(writer.html, writer.settings, tab.title) }); return { ok: true }; }
  catch { return { ok: false, message: en.toast.file }; }
}
