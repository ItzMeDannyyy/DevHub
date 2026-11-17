import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  GitBranch,
} from 'lucide-react';
import { Project, getProjectServices } from '../types';
import { CategoryBadge, PriorityBadge } from './Badges';
import { VsCodeIcon } from './VsCodeIcon';

interface MorningBriefingProps {
  projects: Project[];
  developerName?: string;
  animateName?: boolean;
  onSelectProject: (project: Project) => void;
  onOpenIde: (project: Project) => void;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({
  projects,
  developerName = 'Developer',
  animateName = true,
  onSelectProject,
  onOpenIde,
}) => {
  const activeName = (developerName || '').trim() || 'Developer';
  const [charCount, setCharCount] = useState(1);

  // Live Philippines Clock (Asia/Manila) in 24h format (HH:mm:ss)
  const [phTime, setPhTime] = useState(() => {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  });

  const [phDate, setPhDate] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  });

  useEffect(() => {
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const updateClock = () => {
      const now = new Date();
      setPhTime(timeFormatter.format(now));
      setPhDate(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Manila',
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-of-day greeting prefix based on Philippines hour
  const phHour = parseInt(phTime.split(':')[0], 10);
  let greetingPrefix = 'Good Morning';
  if (!isNaN(phHour)) {
    if (phHour >= 12 && phHour < 17) {
      greetingPrefix = 'Good Afternoon';
    } else if (phHour >= 17 || phHour < 4) {
      greetingPrefix = 'Good Evening';
    }
  }

  // Character Pop-out Animation Loop (0.3s per character)
  useEffect(() => {
    if (!animateName) {
      setCharCount(activeName.length);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    if (charCount < activeName.length) {
      // Pop out the next character after 0.3s
      timeoutId = setTimeout(() => {
        setCharCount((prev) => prev + 1);
      }, 300);
    } else {
      // Full name is rendered: wait 1.2s, then reset back to the first character
      timeoutId = setTimeout(() => {
        setCharCount(1);
      }, 1200);
    }

    return () => clearTimeout(timeoutId);
  }, [charCount, activeName, animateName]);

  // When activeName or animateName changes, restart
  useEffect(() => {
    setCharCount(1);
  }, [activeName, animateName]);

  const displayedName = animateName
    ? activeName.slice(0, charCount)
    : activeName;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const urgentProjects = projects.filter((p) => {
    if (!p.deadline) return false;
    const d = new Date(p.deadline.replace(' ', 'T'));
    return !isNaN(d.getTime()) && d <= threeDaysFromNow;
  });

  const activeServicesCount = projects.reduce((acc, p) => {
    const srvs = getProjectServices(p);
    return acc + srvs.filter((s) => !!s.runningProcess).length;
  }, 0);

  const recentProject = [...projects].sort((a, b) => {
    const timeA = new Date(a.lastOpenedAt || a.createdAt).getTime();
    const timeB = new Date(b.lastOpenedAt || b.createdAt).getTime();
    return timeB - timeA;
  })[0];

  return (
    <section className="mb-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-color)] gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] inline-flex items-center">
            <span>{greetingPrefix},&nbsp;</span>
            <span className="font-bold underline decoration-[var(--border-hover)] underline-offset-4">
              {displayedName}
            </span>
            {animateName && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--accent-btn-bg)] animate-pulse rounded-xs" />
            )}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)] flex items-center gap-2">
            <span>{phDate}</span>
            <span className="text-[var(--border-hover)]">|</span>
            <span className="text-[var(--text-primary)] font-semibold tracking-wider">{phTime}</span>
          </p>
        </div>

        {/* Minimalist Stats Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-semibold">
              {projects.length}
            </span>
            <span>repos</span>
          </div>

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span
              className={`font-semibold ${
                urgentProjects.length > 0 ? 'text-rose-500' : 'text-[var(--text-primary)]'
              }`}
            >
              {urgentProjects.length}
            </span>
            <span>due soon</span>
          </div>

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span
              className={`font-semibold ${
                activeServicesCount > 0
                  ? 'text-emerald-500'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {activeServicesCount}
            </span>
            <span>{activeServicesCount === 1 ? 'active service' : 'active services'}</span>
          </div>
        </div>
      </div>

      {/* Quick Resume Card */}
      {recentProject && (
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <CategoryBadge category={recentProject.category} size="sm" />
              <PriorityBadge priority={recentProject.priority} size="sm" />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                • Last opened session
              </span>
            </div>
            <h3
              onClick={() => onSelectProject(recentProject)}
              className="text-base font-semibold text-[var(--text-primary)] hover:underline cursor-pointer"
            >
              {recentProject.name}
            </h3>
            {recentProject.gitStatus && (
              <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  <GitBranch size={12} />
                  <span>{recentProject.gitStatus.branch}</span>
                </span>
                <span className="truncate max-w-sm text-[var(--text-tertiary)]">
                  "{recentProject.gitStatus.lastCommitMessage}"
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectProject(recentProject)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-mono font-medium hover:border-[var(--border-hover)] cursor-pointer"
            >
              <span>Control Panel</span>
            </button>
            <button
              onClick={() => onOpenIde(recentProject)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
            >
              <VsCodeIcon size={13} />
              <span>VS Code</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
