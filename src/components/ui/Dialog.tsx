import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { en } from '../../i18n/en';
import { Icon } from './Icon';

export interface DialogProps { title: string; onClose: () => void; children: ReactNode; className?: string; showClose?: boolean; }
export function Dialog({ title, onClose, children, className = '', showClose = true }: DialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = panel.current;
    const focusable = (): HTMLElement[] => Array.from(element?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []);
    (focusable()[0] ?? element)?.focus();
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) { event.preventDefault(); element?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    element?.addEventListener('keydown', handleKey);
    return () => { element?.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, []);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="dialog-header"><h2 id={titleId}>{title}</h2>{showClose && <button className="icon-button" aria-label={en.dialog.close} onClick={onClose}><Icon name="close" /></button>}</header>
      {children}
    </div>
  </div>;
}
