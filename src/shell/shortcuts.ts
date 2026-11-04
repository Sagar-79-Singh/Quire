export const menuActions = ['new', 'open', 'save', 'save-as', 'export-pdf', 'print', 'close-document', 'home', 'undo', 'redo', 'find', 'next-tab', 'previous-tab', 'fullscreen', 'zoom-in', 'zoom-out', 'zoom-reset', 'theme-light', 'theme-dark', 'theme-system', 'toggle-panel', 'toggle-ribbon', 'replace', 'word-count', 'spelling', 'about'] as const;
export type MenuAction = typeof menuActions[number];
export interface ShortcutInput { key: string; code?: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; }
const bindings: Record<string, MenuAction> = {
  n: 'new', o: 'open', s: 'save', p: 'print', z: 'undo', y: 'redo', f: 'find', h: 'replace', w: 'close-document',
  '=': 'zoom-in', '+': 'zoom-in', '-': 'zoom-out', '_': 'zoom-out', '0': 'zoom-reset',
};
export function resolveShortcut(event: ShortcutInput): MenuAction | null {
  if (event.altKey) return null;
  if (event.key === 'F1' && (event.ctrlKey || event.metaKey) && !event.shiftKey) return 'toggle-ribbon';
  if (event.key === 'F7' && !event.ctrlKey && !event.metaKey && !event.shiftKey) return 'spelling';
  if (event.key === 'F11' && !event.ctrlKey && !event.metaKey && !event.shiftKey) return 'fullscreen';
  if (!(event.ctrlKey || event.metaKey)) return null;
  const key = event.key.toLowerCase();
  if (key === 'tab') return event.shiftKey ? 'previous-tab' : 'next-tab';
  if (key === 'p' && event.shiftKey) return 'toggle-panel';
  if (key === 's' && event.shiftKey) return 'save-as';
  if (key === 'z' && event.shiftKey) return 'redo';
  if (event.shiftKey && (event.code === 'Equal' || event.code === 'NumpadAdd')) return 'zoom-in';
  return bindings[key] ?? null;
}
export function isMenuAction(value: unknown): value is MenuAction {
  return typeof value === 'string' && menuActions.some((action) => action === value);
}
export interface ShortcutTarget { addEventListener: (type: 'keydown', listener: (event: Event) => void) => void; removeEventListener: (type: 'keydown', listener: (event: Event) => void) => void; }
export function installShortcuts(target: ShortcutTarget, dispatch: (action: MenuAction) => void): () => void {
  const listener = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) return;
    const action = resolveShortcut(event);
    if (!action) return;
    const element = event.target;
    const editing = element instanceof HTMLElement && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
    if (editing && ['undo', 'redo', 'find'].includes(action)) return;
    event.preventDefault();
    dispatch(action);
  };
  target.addEventListener('keydown', listener);
  return () => { target.removeEventListener('keydown', listener); };
}
