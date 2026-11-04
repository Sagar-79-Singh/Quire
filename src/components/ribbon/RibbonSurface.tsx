import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from '../../i18n/en';
import { RibbonDropdown } from './RibbonDropdown';
export interface RibbonSection { id: string; node: ReactNode; }
export function calculateRibbonFit(widths: number[], available: number, overflowWidth = 40): number {
  if (widths.reduce((sum, width) => sum + width, 0) <= available) return widths.length;
  let used = overflowWidth;
  let count = 0;
  for (const width of widths) { if (used + width > available) break; used += width; count += 1; }
  return count;
}
export function RibbonSurface({ groups, expanded = false }: { groups: RibbonSection[]; expanded?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(groups.length);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const items = Array.from(element.querySelectorAll<HTMLElement>('[data-ribbon-slot]'));
    const measure = (): void => {
      const widths = items.map((item) => item.getBoundingClientRect().width || item.scrollWidth);
      setVisible(calculateRibbonFit(widths, element.clientWidth));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return () => { window.removeEventListener('resize', measure); }; }
    const observer = new ResizeObserver(measure);
    observer.observe(element); items.forEach((item) => { observer.observe(item); });
    return () => { observer.disconnect(); };
  }, [groups]);
  const hidden = groups.slice(visible);
  return <div ref={root} className={`ribbon-surface ${expanded ? 'is-expanded' : 'is-compact'}`} aria-label={en.ribbon.label}>
    <div className="ribbon-groups">{groups.map((group, index) => <div key={group.id} data-ribbon-slot className={`ribbon-slot ${index >= visible ? 'is-overflowing' : ''}`} aria-hidden={index >= visible}>{group.node}</div>)}</div>
    {hidden.length > 0 && <RibbonDropdown label={en.ribbon.more} className="ribbon-overflow"><div className="overflow-groups" aria-label={en.ribbon.overflow}>{hidden.map((group) => <div key={group.id}>{group.node}</div>)}</div></RibbonDropdown>}
  </div>;
}
