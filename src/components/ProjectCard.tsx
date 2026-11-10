import React, { useState } from 'react';
import {
  Star,
  GitBranch,
  FileCode2,
  Calendar,
  ExternalLink,
  Terminal,
  FolderOpen,
  Trash2,
  Edit3,
  Copy,
  Check,
  MoreVertical,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onOpenIde: (p: Project) => void;
  onOpenTerminal: (p: Project) => void;
  onOpenFolder: (p: Project) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpenIde,
  onOpenTerminal,
  onOpenFolder,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Calculate days remaining until deadline
  const getDeadlineBadge = () => {
    if (!project.deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(project.deadline);
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
          <AlertCircle size={11} />
          <span>Overdue by {Math.abs(diffDays)}d</span>
        </span>
      );
    }
    if (diffDays <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
          <Clock size={11} />
          <span>Due in {diffDays}d</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
        <Calendar size={11} />
        <span>Due {project.deadline}</span>
      </span>
    );
  };

  const priorityColors = {
    critical: 'bg-rose-950/80 text-rose-300 border-rose-800',
    high: 'bg-orange-950/80 text-orange-300 border-orange-800',
    medium: 'bg-amber-950/80 text-amber-300 border-amber-800',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="relative group rounded-xl bg-slate-900 border border-slate-800/90 hover:border-indigo-500/50 p-5 transition-all shadow-md hover:shadow-indigo-950/30 flex flex-col justify-between">
      <div>
        {/* Card Header: Title & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {project.category}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  priorityColors[project.priority]
                }`}
              >
                {project.priority}
              </span>
              {getDeadlineBadge()}
            </div>
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
              {project.name}
            </h3>
          </div>

          {/* Action Top Right: Favorite & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(project.id)}
              className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                project.favorite
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={project.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star
                size={16}
                fill={project.favorite ? 'currentColor' : 'none'}
              />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 mt-1 w-32 rounded-lg bg-slate-950 border border-slate-800 shadow-xl py-1 z-20"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(project);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(project.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/40 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Path Display */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/70 px-2.5 py-1.5 rounded border border-slate-800/80">
          <span className="truncate mr-2" title={project.path}>
            {project.path}
          </span>
          <button
            onClick={handleCopyPath}
            className="text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Copy path"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {/* Notes (if any) */}
        {project.notes && (
          <p className="mt-2.5 text-xs text-slate-400 line-clamp-2">
            {project.notes}
          </p>
        )}

        {/* Git Status Pill Strip */}
        {project.gitStatus && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-900/50 font-mono text-[11px]">
              <GitBranch size={12} />
              <span>{project.gitStatus.branch}</span>
            </span>

            {project.gitStatus.uncommittedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40 text-[11px]">
                <FileCode2 size={12} />
                <span>{project.gitStatus.uncommittedCount} modified</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 text-[11px]">
                <Check size={12} />
                <span>Clean</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Launcher Buttons Toolbar */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenIde(project)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <ExternalLink size={14} />
          <span>Open in VS Code</span>
        </button>

        <button
          onClick={() => onOpenTerminal(project)}
          title="Open in Terminal"
          className="inline-flex items-center justify-center w-9 h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750 transition-colors cursor-pointer"
        >
          <Terminal size={15} />
        </button>

        <button
          onClick={() => onOpenFolder(project)}
          title="Open Folder Explorer"
          className="inline-flex items-center justify-center w-9 h-8.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750 transition-colors cursor-pointer"
        >
          <FolderOpen size={15} />
        </button>
      </div>
    </div>
  );
};
