import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Globe,
  BookOpen,
  Cloud,
  ShieldCheck,
  User,
} from 'lucide-react';
import { openExternalUrl } from '../services/tauriBridge';

export const DeveloperTools: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const DEPLOYMENT_HANDBOOK = {
    title: 'Azure Guide & Deployment Handbook',
    author: 'ReneilRP',
    url: 'https://reneilrp.github.io/Azure-Guide/',
    description:
      'A complete step-by-step developer deployment handbook and cloud guide for Microsoft Azure services, container deployments, infrastructure setup, and production best practices.',
    tags: ['Azure Cloud', 'Deployment Guide', 'CI/CD Pipelines', 'Cloud Architecture'],
  };

  const documentationResources = [
    {
      title: 'React',
      desc: 'The official library for web and native user interfaces, component architecture, and hooks.',
      url: 'https://react.dev',
      category: 'Frontend',
    },
    {
      title: 'JavaScript (MDN)',
      desc: 'Comprehensive web documentation, JavaScript language reference, Web APIs, and modern ES specs.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      category: 'Language',
    },
    {
      title: 'Tailwind CSS',
      desc: 'Utility-first CSS framework for rapid modern UI development with design tokens and styling primitives.',
      url: 'https://tailwindcss.com/docs',
      category: 'Styling',
    },
    {
      title: 'Vite',
      desc: 'Next-generation frontend tooling with instant dev server startup and lightning-fast HMR.',
      url: 'https://vite.dev',
      category: 'Bundler',
    },
    {
      title: 'NestJS',
      desc: 'Progressive Node.js framework for building efficient, reliable, and scalable enterprise server applications.',
      url: 'https://nestjs.com',
      category: 'Backend',
    },
    {
      title: 'TypeScript',
      desc: 'Typed superset of JavaScript that compiles to clean JavaScript with static type checking.',
      url: 'https://www.typescriptlang.org/docs/',
      category: 'Language',
    },
    {
      title: 'Node.js',
      desc: 'Asynchronous event-driven JavaScript runtime environment for building scalable backend network tools.',
      url: 'https://nodejs.org/docs/',
      category: 'Runtime',
    },
    {
      title: 'Next.js',
      desc: 'The React framework for the web with hybrid static & server rendering, file-based routing, and API routes.',
      url: 'https://nextjs.org/docs',
      category: 'Fullstack',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section 1: Deployment Handbook (Featured Guide by ReneilRP) */}
      <section>
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Cloud size={14} className="text-[var(--text-secondary)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Deployment Handbook
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>Curated by</span>
            <button
              onClick={() => openExternalUrl('https://github.com/Reneilrp')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
              title="View Reneilrp's GitHub profile"
            >
              <span className="font-semibold">Reneilrp</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>

        <div className="monochrome-card rounded-xl p-5 sm:p-6 border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  <span>Deployment Handbook</span>
                </span>
                <a
                  href="https://github.com/Reneilrp"
                  onClick={(e) => {
                    e.preventDefault();
                    openExternalUrl('https://github.com/Reneilrp');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/50 bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-mono font-bold shadow-xs hover:bg-sky-500/25 hover:border-sky-500 transition-all cursor-pointer group"
                  title="Visit Reneilrp on GitHub (Creator of Handbook)"
                >
                  <User size={13} className="text-sky-500 shrink-0" />
                  <span>
                    Created by{' '}
                    <span className="text-[var(--text-primary)] font-extrabold underline decoration-sky-500/60 group-hover:decoration-sky-400 underline-offset-2">
                      Reneilrp
                    </span>
                  </span>
                  <ExternalLink size={11} className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] font-mono">
                  {DEPLOYMENT_HANDBOOK.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans mt-1.5 leading-relaxed">
                  {DEPLOYMENT_HANDBOOK.description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {DEPLOYMENT_HANDBOOK.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs hover:border-[var(--border-hover)] transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions: One-Click Launch and Copy */}
            <div className="flex flex-row md:flex-col gap-2 shrink-0 self-start md:self-center">
              <button
                onClick={() => openExternalUrl(DEPLOYMENT_HANDBOOK.url)}
                className="monochrome-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                title="Open handbook in default browser"
              >
                <span>Open Handbook</span>
                <ExternalLink size={13} />
              </button>

              <button
                onClick={() => handleCopy(DEPLOYMENT_HANDBOOK.url, 'handbook-link')}
                className="monochrome-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer"
                title="Copy handbook URL"
              >
                {copiedKey === 'handbook-link' ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span>Copied URL</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => openExternalUrl('https://github.com/Reneilrp')}
                className="monochrome-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer"
                title="View Reneilrp's GitHub profile"
              >
                <User size={12} />
                <span>@Reneilrp</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>

          {/* Bottom URL preview bar */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-mono text-[var(--text-tertiary)] flex-wrap gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <Globe size={11} className="text-[var(--text-tertiary)] shrink-0" />
              <span className="truncate text-[11px] text-[var(--text-secondary)]">
                {DEPLOYMENT_HANDBOOK.url}
              </span>
            </div>
            <button
              onClick={() => openExternalUrl('https://github.com/Reneilrp')}
              className="hover:text-[var(--text-primary)] hover:underline inline-flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
              title="Visit Reneilrp on GitHub"
            >
              <User size={11} />
              <span>Creator: github.com/Reneilrp</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Recommended Developer Resources & Documentation */}
      <section>
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--text-secondary)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Recommended Developer Resources & Documentation
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Standard tools & frameworks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {documentationResources.map((res) => (
            <a
              key={res.title}
              href={res.url}
              onClick={(e) => {
                e.preventDefault();
                openExternalUrl(res.url);
              }}
              className="monochrome-card group rounded-xl p-4 flex flex-col justify-between hover:border-[var(--border-hover)] cursor-pointer"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{res.category}</span>
                </span>
                <h3 className="text-xs font-semibold text-[var(--text-primary)] mt-2 group-hover:underline underline-offset-4">
                  {res.title}
                </h3>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {res.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
                <span>View docs</span>
                <ExternalLink size={12} />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
