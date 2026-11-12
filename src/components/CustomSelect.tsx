import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  customRender?: React.ReactNode;
  description?: string;
  chip?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  menuWidth?: string;
  align?: 'left' | 'right';
  renderTrigger?: (selected: SelectOption<T> | undefined, isOpen: boolean) => React.ReactNode;
}

export const CustomSelect = <T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  leadingIcon,
  disabled = false,
  className = '',
  menuWidth = 'w-full min-w-[260px]',
  align = 'left',
  renderTrigger,
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      {renderTrigger ? (
        <div onClick={() => !disabled && setIsOpen((prev) => !prev)}>
          {renderTrigger(selectedOption, isOpen)}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full group flex items-center justify-between px-3.5 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-input,var(--border-color))] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-all cursor-pointer font-mono ${
            isOpen ? 'border-[var(--border-focus)] ring-1 ring-[var(--border-focus)] shadow-xs bg-[var(--bg-card)]' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.customRender ? (
              <div className="truncate">{selectedOption.customRender}</div>
            ) : (
              <>
                {/* Leading icon or option icon */}
                <span className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0 flex items-center transition-colors">
                  {selectedOption?.icon || leadingIcon}
                </span>

                {/* Optional colored badge */}
                {selectedOption?.badge && (
                  <span className="shrink-0 flex items-center">{selectedOption.badge}</span>
                )}

                {/* Option label */}
                <span className="truncate font-medium text-[var(--text-primary)]">
                  {selectedOption ? selectedOption.label : placeholder}
                </span>

                {/* Shell / command chip if present */}
                {selectedOption?.chip && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                    {selectedOption.chip}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Chevron with smooth rotation */}
          <div className="p-0.5 rounded text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors ml-2 shrink-0">
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''
              }`}
            />
          </div>
        </button>
      )}

      {/* Floating Options Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hover)] shadow-2xl animate-in fade-in zoom-in-95 duration-120 max-h-68 overflow-y-auto ${menuWidth} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full group/item flex items-center justify-between p-2 rounded-lg text-left font-mono text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium border border-[var(--border-color)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                    {option.customRender ? (
                      <div className="truncate flex items-center gap-2">
                        {option.customRender}
                        {option.description && (
                          <span className="text-[10px] text-[var(--text-tertiary)] truncate hidden sm:inline">
                            • {option.description}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {option.icon && (
                          <span className="text-[var(--text-tertiary)] group-hover/item:text-[var(--text-primary)] shrink-0 flex items-center transition-colors">
                            {option.icon}
                          </span>
                        )}
                        {option.badge && (
                          <span className="shrink-0 flex items-center">{option.badge}</span>
                        )}
                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">{option.label}</span>
                            {option.chip && (
                              <span className="px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[10px] text-[var(--text-tertiary)] font-mono shrink-0">
                                {option.chip}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <span className="block text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Selected checkmark indicator */}
                  <div className="shrink-0 ml-1">
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] flex items-center justify-center shadow-2xs">
                        <Check size={11} strokeWidth={2.8} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-transparent group-hover/item:border-[var(--border-color)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
