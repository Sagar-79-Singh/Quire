import { useRef } from 'react';
import { en } from '../../i18n/en';
import type { KeyboardEvent } from 'react';
export interface RibbonTabItem { id: string; label: string; disabled?: boolean; }
interface RibbonTabsProps { items: RibbonTabItem[]; value: string; onChange: (id: string) => void; label: string; className?: string; }
export function RibbonTabs({ items, value, onChange, label, className = '' }: RibbonTabsProps) {
  const root = useRef<HTMLDivElement>(null);
  const navigate = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabled = items.filter((item) => !item.disabled);
    if (!enabled.length) return;
    const current = enabled.findIndex((item) => item.id === value);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    const next = enabled[index];
    if (!next) return;
    event.preventDefault(); onChange(next.id);
    Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []).find((button) => button.dataset.tabId === next.id)?.focus();
  };
  return <div ref={root} role="tablist" aria-label={label} className={`ribbon-tabs ${className}`} onKeyDown={navigate}>
    {items.map((item) => <button key={item.id} type="button" role="tab" data-tab-id={item.id} aria-label={item.label} aria-selected={item.id === value} aria-controls={`panel-${item.id}`} tabIndex={item.id === value ? 0 : -1} disabled={item.disabled} title={item.disabled ? en.comingSoon.badge : undefined} className={`ribbon-tab ${item.id === value ? 'is-active' : ''}`} onClick={() => { onChange(item.id); }}>{item.label}</button>)}
  </div>;
}
