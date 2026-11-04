interface ToggleProps { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; disabledReason?: string; compact?: boolean; }
export function Toggle({ label, checked, onChange, disabled = false, disabledReason, compact = false }: ToggleProps) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} title={disabled ? disabledReason : label} onClick={() => { onChange(!checked); }} className={`toggle ${compact ? 'toggle-compact' : ''}`}>
    <span className="toggle-track"><span className="toggle-thumb" /></span><span>{label}</span>
  </button>;
}
