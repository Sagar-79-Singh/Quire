import type { ReactNode } from 'react';

const paths = {
  writer: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  home: <><path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  folder: <path d="M3 7V5h6l2 3h10v11H3Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowLeft: <path d="m10 5-7 7 7 7M3 12h18" />,
  undo: <><path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12" /></>,
  redo: <><path d="m16 4 5 5-5 5M21 9H10a6 6 0 0 0 0 12" /></>,
  save: <><path d="M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2m-3-7 1.5-1.5M5.5 18.5 7 17M5 5l1.5 1.5M17 17l1.5 1.5" /></>,
  moon: <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  minimize: <path d="M5 12h14" />,
  maximize: <rect x="5" y="5" width="14" height="14" rx="1" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16M18 8h1M18 12h1" /></>,
  print: <><path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6ZM17 11h1" /></>,
  web: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13h10M7 16h7" /></>,
  read: <><path d="M12 5v16M12 5C8 2 3 4 3 4v15s5-2 9 2c4-4 9-2 9-2V4s-5-2-9 1Z" /></>,
  styles: <><path d="m5 17 5-12 5 12M7 13h6M17 10h4M19 10v7M17 17h4" /></>,
  shape: <><rect x="3" y="3" width="11" height="11" rx="1" /><circle cx="16" cy="16" r="5" /></>,
  comment: <path d="M4 4h16v12H9l-5 4ZM8 8h8M8 12h5" />,
  check: <path d="m5 12 4 4L19 6" />,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
  bold: <path d="M7 4h6a4 4 0 0 1 0 8H7Zm0 8h7a4 4 0 0 1 0 8H7Z" />,
  italic: <path d="M10 4h9M5 20h9M15 4 9 20" />,
  underline: <path d="M6 3v8a6 6 0 0 0 12 0V3M4 21h16" />,
  align: <path d="M4 5h16M4 10h11M4 15h16M4 20h11" />,
  list: <path d="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01" />,
  paint: <><path d="M4 3h13v5H4ZM17 5h3v7h-8v3M10 15h4v6h-4Z" /></>,
  expand: <path d="m8 8-5-5M3 3v5M3 3h5m8 13 5 5m0 0v-5m0 5h-5" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;
export const iconMap = paths;
export interface IconProps { name: IconName; size?: 16 | 20 | 24 | 32; className?: string; }
export function Icon({ name, size = 16, className = '' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`q-icon ${className}`}>{paths[name]}</svg>;
}
