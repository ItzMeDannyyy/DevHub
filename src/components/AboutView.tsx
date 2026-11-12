import React from 'react';
import {
  FolderGit2,
  Terminal,
  Zap,
  Keyboard,
  ExternalLink,
  Cpu,
  User,
  FolderTree,
  Heart,
  Sparkles,
} from 'lucide-react';
import { Project, getProjectServices } from '../types';
import { openExternalUrl } from '../services/tauriBridge';

interface AboutViewProps {
  projects: Project[];
}

export const AboutView: React.FC<AboutViewProps> = ({ projects }) => {
  const activeProcesses = projects.reduce((acc, p) => {
    const srvs = getProjectServices(p);
    return acc + srvs.filter((s) => !!s.runningProcess).length;
  }, 0);

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Quickly search and jump to any repository' },
    { key: 'Esc', desc: 'Close open dialogs or clear active search' },
    { key: 'Enter', desc: 'Confirm selections or open the active project' },
  ];

  const stack = [
    {
      name: 'Tauri v2',
      role: 'Fast Desktop App',
      desc: 'Super lightweight native shell that keeps your computer running fast.',
    },
    {
      name: 'React 19 & TypeScript',
      role: 'Smooth UI',
      desc: 'Crisp, reliable components built for an instant and fluid experience.',
    },
    {
      name: 'Tailwind CSS v4',
      role: 'Modern Design',
      desc: 'Clean, high-contrast monochrome look that is easy on the eyes.',
    },
    {
      name: 'Lucide Icons',
      role: 'Vector Icons',
      desc: 'Simple, sharp icons designed for clarity and focus.',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Brand Hero Card */}
      <div className="monochrome-card rounded-2xl p-6 sm:p-8 relative overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--logo-bg)] text-[var(--logo-text)] flex items-center justify-center shadow-md shrink-0 transition-colors">
              <FolderGit2 size={28} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
                  Developer Hub
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold">
                  v0.1.0-alpha
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap">
                  <span>Developer Hub is created by</span>
                  <a
                    href="https://github.com/ItzMeDannyyy"
                    onClick={(e) => {
                      e.preventDefault();
                      openExternalUrl('https://github.com/ItzMeDannyyy');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold hover:underline decoration-sky-500 underline-offset-2 transition-all cursor-pointer shadow-2xs"
                    title="Visit ItzMeDannyyy on GitHub"
                  >
                    <User size={12} className="text-sky-500 shrink-0" />
                    <span>ItzMeDannyyy</span>
                    <ExternalLink size={10} className="shrink-0" />
                  </a>
                  <span>with special thanks to</span>
                  <a
                    href="https://github.com/Reneilrp"
                    onClick={(e) => {
                      e.preventDefault();
                      openExternalUrl('https://github.com/Reneilrp');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold hover:underline decoration-emerald-500 underline-offset-2 transition-all cursor-pointer shadow-2xs"
                    title="Visit Reneilrp on GitHub (Creator of Handbook)"
                  >
                    <User size={12} className="text-emerald-500 shrink-0" />
                    <span>Reneilrp</span>
                    <ExternalLink size={10} className="shrink-0" />
                  </a>
                  <span>(creator of Handbook).</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => openExternalUrl('https://github.com/ItzMeDannyyy')}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] cursor-pointer"
              title="View GitHub profile"
            >
              <User size={12} />
              <span>@ItzMeDannyyy</span>
            </button>
            <button
              onClick={() => openExternalUrl('https://github.com/ItzMeDannyyy/Development-Hub')}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
              title="View source code on GitHub"
            >
              <span>GitHub Repo</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Live Diagnostics Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="space-y-0.5 font-mono">
            <span className="text-[10px] uppercase text-[var(--text-tertiary)]">Tracked Projects</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">{projects.length}</div>
          </div>
          <div className="space-y-0.5 font-mono">
            <span className="text-[10px] uppercase text-[var(--text-tertiary)]">Running Services</span>
            <div className="text-lg font-bold text-emerald-500">{activeProcesses}</div>
          </div>
          <div className="space-y-0.5 font-mono">
            <span className="text-[10px] uppercase text-[var(--text-tertiary)]">Data Storage</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">100% On Device</div>
          </div>
          <div className="space-y-0.5 font-mono">
            <span className="text-[10px] uppercase text-[var(--text-tertiary)]">System</span>
            <div className="text-lg font-bold text-[var(--text-primary)]">Windows x64</div>
          </div>
        </div>
      </div>

      {/* Friendly Story: Why Developer Hub Exists */}
      <section className="space-y-3 w-full">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--text-secondary)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              About Developer Hub
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Built by a developer, for developers
          </span>
        </div>

        <div className="monochrome-card rounded-2xl p-6 sm:p-7 border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
          <p className="text-sm font-sans text-[var(--text-primary)] leading-relaxed">
            <strong>Developer Hub</strong> is created by{' '}
            <a
              href="https://github.com/ItzMeDannyyy"
              onClick={(e) => {
                e.preventDefault();
                openExternalUrl('https://github.com/ItzMeDannyyy');
              }}
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline underline-offset-4 inline-flex items-center gap-1 cursor-pointer"
            >
              ItzMeDannyyy
              <ExternalLink size={12} />
            </a>{' '}
            to help developers be more efficient, organized, and stress-free in their everyday work.
          </p>

          <p className="text-xs sm:text-sm font-sans text-[var(--text-secondary)] leading-relaxed">
            When building software, it's easy to lose focus juggling endless terminal windows, digging through buried folder paths across multiple drives, re-checking package scripts, or leaving forgotten background servers eating up your battery and CPU. Developer Hub brings all your codebases into one clean, friendly home where you can launch, explore, and run your projects with zero hassle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <Terminal size={14} className="text-sky-500" />
                </div>
                <span>One-Click Launch</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Open any project right in VS Code, pop open a terminal, or jump into your project folder instantly without typing paths.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <Zap size={14} className="text-emerald-500" />
                </div>
                <span>Easy Service Control</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Start your frontend and backend servers together, see which ones are running, and stop them whenever you are ready.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <FolderTree size={14} className="text-amber-500" />
                </div>
                <span>Visual Folder Explorer</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                See your project structure in a clean visual tree and preview code or image files right inside the app.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <Heart size={14} className="text-rose-500" />
                </div>
                <span>Lightweight & Private</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                No tracking, no accounts needed, and zero lag. Everything stays right on your machine so your laptop battery stays happy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Section: Keyboard Shortcuts + Under the Hood */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Left Column: Keyboard Shortcuts Matrix */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Keyboard size={14} className="text-[var(--text-secondary)]" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                Helpful Shortcuts
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Quick keyboard navigation
            </span>
          </div>

          <div className="monochrome-card rounded-xl divide-y divide-[var(--border-color)] overflow-hidden font-mono text-xs">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="flex items-center justify-between p-3.5 hover:bg-[var(--bg-subtle)] transition-colors">
                <span className="text-[var(--text-secondary)] text-[11px]">{sc.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[11px] shadow-2xs ml-3 shrink-0">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Engineering Stack */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[var(--text-secondary)]" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                Built With
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Modern desktop tech
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {stack.map((item) => (
              <div key={item.name} className="monochrome-card rounded-xl p-3.5 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)]">{item.name}</span>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">{item.role}</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-1 font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Acknowledgments & Community Credits */}
      <section className="space-y-3 w-full">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-rose-500" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Credits & Special Thanks
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Open source & inspirations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creator: Danny */}
          <div className="monochrome-card rounded-xl p-4 sm:p-5 border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold">
                  Lead Developer
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">Creator</span>
              </div>
              <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                ItzMeDannyyy (Danny)
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                Designer and lead architect of Developer Hub. Built to give developers a rapid, private command deck for their local repositories and services.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <a
                href="https://github.com/ItzMeDannyyy"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalUrl('https://github.com/ItzMeDannyyy');
                }}
                className="text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>github.com/ItzMeDannyyy</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Reneilrp: Creator of Handbook */}
          <div className="monochrome-card rounded-xl p-4 sm:p-5 border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold">
                  Special Thanks
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">Creator of Handbook</span>
              </div>
              <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                Reneilrp
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                Creator of the Handbook and Azure Deployment Guide. Special recognition for contributing essential developer tooling guides and community inspiration.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <a
                href="https://github.com/Reneilrp"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalUrl('https://github.com/Reneilrp');
                }}
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>github.com/Reneilrp</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[var(--text-tertiary)] w-full">
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="https://github.com/ItzMeDannyyy"
            onClick={(e) => {
              e.preventDefault();
              openExternalUrl('https://github.com/ItzMeDannyyy');
            }}
            className="hover:text-[var(--text-primary)] hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Created by ItzMeDannyyy</span>
            <ExternalLink size={10} />
          </a>
          <span>•</span>
          <a
            href="https://github.com/Reneilrp"
            onClick={(e) => {
              e.preventDefault();
              openExternalUrl('https://github.com/Reneilrp');
            }}
            className="hover:text-[var(--text-primary)] hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
            title="Creator of Handbook"
          >
            <span>Special thanks to Reneilrp</span>
            <ExternalLink size={10} />
          </a>
        </div>
        <span>Developer Hub • Free & Open Source</span>
      </div>
    </div>
  );
};
