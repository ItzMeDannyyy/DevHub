import React, { useRef, useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ProjectCategory } from '../types';

interface ScopeFilterProps {
  selectedCategory: ProjectCategory;
  onSelectCategory: (cat: ProjectCategory) => void;
  projectCount: number;
}

export const ScopeFilter: React.FC<ScopeFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  projectCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const categories: { key: ProjectCategory; label: string; dot?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'work', label: 'Work', dot: 'bg-sky-500' },
    { key: 'client', label: 'Client', dot: 'bg-purple-500' },
    { key: 'personal', label: 'Personal', dot: 'bg-emerald-500' },
    { key: 'school', label: 'School', dot: 'bg-amber-500' },
    { key: 'open-source', label: 'Open Source', dot: 'bg-teal-500' },
  ];

  // Update sliding pill position on selection or resize
  useEffect(() => {
    const updatePosition = () => {
      const activeEl = tabsRef.current[selectedCategory];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [selectedCategory, projectCount]);

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto py-1">
      <span className="text-[11px] font-mono text-[var(--text-tertiary)] mr-1 inline-flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal size={12} />
        <span>Scope:</span>
      </span>

      {/* Pill Container with Smooth Sliding Background */}
      <div
        ref={containerRef}
        className="relative inline-flex items-center p-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs"
      >
        {/* Animated Sliding Pill Highlight */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-[var(--active-pill-bg)] border border-[var(--border-color)] shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {/* Tab Buttons */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              ref={(el) => {
                tabsRef.current[cat.key] = el;
              }}
              onClick={() => onSelectCategory(cat.key)}
              className={`relative z-10 px-3 py-1 rounded-full text-xs font-mono transition-colors duration-200 cursor-pointer whitespace-nowrap inline-flex items-center ${
                isActive
                  ? 'text-[var(--active-pill-text)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${cat.dot}`} />
              )}
              <span>{cat.label}</span>
              {cat.key === 'all' && (
                <span className="ml-1 opacity-75 text-[10px]">
                  [{projectCount}]
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
