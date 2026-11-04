import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
export interface RibbonButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName; label: string; size?: 'sm' | 'md' | 'lg'; active?: boolean; hideLabel?: boolean; disabledReason?: string;
}
export function RibbonButton({ icon, label, size = 'sm', active, hideLabel = false, disabled, disabledReason, className = '', ...props }: RibbonButtonProps) {
  return <button type="button" aria-label={label} aria-pressed={active} disabled={disabled} title={disabled ? disabledReason ?? label : label} className={`ribbon-button ribbon-button-${size} ${active ? 'is-active' : ''} ${className}`} {...props}>
    <Icon name={icon} size={size === 'lg' ? 32 : 16} />{!hideLabel && <span>{label}</span>}
  </button>;
}
