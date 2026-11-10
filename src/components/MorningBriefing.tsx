import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  History,
  GitBranch,
  FileCode2,
  CalendarClock,
  Play,
  ArrowRight,
} from 'lucide-react';
import { Project } from '../types';

interface MorningBriefingProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({
  projects,
  onOpenProject,
}) => {
  // 1. Calculate Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }

  // 2. Identify Urgent Projects (deadline within 3 days)
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const urgentProjects = projects.filter((p) => {
    if (!p.deadline) return false;
    const d = new Date(p.deadline);
    return d <= threeDaysFromNow;
  });

  // 3. Identify Stale Projects (no commits in 7+ days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleProjects = projects.filter((p) => {
    if (!p.gitStatus?.lastCommitTime) return false;
    const lastCommit = new Date(p.gitStatus.lastCommitTime);
    return lastCommit < sevenDaysAgo;
  });

  // 4. Identify most recently touched project to "Pick up where you left off"
  const recentProject = [...projects].sort((a, b) => {
    const timeA = new Date(a.lastOpenedAt || a.createdAt).getTime();
    const timeB = new Date(b.lastOpenedAt || b.createdAt).getTime();
    return timeB - timeA;
  })[0];

  return (
    <section className="mb-8 rounded-xl border border-indigo-900/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 p-6 shadow-xl backdrop-blur-sm">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              {greeting}, Developer!
            </h2>
            <p className="text-xs text-slate-400">
              Here is your daily project overview to keep you ahead of schedule.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Strip */}
        <div className="flex items-center gap-3">
          {urgentProjects.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/50">
              <AlertTriangle size={13} className="text-rose-400" />
              <span>{urgentProjects.length} Approaching Deadline</span>
            </div>
          )}
          {staleProjects.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50">
              <History size={13} className="text-amber-400" />
              <span>{staleProjects.length} Inactive {'>'} 7 Days</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Pick up where left off + Urgent Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        {/* Pick Up Where You Left Off */}
        {recentProject && (
          <div className="lg:col-span-2 rounded-lg bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 inline-flex items-center gap-1.5">
                  <Play size={12} fill="currentColor" />
                  Pick Up Where You Left Off
                </span>
                <span className="text-xs text-slate-400">
                  {recentProject.category.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                {recentProject.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-mono">
                {recentProject.path}
              </p>

              {recentProject.gitStatus && (
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/50 font-mono text-[11px]">
                    <GitBranch size={12} />
                    {recentProject.gitStatus.branch}
                  </span>
                  {recentProject.gitStatus.uncommittedCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40 text-[11px]">
                      <FileCode2 size={12} />
                      {recentProject.gitStatus.uncommittedCount} uncommitted files
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[11px]">
                      Clean working tree
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px] truncate max-w-xs">
                    "{recentProject.gitStatus.lastCommitMessage}"
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-end">
              <button
                onClick={() => onOpenProject(recentProject)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>Launch in VS Code</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Priority Focus Widget */}
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-400 mb-2">
              <CalendarClock size={13} />
              <span>Priority Deadlines</span>
            </div>

            {urgentProjects.length === 0 ? (
              <p className="text-xs text-slate-400 mt-4">
                No immediate deadlines in the next 3 days. You're fully caught up!
              </p>
            ) : (
              <div className="space-y-2.5 mt-2">
                {urgentProjects.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p)}
                    className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/50">
                        {p.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-500 text-right">
            Daily Dev Standup
          </div>
        </div>
      </div>
    </section>
  );
};
