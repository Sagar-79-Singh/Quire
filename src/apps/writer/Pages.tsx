import { forwardRef } from 'react';
import type { ReactNode, Ref } from 'react';
import type { PageSettings } from './model';
import { pageDimensions, pageNumberText } from './model';
import { en } from '../../i18n/en';
export interface PagesProps { settings: PageSettings; pageCount: number; zoom: number; children: ReactNode; ruler?: boolean; gridlines?: boolean; view?: 'print' | 'web' | 'read'; }
export const Pages = forwardRef<HTMLDivElement, PagesProps>(function Pages({ settings, pageCount, zoom, children, ruler = false, gridlines = false, view = 'print' }, ref: Ref<HTMLDivElement>) {
  const size = pageDimensions(settings); const gap = 24; const totalHeight = pageCount * size.height + (pageCount - 1) * gap;
  return <div ref={ref} className={`pages-scroll ${ruler ? 'with-rulers' : ''} ${gridlines ? 'with-gridlines' : ''} view-${view}`} data-testid="writer-canvas">
    <div className="page-zoom-space" style={{ width: size.width * zoom / 100 + (ruler ? 20 : 0), height: totalHeight * zoom / 100 + (ruler ? 20 : 0) }}>
      <div className="page-stack" style={{ width: size.width, height: totalHeight, transform: `scale(${zoom / 100})`, marginLeft: ruler ? 20 : 0, marginTop: ruler ? 20 : 0 }}>
        {Array.from({ length: pageCount }, (_, index) => <div key={index} className="paper-page" data-page={index + 1} style={{ top: index * (size.height + gap), width: size.width, height: size.height, backgroundColor: settings.background || undefined }}>
          <div className="page-margin-guide" style={{ inset: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px` }} />
          {settings.watermark && <div className="page-watermark">{settings.watermark}</div>}
          {(settings.header || settings.pageNumber.position === 'header') && <div className="page-header" style={{ left: settings.margins.left, right: settings.margins.right }}>{settings.header}{settings.pageNumber.position === 'header' && <span style={{ display: 'block', textAlign: settings.pageNumber.alignment }}>{pageNumberText(index + 1, pageCount, settings.pageNumber.format)}</span>}</div>}
          {settings.footer && <div className="page-footer" style={{ left: settings.margins.left, right: settings.margins.right }}>{settings.footer}</div>}
          {(settings.footer || settings.pageNumber.position === 'footer') && <div className={`page-number align-${settings.pageNumber.alignment}`} style={{ left: settings.margins.left, right: settings.margins.right }}>{pageNumberText(index + 1, pageCount, settings.pageNumber.format)}</div>}
        </div>)}
        <div className="page-content-layer" style={{ left: settings.margins.left, top: settings.margins.top, width: size.contentWidth, minHeight: size.contentHeight }}>{children}</div>
      </div>
    </div>
    <span className="sr-only">{en.editor.pageCount}: {pageCount}</span>
  </div>;
});
