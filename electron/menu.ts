import type { MenuItemConstructorOptions } from 'electron';
import type { MenuAction } from '../src/shell/shortcuts';
import { en } from '../src/i18n/en';
export function createMenuTemplate(send: (action: MenuAction) => void, mac: boolean): MenuItemConstructorOptions[] {
  const item = (label: string, action: MenuAction, accelerator?: string, enabled = true): MenuItemConstructorOptions => ({ label, accelerator, enabled, click: () => { send(action); } });
  return [
    ...(mac ? [{ label: en.app.name, submenu: [{ role: 'about' as const }, { type: 'separator' as const }, { role: 'hide' as const }, { role: 'quit' as const }] }] : []),
    { label: en.backstage.title, submenu: [item(en.backstage.new, 'new', 'CmdOrCtrl+N'), item(en.backstage.open, 'open', 'CmdOrCtrl+O'), { type: 'separator' }, item(en.backstage.save, 'save', 'CmdOrCtrl+S', true), item(en.backstage.saveAs, 'save-as', 'CmdOrCtrl+Shift+S', true), item(en.backstage.export, 'export-pdf', undefined, true), item(en.backstage.print, 'print', 'CmdOrCtrl+P', true), { type: 'separator' }, item(en.backstage.close, 'close-document', 'CmdOrCtrl+W')] },
    { label: en.menu.edit, submenu: [item(en.title.undo, 'undo', 'CmdOrCtrl+Z', true), item(en.title.redo, 'redo', 'CmdOrCtrl+Shift+Z', true), item(en.title.find, 'find', 'CmdOrCtrl+F'), item(en.writer.replace, 'replace', 'CmdOrCtrl+H'), item(en.writer.wordCount, 'word-count'), item(en.writer.spelling, 'spelling', 'F7')] },
    { label: en.ribbon.view, submenu: [item(en.ribbon.light, 'theme-light'), item(en.ribbon.dark, 'theme-dark'), item(en.ribbon.system, 'theme-system'), { type: 'separator' }, item(en.ribbon.zoomIn, 'zoom-in', 'CmdOrCtrl+=', true), item(en.ribbon.zoomOut, 'zoom-out', 'CmdOrCtrl+-'), item(en.ribbon.resetZoom, 'zoom-reset', 'CmdOrCtrl+0'), { type: 'separator' }, item(en.ribbon.panel, 'toggle-panel'), item(en.ribbon.expanded, 'toggle-ribbon'), item(en.menu.fullscreen, 'fullscreen', 'F11')] },
    { label: en.menu.window, submenu: [item(en.menu.nextTab, 'next-tab', 'Ctrl+Tab'), item(en.menu.previousTab, 'previous-tab', 'Ctrl+Shift+Tab'), item(en.nav.home, 'home')] },
    { label: en.writer.help, submenu: [item(en.writer.about, 'about'), item(en.writer.shortcuts, 'about')] },
  ];
}
