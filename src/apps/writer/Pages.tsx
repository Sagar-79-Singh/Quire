import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactNode, Ref } from 'react';
import type { PageSettings } from './model';
import { pageDimensions, pageNumberText } from './model';
import { en } from '../../i18n/en';
import { Ruler } from './Ruler';
import type { ParagraphIndent, RulerUnit } from './Ruler';

export interface PagesProps {
  settings: PageSettings; pageCount: number; zoom: number; children: ReactNode;
  ruler?: boolean; gridlines?: boolean; view?: 'print' | 'web' | 'read';
  marginGuides?: boolean; rulerUnit?: RulerUnit; indent?: ParagraphIndent;
  onIndentChange?: (patch: Partial<ParagraphIndent>) => void; onZoom?: (zoom: number) => void;
}
export const Pages = forwardRef<HTMLDivElement, PagesProps>(function Pages({ settings, pageCount, zoom, children, ruler = false, gridlines = false, view = 'print', marginGuides = true, rulerUnit = 'in', indent, onIndentChange, onZoom }, ref: Ref<HTMLDivElement>) {
  const size = pageDimensions(settings);
  const gap = 24;
  const totalHeight = pageCount * size.height + (pageCount - 1) * gap;
  const scale = zoom / 100;
  const scaledWidth = size.width * scale;
  const scaledHeight = totalHeight * scale;
  const scroll = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => scroll.current as HTMLDivElement, []);
  useEffect(() => {
    const element = scroll.current;
    if (!element || !onZoom) return;
    const wheel = (event: WheelEvent): void => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      onZoom(zoom + (event.deltaY < 0 ? 10 : -10));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { element.removeEventListener('wheel', wheel); };
  }, [onZoom, zoom]);
  return <div ref={scroll} className={`pages-scroll ${ruler ? 'with-rulers' : ''} ${gridlines ? 'with-gridlines' : ''} view-${view}`} data-testid="writer-canvas">
    <div className="page-stage" style={{ width: scaledWidth }}>
      {ruler && <div className="ruler-horizontal-row" style={{ width: scaledWidth }}><Ruler settings={settings} zoom={zoom} unit={rulerUnit} indent={indent} onIndentChange={onIndentChange} /></div>}
      {ruler && <div className="ruler-vertical-wrap" style={{ left: -20, top: 44 }}><Ruler settings={settings} orientation="vertical" zoom={zoom} unit={rulerUnit} /></div>}
      <div className="page-zoom-space" style={{ width: scaledWidth, height: scaledHeight }}>
        <div className="page-stack" style={{ width: size.width, height: totalHeight, transform: `scale(${scale})` }}>
          {Array.from({ length: pageCount }, (_, index) => <div key={index} className="paper-page" data-page={index + 1} style={{ top: index * (size.height + gap), width: size.width, height: size.height, backgroundColor: settings.background || undefined }}>
            {marginGuides && <div className="page-margin-guide" style={{ inset: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px` }} />}
            {marginGuides && <div className="crop-marks" aria-hidden="true" style={{ inset: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px` }}><i /><i /><i /><i /></div>}
            {settings.watermark && <div className="page-watermark">{settings.watermark}</div>}
            {(settings.header || settings.pageNumber.position === 'header') && <div className="page-header" style={{ left: settings.margins.left, right: settings.margins.right }}>{settings.header}{settings.pageNumber.position === 'header' && <span style={{ display: 'block', textAlign: settings.pageNumber.alignment }}>{pageNumberText(index + 1, pageCount, settings.pageNumber.format)}</span>}</div>}
            {settings.footer && <div className="page-footer" style={{ left: settings.margins.left, right: settings.margins.right }}>{settings.footer}</div>}
            {(settings.footer || settings.pageNumber.position === 'footer') && <div className={`page-number align-${settings.pageNumber.alignment}`} style={{ left: settings.margins.left, right: settings.margins.right }}>{pageNumberText(index + 1, pageCount, settings.pageNumber.format)}</div>}
          </div>)}
          <div className="page-content-layer" style={{ left: settings.margins.left, top: settings.margins.top, width: size.contentWidth, minHeight: size.contentHeight }}>{children}</div>
        </div>
      </div>
    </div>
    <span className="sr-only">{en.editor.pageCount}: {pageCount}</span>
  </div>;
});
