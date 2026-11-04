export const IPC = {
  getRecents: 'quire:get-recents',
  setRecents: 'quire:set-recents',
  windowControl: 'quire:window-control',
  fullscreen: 'quire:fullscreen',
  menuAction: 'quire:menu-action',
} as const;
export type WindowAction = 'minimize' | 'maximize' | 'close';
export function isWindowAction(value: unknown): value is WindowAction {
  return value === 'minimize' || value === 'maximize' || value === 'close';
}
