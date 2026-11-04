import { useId } from 'react';
interface SliderProps { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; disabled?: boolean; disabledReason?: string; className?: string; }
export function Slider({ label, value, min, max, step = 1, onChange, disabled = false, disabledReason, className = '' }: SliderProps) {
  const id = useId();
  const clamped = Math.min(max, Math.max(min, value));
  return <div className={`slider-control ${className}`} title={disabled ? disabledReason : undefined}>
    <label className="sr-only" htmlFor={id}>{label}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={clamped} disabled={disabled} aria-label={label} aria-valuetext={`${clamped}`} onChange={(event) => { onChange(Number(event.target.value)); }} style={{ backgroundSize: `${((clamped - min) / Math.max(1, max - min)) * 100}% 100%` }} />
  </div>;
}
