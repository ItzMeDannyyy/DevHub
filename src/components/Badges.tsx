import React from 'react';
import {
  Briefcase,
  Users,
  User,
  GraduationCap,
  Globe,
  Folder,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Minus,
} from 'lucide-react';
import { ProjectCategory, Priority } from '../types';

// ==========================================
// CATEGORY CONFIGURATION & BADGE
// ==========================================

export interface CategoryMeta {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dotColor: string;
  badgeClasses: string;
  description: string;
}

export const CATEGORY_METAS: Record<Exclude<ProjectCategory, 'all'>, CategoryMeta> = {
  work: {
    label: 'Work',
    icon: Briefcase,
    dotColor: 'bg-sky-600 dark:bg-sky-400',
    badgeClasses:
      'bg-sky-100 text-sky-950 border-sky-400 font-bold dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40',
    description: 'Internal & team core systems',
  },
  client: {
    label: 'Client',
    icon: Users,
    dotColor: 'bg-purple-600 dark:bg-purple-400',
    badgeClasses:
      'bg-purple-100 text-purple-950 border-purple-400 font-bold dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
    description: 'External deliverables & contracts',
  },
  personal: {
    label: 'Personal',
    icon: User,
    dotColor: 'bg-emerald-600 dark:bg-emerald-400',
    badgeClasses:
      'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    description: 'Side projects & experiments',
  },
  school: {
    label: 'School',
    icon: GraduationCap,
    dotColor: 'bg-amber-600 dark:bg-amber-400',
    badgeClasses:
      'bg-amber-100 text-amber-950 border-amber-400 font-bold dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    description: 'Academic courses & university assignments',
  },
  'open-source': {
    label: 'Open Source',
    icon: Globe,
    dotColor: 'bg-teal-600 dark:bg-teal-400',
    badgeClasses:
      'bg-teal-100 text-teal-950 border-teal-400 font-bold dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40',
    description: 'Public community repositories',
  },
};

interface CategoryBadgeProps {
  category: ProjectCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
  showDot = true,
  className = '',
}) => {
  if (category === 'all') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        } ${className}`}
      >
        {showIcon && <Folder size={size === 'sm' ? 10 : 12} />}
        <span>All</span>
      </span>
    );
  }

  const meta = CATEGORY_METAS[category] || CATEGORY_METAS.work;
  const IconComponent = meta.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-2.5 py-1 text-xs gap-2',
  }[size];

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono uppercase tracking-wider font-medium shadow-2xs ${meta.badgeClasses} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor}`} />
      )}
      {showIcon && <IconComponent size={iconSize} className="shrink-0" />}
      <span className="truncate">{meta.label}</span>
    </span>
  );
};

// ==========================================
// PRIORITY CONFIGURATION & BADGE
// ==========================================

export interface PriorityMeta {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dotColor: string;
  badgeClasses: string;
  description: string;
  pulse?: boolean;
}

export const PRIORITY_METAS: Record<Priority, PriorityMeta> = {
  critical: {
    label: 'Critical',
    icon: AlertOctagon,
    dotColor: 'bg-rose-600 dark:bg-rose-500',
    badgeClasses:
      'bg-rose-100 text-rose-950 border-rose-400 font-bold dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/40',
    description: 'Immediate deadline or blocking milestone',
    pulse: true,
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    dotColor: 'bg-orange-600 dark:bg-orange-500',
    badgeClasses:
      'bg-orange-100 text-orange-950 border-orange-400 font-bold dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40',
    description: 'Active sprint deliverables',
    pulse: false,
  },
  medium: {
    label: 'Medium',
    icon: Clock,
    dotColor: 'bg-indigo-600 dark:bg-indigo-400',
    badgeClasses:
      'bg-indigo-100 text-indigo-950 border-indigo-400 font-bold dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40',
    description: 'Normal backlog pacing',
    pulse: false,
  },
  low: {
    label: 'Low',
    icon: Minus,
    dotColor: 'bg-zinc-600 dark:bg-zinc-400',
    badgeClasses:
      'bg-zinc-200 text-zinc-950 border-zinc-400 font-bold dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/40',
    description: 'Backlog or exploratory feature',
    pulse: false,
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
  showDot = true,
  className = '',
}) => {
  const meta = PRIORITY_METAS[priority] || PRIORITY_METAS.medium;
  const IconComponent = meta.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-2.5 py-1 text-xs gap-2',
  }[size];

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono uppercase tracking-wider font-medium shadow-2xs ${meta.badgeClasses} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor} ${
            meta.pulse ? 'animate-pulse ring-2 ring-rose-500/30' : ''
          }`}
        />
      )}
      {showIcon && <IconComponent size={iconSize} className="shrink-0" />}
      <span className="truncate">{meta.label}</span>
    </span>
  );
};
