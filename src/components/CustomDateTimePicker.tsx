import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CustomDateTimePickerProps {
  value?: string; // Formats: "YYYY-MM-DD", "YYYY-MM-DD HH:mm", or ISO
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Select target deadline & time...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial or fallback date/time
  const parsed = useMemo(() => {
    if (!value) return null;
    // Check if format is "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD"
    const normalized = value.replace('T', ' ');
    const parts = normalized.split(' ');
    const dateParts = parts[0]?.split('-').map(Number);
    if (!dateParts || dateParts.length < 3 || isNaN(dateParts[0])) return null;

    let hours = 18; // default to 18:00 End of Day
    let minutes = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':').map(Number);
      if (!isNaN(timeParts[0])) hours = timeParts[0];
      if (!isNaN(timeParts[1])) minutes = timeParts[1];
    }

    return {
      year: dateParts[0],
      month: dateParts[1] - 1, // 0-indexed
      day: dateParts[2],
      hours,
      minutes,
    };
  }, [value]);

  // Current view year & month for calendar grid
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  // Current selected values in popover
  const [selectedYear, setSelectedYear] = useState<number | null>(parsed?.year ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(parsed?.month ?? null);
  const [selectedDay, setSelectedDay] = useState<number | null>(parsed?.day ?? null);
  const [selectedHour, setSelectedHour] = useState<number>(parsed?.hours ?? 18);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed?.minutes ?? 0);

  // Synchronize internal state when `value` prop changes
  useEffect(() => {
    if (parsed) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      setSelectedHour(parsed.hours);
      setSelectedMinute(parsed.minutes);
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    } else {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
      setSelectedHour(18);
      setSelectedMinute(0);
    }
  }, [parsed]);

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Helper to commit date change
  const commitDateTime = (y: number, m: number, d: number, h: number, min: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${y}-${pad(m + 1)}-${pad(d)} ${pad(h)}:${pad(min)}`;
    onChange(formatted);
  };

  const handleSelectDay = (dayNum: number, targetMonth: number, targetYear: number) => {
    setSelectedYear(targetYear);
    setSelectedMonth(targetMonth);
    setSelectedDay(dayNum);
    commitDateTime(targetYear, targetMonth, dayNum, selectedHour, selectedMinute);
  };

  const handleHourChange = (newHour: number) => {
    const clamped = Math.max(0, Math.min(23, newHour));
    setSelectedHour(clamped);
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      commitDateTime(selectedYear, selectedMonth, selectedDay, clamped, selectedMinute);
    }
  };

  const handleMinuteChange = (newMin: number) => {
    const clamped = Math.max(0, Math.min(59, newMin));
    setSelectedMinute(clamped);
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      commitDateTime(selectedYear, selectedMonth, selectedDay, selectedHour, clamped);
    }
  };

  const handleQuickPreset = (daysToAdd: number, hours = 18, mins = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    target.setHours(hours, mins, 0, 0);

    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    setSelectedHour(hours);
    setSelectedMinute(mins);
    setViewYear(y);
    setViewMonth(m);
    commitDateTime(y, m, d, hours, mins);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    onChange('');
    setIsOpen(false);
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  // Convert to Monday = 0
  const mondayFirstIndex = (firstDayOfWeek + 6) % 7;

  // Previous month trailing days
  const prevMonthDaysCount = new Date(viewYear, viewMonth, 0).getDate();
  const prevDays = [];
  for (let i = mondayFirstIndex - 1; i >= 0; i--) {
    prevDays.push({
      day: prevMonthDaysCount - i,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isOtherMonth: true,
    });
  }

  // Current month days
  const currentDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isOtherMonth: false,
    });
  }

  // Next month leading days to complete full weeks
  const totalSlots = prevDays.length + currentDays.length;
  const remainingSlots = totalSlots % 7 === 0 ? 0 : 7 - (totalSlots % 7);
  const nextDays = [];
  for (let d = 1; d <= remainingSlots; d++) {
    nextDays.push({
      day: d,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isOtherMonth: true,
    });
  }

  const allCalendarDays = [...prevDays, ...currentDays, ...nextDays];

  // Month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Formatted trigger display
  const formattedDisplay = useMemo(() => {
    if (selectedYear === null || selectedMonth === null || selectedDay === null) {
      return null;
    }
    const d = new Date(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute);
    const dayStr = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(selectedHour)}:${pad(selectedMinute)}`;
    return { dayStr, timeStr };
  }, [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full group flex items-center justify-between px-3.5 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-input,var(--border-color))] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-all cursor-pointer font-mono ${
          isOpen ? 'border-[var(--border-focus)] ring-1 ring-[var(--border-focus)] shadow-xs bg-[var(--bg-card)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-[var(--text-tertiary)] shrink-0" />
          {formattedDisplay ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-[var(--text-primary)] truncate">
                {formattedDisplay.dayStr}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] shrink-0 inline-flex items-center gap-1">
                <Clock size={10} />
                <span>{formattedDisplay.timeStr}</span>
              </span>
            </div>
          ) : (
            <span className="text-[var(--text-tertiary)] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {formattedDisplay && (
            <span
              onClick={handleClear}
              title="Clear deadline"
              className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <Clock size={13} className="text-[var(--text-tertiary)]" />
        </div>
      </button>

      {/* Floating Date & Time Popover */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 sm:right-auto sm:w-80 mt-1.5 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-focus)] shadow-2xl animate-in fade-in zoom-in-95 duration-120"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1 pb-3 mb-3 border-b border-[var(--border-color)] overflow-x-auto text-[11px] font-mono">
            <button
              type="button"
              onClick={() => handleQuickPreset(0, 18, 0)}
              className="px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(1, 18, 0)}
              className="px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(3, 18, 0)}
              className="px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7, 18, 0)}
              className="px-2 py-1 rounded border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            >
              +1 Week
            </button>
          </div>

          {/* Month & Year Header Controls */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight text-[var(--text-primary)]">
              <span>{monthNames[viewMonth]}</span>
              <span className="font-mono text-[var(--text-secondary)]">{viewYear}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleJumpToToday}
                title="Current month"
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous month"
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next month"
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day of Week Headers (Mo - Su) */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase text-[var(--text-tertiary)] mb-1">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {allCalendarDays.map((item, idx) => {
              const isSelected =
                selectedYear === item.year &&
                selectedMonth === item.month &&
                selectedDay === item.day;

              const isCurrentDay =
                today.getFullYear() === item.year &&
                today.getMonth() === item.month &&
                today.getDate() === item.day;

              return (
                <button
                  key={`${item.year}-${item.month}-${item.day}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(item.day, item.month, item.year)}
                  className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto flex items-center justify-center rounded-md transition-colors cursor-pointer relative text-[11px] ${
                    isSelected
                      ? 'bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] font-semibold shadow-xs'
                      : item.isOtherMonth
                      ? 'text-[var(--text-tertiary)] opacity-35 hover:bg-[var(--bg-subtle)] hover:opacity-80'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  } ${isCurrentDay && !isSelected ? 'ring-1 ring-[var(--border-focus)] font-bold' : ''}`}
                >
                  <span>{item.day}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--text-primary)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="mt-3.5 pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-[var(--text-secondary)] uppercase text-[10px] inline-flex items-center gap-1.5">
                <Clock size={11} />
                <span>Time (24h)</span>
              </span>

              {/* Time Presets */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    handleHourChange(9);
                    handleMinuteChange(0);
                  }}
                  className="px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  09:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleHourChange(14);
                    handleMinuteChange(0);
                  }}
                  className="px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  14:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleHourChange(18);
                    handleMinuteChange(0);
                  }}
                  className="px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  18:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleHourChange(23);
                    handleMinuteChange(59);
                  }}
                  className="px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  23:59
                </button>
              </div>
            </div>

            {/* Time Spinners / Direct Inputs */}
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] font-mono">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={selectedHour.toString().padStart(2, '0')}
                  onChange={(e) => handleHourChange(parseInt(e.target.value, 10) || 0)}
                  className="w-10 text-center py-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                />
                <span className="text-[var(--text-tertiary)] font-bold">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={selectedMinute.toString().padStart(2, '0')}
                  onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10) || 0)}
                  className="w-10 text-center py-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {selectedHour < 12 ? 'AM' : 'PM'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-color)] font-mono text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                // If no date was selected yet, default to today
                if (selectedYear === null || selectedMonth === null || selectedDay === null) {
                  const now = new Date();
                  handleSelectDay(now.getDate(), now.getMonth(), now.getFullYear());
                }
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check size={12} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
