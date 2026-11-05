import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Icon } from './Icon';

export interface FontDropdownOption {
  value: string;
  label: string;
  fontFamily?: string;
}

export interface FontDropdownGroup {
  label?: string;
  options: readonly FontDropdownOption[];
}

const tabStopSelector = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function getTabStops(listbox: HTMLDivElement | null): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(tabStopSelector)).filter((element) => {
    if (element === listbox || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return true;
  });
}

export interface FontDropdownProps {
  label: string;
  value: string;
  groups: readonly FontDropdownGroup[];
  width: number;
  onChange: (value: string) => void;
  testId?: string;
  className?: string;
}

export function FontDropdown({ label, value, groups, width, onChange, testId, className = '' }: FontDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const generatedId = useId().replace(/:/g, '');
  const listboxId = `${generatedId}-listbox`;
  const flattenedOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selectedIndex = flattenedOptions.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? flattenedOptions[selectedIndex] : undefined;
  const activeOption = flattenedOptions[activeIndex];
  const optionId = (index: number): string => `${generatedId}-option-${index}`;

  const openMenu = (): void => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };
  const closeMenu = (): void => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const selectOption = (option: FontDropdownOption): void => {
    onChange(option.value);
    closeMenu();
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: globalThis.MouseEvent): void => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return () => { document.removeEventListener('mousedown', outside); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listboxRef.current?.focus();
    listboxRef.current?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const moveActive = (direction: -1 | 1): void => {
    if (!flattenedOptions.length) return;
    setActiveIndex((index) => (index + direction + flattenedOptions.length) % flattenedOptions.length);
  };
  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      openMenu();
    } else if (open && event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };
  const onListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
    else if (event.key === 'Home' && flattenedOptions.length) { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === 'End' && flattenedOptions.length) { event.preventDefault(); setActiveIndex(flattenedOptions.length - 1); }
    else if ((event.key === 'Enter' || event.key === ' ') && activeOption) { event.preventDefault(); selectOption(activeOption); }
    else if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
    else if (event.key === 'Tab') {
      event.preventDefault();
      const tabStops = getTabStops(listboxRef.current);
      const currentIndex = triggerRef.current ? tabStops.indexOf(triggerRef.current) : -1;
      if (event.shiftKey) triggerRef.current?.focus();
      else if (currentIndex >= 0 && tabStops.length > 1) tabStops[(currentIndex + 1) % tabStops.length]?.focus();
      else triggerRef.current?.focus();
      setOpen(false);
    }
  };

  let index = 0;
  return <div ref={rootRef} className={className ? `font-dropdown ${className}` : 'font-dropdown'} style={{ width }}>
    <button
      ref={triggerRef}
      type="button"
      className="font-dropdown-trigger"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      data-testid={testId}
      onClick={() => { if (open) closeMenu(); else openMenu(); }}
      onKeyDown={onTriggerKeyDown}
    >
      <span className="font-dropdown-value" style={selectedOption?.fontFamily ? { fontFamily: selectedOption.fontFamily } : undefined}>{selectedOption?.label ?? value}</span>
      <Icon name="chevronDown" className="font-dropdown-chevron" />
    </button>
    {open && <div
      ref={listboxRef}
      id={listboxId}
      className="font-dropdown-listbox"
      role="listbox"
      aria-label={`${label} options`}
      aria-activedescendant={activeOption ? optionId(activeIndex) : undefined}
      tabIndex={0}
      onKeyDown={onListboxKeyDown}
    >
      {groups.map((group, groupIndex) => <div
        key={`${group.label ?? 'options'}-${groupIndex}`}
        className="font-dropdown-group"
        role={group.label ? 'group' : undefined}
        aria-label={group.label}
      >
        {group.label && <div className="font-dropdown-heading" data-font-group-heading="true" role="presentation">{group.label}</div>}
        {group.options.map((option) => {
          const optionIndex = index;
          index += 1;
          return <div
            key={option.value}
            id={optionId(optionIndex)}
            className={`font-dropdown-option ${optionIndex === activeIndex ? 'is-active' : ''}`}
            role="option"
            aria-selected={option.value === value}
            data-option-index={optionIndex}
            data-option-value={option.value}
            style={option.fontFamily ? { fontFamily: option.fontFamily } : undefined}
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => { event.preventDefault(); }}
            onMouseEnter={() => { setActiveIndex(optionIndex); }}
            onClick={() => { selectOption(option); }}
          >{option.label}</div>;
        })}
      </div>)}
    </div>}
  </div>;
}
