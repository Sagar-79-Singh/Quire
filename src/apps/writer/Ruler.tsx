import { useCallback, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { pageDimensions } from './model';
import type { PageSettings } from './model';
import { en } from '../../i18n/en';

export type RulerUnit = 'in' | 'cm';
export interface ParagraphIndent { firstLine: number; hanging: number; left: number; right: number; }
export const defaultIndent: ParagraphIndent = { firstLine: 0, hanging: 0, left: 0, right: 0 };
export function rulerTicks(length: number): number[] { return Array.from({ length: Math.floor(Math.max(0, length) / 96) + 1 }, (_, index) => index * 96); }
export function rulerLabel(inches: number, unit: RulerUnit): string { return unit === 'in' ? String(inches) : String(Math.round(inches * 2.54 * 100) / 100); }

interface RulerProps {
  settings: PageSettings; orientation?: 'horizontal' | 'vertical'; zoom?: number; unit?: RulerUnit;
  indent?: ParagraphIndent; onIndentChange?: (patch: Partial<ParagraphIndent>) => void;
}
export function Ruler({ settings, orientation = 'horizontal', zoom = 100, unit = 'in', indent = defaultIndent, onIndentChange }: RulerProps) {
  const size = pageDimensions(settings);
  const horizontal = orientation === 'horizontal';
  const scale = zoom / 100;
  const length = (horizontal ? size.width : size.height) * scale;
  const start = (horizontal ? settings.margins.left : settings.margins.top) * scale;
  const end = length - (horizontal ? settings.margins.right : settings.margins.bottom) * scale;
  const drag = useRef<{ kind: keyof ParagraphIndent; x: number; y: number; value: number } | null>(null);
  const move = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || !onIndentChange) return;
    const delta = (horizontal ? event.clientX - state.x : event.clientY - state.y) / scale;
    const value = Math.max(-96, Math.min(480, Math.round(state.value + delta)));
    onIndentChange({ [state.kind]: value });
  }, [horizontal, onIndentChange, scale]);
  const startDrag = (kind: keyof ParagraphIndent) => (event: PointerEvent<HTMLDivElement>): void => {
    if (!onIndentChange) return;
    event.preventDefault();
    if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { kind, x: event.clientX, y: event.clientY, value: indent[kind] };
  };
  const key = (kind: keyof ParagraphIndent) => (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!onIndentChange || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    onIndentChange({ [kind]: Math.max(-96, Math.min(480, indent[kind] + direction * 12)) });
  };
  const marker = (kind: keyof ParagraphIndent, label: string, position: number, className: string) => <div
    key={kind} role="slider" tabIndex={0} aria-label={label} aria-valuemin={-96} aria-valuemax={480} aria-valuenow={indent[kind]}
    className={`ruler-marker ${className}`} style={{ [horizontal ? 'left' : 'top']: position }}
    onPointerDown={startDrag(kind)} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onKeyDown={key(kind)}
  />;
  return <div className={`ruler ruler-${orientation}`} aria-label={horizontal ? en.editor.horizontalRuler : en.editor.verticalRuler} role="group" style={{ [horizontal ? 'width' : 'height']: length, [horizontal ? 'height' : 'width']: 20 }}>
    <div className="ruler-track">
      <span className="ruler-shade" style={{ [horizontal ? 'left' : 'top']: 0, [horizontal ? 'width' : 'height']: start }} />
      <span className="ruler-shade" style={{ [horizontal ? 'left' : 'top']: end, [horizontal ? 'width' : 'height']: length - end }} />
      {rulerTicks(horizontal ? size.width : size.height).map((tick) => <span className="ruler-tick" key={tick} style={{ [horizontal ? 'left' : 'top']: tick * scale }}><i />{tick > 0 && <small>{rulerLabel(tick / 96, unit)}</small>}</span>)}
      {Array.from({ length: Math.floor((horizontal ? size.width : size.height) / 24) + 1 }, (_, index) => index * 24).filter((tick) => tick % 96 !== 0).map((tick) => <span className="ruler-tick ruler-tick-minor" key={tick} style={{ [horizontal ? 'left' : 'top']: tick * scale }}><i /></span>)}
      {horizontal && <>
        {marker('firstLine', en.ui.firstLineIndent, start + (indent.left + indent.firstLine) * scale, 'ruler-marker-first')}
        {marker('hanging', en.ui.hangingIndent, start + (indent.left + indent.hanging) * scale, 'ruler-marker-hanging')}
        {marker('left', en.ui.leftIndent, start + indent.left * scale, 'ruler-marker-left')}
        {marker('right', en.ui.rightIndent, end - indent.right * scale, 'ruler-marker-right')}
      </>}
    </div>
  </div>;
}
