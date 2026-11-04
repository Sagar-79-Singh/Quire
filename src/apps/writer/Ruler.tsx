import { pageDimensions } from './model';
import type { PageSettings } from './model';
import { en } from '../../i18n/en';
export function rulerTicks(length: number): number[] { return Array.from({ length: Math.floor(Math.max(0, length) / 96) + 1 }, (_, index) => index * 96); }
export function Ruler({ settings, orientation = 'horizontal', zoom = 100, offset = 0 }: { settings: PageSettings; orientation?: 'horizontal' | 'vertical'; zoom?: number; offset?: number }) {
  const size = pageDimensions(settings); const horizontal = orientation === 'horizontal'; const length = horizontal ? size.width : size.height;
  const start = horizontal ? settings.margins.left : settings.margins.top; const end = length - (horizontal ? settings.margins.right : settings.margins.bottom);
  return <div className={`ruler ruler-${orientation}`} aria-label={horizontal ? en.editor.horizontalRuler : en.editor.verticalRuler} role="img">
    <div className="ruler-track" style={{ transform: `translate${horizontal ? 'X' : 'Y'}(${-offset}px)` }}>
      <span className="ruler-shade" style={{ [horizontal ? 'left' : 'top']: 0, [horizontal ? 'width' : 'height']: start }} />
      <span className="ruler-shade" style={{ [horizontal ? 'left' : 'top']: end, [horizontal ? 'width' : 'height']: length - end }} />
      {rulerTicks(length).map((tick) => <span className="ruler-tick" key={tick} style={{ [horizontal ? 'left' : 'top']: tick }}><i />{tick > 0 && <small>{Math.abs(tick - start) / 96}</small>}</span>)}
      <span className="ruler-indent" style={{ [horizontal ? 'left' : 'top']: start }} /><span className="ruler-indent" style={{ [horizontal ? 'left' : 'top']: end }} />
    </div><span className="sr-only">{zoom}%</span>
  </div>;
}
