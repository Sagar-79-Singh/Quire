import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { en } from '../../i18n/en';
import { Icon } from '../ui/Icon';

export interface RibbonSection { id: string; node: ReactNode; }
export interface RibbonGroupWidth { id: string; width: number; }
export interface RibbonOverflowInput { groups: RibbonGroupWidth[]; availableWidth: number; minGroupWidth: number; dividerWidth?: number; overflowWidth?: number; }
export interface RibbonOverflowResult { visible: string[]; hidden: string[]; }
const hidePriority = ['editing', 'styles', 'paragraph', 'font', 'clipboard'];

export function computeRibbonOverflow({ groups, availableWidth, minGroupWidth, dividerWidth = 1, overflowWidth = 32 }: RibbonOverflowInput): RibbonOverflowResult {
  const widths = groups.map((group) => ({ id: group.id, width: Math.max(minGroupWidth, group.width) }));
  const hidden = new Set<string>();
  const total = (): number => {
    const visible = widths.filter((group) => !hidden.has(group.id));
    return visible.reduce((sum, group) => sum + group.width, 0) + Math.max(0, visible.length - 1) * dividerWidth + (hidden.size ? overflowWidth : 0);
  };
  const order = [...hidePriority, ...widths.map((group) => group.id.toLowerCase()).reverse().filter((id) => !hidePriority.includes(id))];
  for (const id of order) {
    if (total() <= availableWidth) break;
    const match = widths.find((group) => group.id.toLowerCase() === id && !hidden.has(group.id));
    if (match) hidden.add(match.id);
  }
  return { visible: widths.filter((group) => !hidden.has(group.id)).map((group) => group.id), hidden: widths.filter((group) => hidden.has(group.id)).map((group) => group.id) };
}

export function calculateRibbonFit(widths: number[], available: number, overflowWidth = 40): number {
  const groups = widths.map((width, index) => ({ id: `group-${index}`, width }));
  return computeRibbonOverflow({ groups, availableWidth: available, minGroupWidth: 0, overflowWidth }).visible.length;
}

export function RibbonSurface({ groups, expanded = false, measureKey = '' }: { groups: RibbonSection[]; expanded?: boolean; measureKey?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cache = useRef(new Map<string, number>());
  const [available, setAvailable] = useState(0);
  const [widths, setWidths] = useState<RibbonGroupWidth[]>([]);
  const [open, setOpen] = useState(false);
  const groupKey = groups.map((group) => group.id).join('|');
  const fit = useMemo(() => computeRibbonOverflow({ groups: widths, availableWidth: available, minGroupWidth: 80 }), [widths, available]);
  const hidden = groups.filter((group) => fit.hidden.includes(group.id));
  const close = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = (): void => {
      const next: RibbonGroupWidth[] = [];
      for (const slot of Array.from(element.querySelectorAll<HTMLElement>('[data-ribbon-slot]'))) {
        const id = slot.dataset.ribbonSlot ?? '';
        const width = slot.getBoundingClientRect().width || slot.scrollWidth;
        if (width > 0) cache.current.set(id, width);
        next.push({ id, width: cache.current.get(id) ?? width });
      }
      setWidths(next);
      setAvailable(element.clientWidth || Number.MAX_SAFE_INTEGER);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return () => { window.removeEventListener('resize', measure); }; }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); };
  }, [groupKey, measureKey]);

  useEffect(() => {
    if (!open) return;
    const first = popover.current?.querySelector<HTMLElement>('button, select, input, [tabindex]');
    first?.focus();
    const outside = (event: MouseEvent): void => { if (event.target instanceof Node && !popover.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    const key = (event: globalThis.KeyboardEvent): void => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    window.addEventListener('mousedown', outside);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('mousedown', outside); window.removeEventListener('keydown', key); };
  }, [open, close]);

  const trap = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const items = Array.from(popover.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, [tabindex]') ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Tab') {
      event.preventDefault();
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault(); items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus();
    }
  };

  return <div ref={root} className={`ribbon-surface ${expanded ? 'is-expanded' : 'is-compact'}`} aria-label={en.ribbon.label} data-hidden-groups={fit.hidden.join(',')}>
    <div className="ribbon-groups">{groups.map((group) => <div key={group.id} data-ribbon-slot={group.id} className={`ribbon-slot ${fit.hidden.includes(group.id) ? 'is-overflowing' : ''}`} hidden={fit.hidden.includes(group.id)}>{group.node}</div>)}</div>
    <button ref={trigger} type="button" className={`icon-button ribbon-overflow ${hidden.length ? 'has-hidden' : ''}`} aria-label={en.ribbon.more} title={en.ribbon.more} aria-expanded={open} aria-haspopup="dialog" disabled={!hidden.length} onClick={() => { setOpen(!open); }}><Icon name="more" />{hidden.length > 0 && <span className="overflow-dot" aria-hidden="true" />}</button>
    {open && <div ref={popover} className="ribbon-popover overflow-popover" role="dialog" aria-label={en.ribbon.more} onKeyDown={trap}>
      <div className="overflow-groups">{hidden.length ? hidden.map((group) => <div key={group.id} className="overflow-group">{group.node}</div>) : <p>{en.ui.overflowEmpty}</p>}</div>
    </div>}
  </div>;
}
