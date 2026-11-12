import React from 'react';
import {
  Star,
  GitBranch,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { Project, getProjectServices } from '../types';
import { formatDeadlineDisplay } from '../utils/date';
import { CategoryBadge, PriorityBadge } from './Badges';

interface ProjectCardProps {
  project: Project;
  onSelect: (p: Project) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onToggleFavorite,
}) => {
  const services = getProjectServices(project);
  const activeServices = services.filter((s) => !!s.runningProcess);
  const isProcessRunning = activeServices.length > 0;

  return (
    <div
      onClick={() => onSelect(project)}
      className="monochrome-card group relative rounded-xl p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Minimalist Meta Row */}
        <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryBadge category={project.category} size="sm" />
            <PriorityBadge priority={project.priority} size="sm" />

            {isProcessRunning && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {activeServices.length === 1
                    ? '1 Service Active'
                    : `${activeServices.length} Services Active`}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {project.deadline && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs">
                <Calendar size={11} className="text-amber-500" />
                <span>{formatDeadlineDisplay(project.deadline)}</span>
              </span>
            )}

            <button
              onClick={(e) => onToggleFavorite(project.id, e)}
              className={`p-1 rounded hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer ${
                project.favorite
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
              title={project.favorite ? 'Unstar' : 'Star'}
            >
              <Star
                size={14}
                fill={project.favorite ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>

        {/* Project Name & Path */}
        <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)] group-hover:underline underline-offset-4">
          {project.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-tertiary)] font-mono truncate">
          {project.path}
        </p>
      </div>

      {/* Bottom Minimalist Footer */}
      <div className="mt-5 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2 truncate">
          {project.gitStatus && (
            <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
              <GitBranch size={12} />
              <span>{project.gitStatus.branch}</span>
            </span>
          )}

          {project.gitStatus && project.gitStatus.uncommittedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/15 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{project.gitStatus.uncommittedCount} modified</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
          <span className="text-[11px] font-mono">Control</span>
          <ArrowUpRight size={13} />
        </div>
      </div>
    </div>
  );
};
