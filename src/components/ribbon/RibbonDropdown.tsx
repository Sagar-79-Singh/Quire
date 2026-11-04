import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
export interface RibbonDropdownItem { id: string; label: string; icon?: IconName; disabled?: boolean; onSelect: () => void; }
interface RibbonDropdownProps { label: string; icon?: IconName; items?: RibbonDropdownItem[]; children?: ReactNode; className?: string; }
export function RibbonDropdown({ label, icon = 'more', items = [], children, className = '' }: RibbonDropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent): void => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    const key = (event: KeyboardEvent): void => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', key); };
  }, [open]);
  return <div className={`ribbon-dropdown ${className}`} ref={root} onKeyDown={(event) => {
      if (items.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
        const index = buttons.findIndex((button) => button === document.activeElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}>
    <button ref={trigger} type="button" className="ribbon-button ribbon-button-sm dropdown-trigger" aria-label={label} title={label} aria-expanded={open} aria-controls={id} aria-haspopup={items.length ? 'menu' : 'dialog'} onClick={() => { setOpen(!open); }}><Icon name={icon} /><Icon name="chevronDown" /></button>
    {open && <div id={id} className="ribbon-popover" role={items.length ? 'menu' : 'dialog'} aria-label={label}>
      {items.map((item) => <button key={item.id} type="button" role="menuitem" className="menu-item" disabled={item.disabled} aria-label={item.label} onClick={() => { item.onSelect(); setOpen(false); trigger.current?.focus(); }}>{item.icon && <Icon name={item.icon} />}{item.label}</button>)}
      {children}
    </div>}
  </div>;
}
