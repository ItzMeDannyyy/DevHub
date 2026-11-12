import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  FileText,
  FileCode2,
  FileJson,
  Palette,
  Cpu,
  Image as ImageIcon,
  File,
  Search,
  Code,
  Eye,
  WrapText,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  FolderOpen,
} from 'lucide-react';
import { FileTreeNode } from '../types';
import { readFileContent, FileContentData, openInIde, openInFileManager } from '../services/tauriBridge';

interface DocumentViewerModalProps {
  file: FileTreeNode | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (extension?: string) => {
  const ext = (extension || '').toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode2 size={16} className="text-sky-500 shrink-0" />;
    case 'rs':
      return <Cpu size={16} className="text-amber-500 shrink-0" />;
    case 'json':
    case 'toml':
    case 'yaml':
    case 'yml':
      return <FileJson size={16} className="text-emerald-500 shrink-0" />;
    case 'css':
    case 'scss':
      return <Palette size={16} className="text-violet-500 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText size={16} className="text-blue-500 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico':
    case 'webp':
      return <ImageIcon size={16} className="text-rose-500 shrink-0" />;
    default:
      return <File size={16} className="text-[var(--text-tertiary)] shrink-0" />;
  }
};

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  file,
  onClose,
  onShowToast,
}) => {
  const [data, setData] = useState<FileContentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageZoom, setImageZoom] = useState(1);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isMarkdown = file?.extension?.toLowerCase() === 'md';
  const [markdownView, setMarkdownView] = useState(isMarkdown);

  // Smooth entry and exit
  useEffect(() => {
    if (file) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [file]);

  // Load document content
  const loadContent = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const res = await readFileContent(file.path);
      setData(res);
      setMarkdownView(file.extension?.toLowerCase() === 'md');
    } catch (err) {
      console.error('Failed to load file content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      loadContent();
      setSearchQuery('');
      setImageZoom(1);
    }
  }, [file?.path]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && file) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  const handleCopyContent = () => {
    if (!data?.content) return;
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    if (onShowToast) onShowToast('File content copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyPath = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.path);
    setCopiedPath(true);
    if (onShowToast) onShowToast('File path copied');
    setTimeout(() => setCopiedPath(false), 1400);
  };

  // Split lines for line numbers
  const lines = useMemo(() => {
    if (!data?.content || data.isBinary) return [];
    return data.content.split('\n');
  }, [data?.content, data?.isBinary]);

  // Filtered search lines count
  const matchingLineCount = useMemo(() => {
    if (!searchQuery.trim() || lines.length === 0) return 0;
    const q = searchQuery.toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(q)).length;
  }, [lines, searchQuery]);

  if (!isRendered || !file) return null;

  const isImage =
    data?.isBinary && data.content.startsWith('data:image');

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 transition-opacity duration-250 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl h-[88vh] max-h-[900px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Document Viewer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0 gap-3">
          <div className="flex items-center gap-3 truncate min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
              {getFileIcon(file.extension)}
            </div>

            <div className="truncate min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-semibold text-[var(--text-primary)] truncate">
                  {file.name}
                </h2>
                {file.size !== undefined && (
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                )}
                {lines.length > 0 && !data?.isBinary && (
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] hidden sm:inline">
                    {lines.length} lines
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-tertiary)] truncate mt-0.5">
                <span className="truncate">{file.path}</span>
                <button
                  onClick={handleCopyPath}
                  className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                  title="Copy absolute path"
                >
                  {copiedPath ? (
                    <Check size={11} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Filter input */}
            {!data?.isBinary && lines.length > 0 && (
              <div className="relative hidden md:block w-44">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Find in file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="monochrome-input w-full pl-7 pr-6 py-1 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Markdown View Toggle */}
            {isMarkdown && (
              <button
                onClick={() => setMarkdownView((v) => !v)}
                className={`monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                  markdownView
                    ? 'border-[var(--text-primary)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-medium'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Toggle rendered markdown vs code view"
              >
                {markdownView ? <Code size={12} /> : <Eye size={12} />}
                <span>{markdownView ? 'Raw Code' : 'Preview'}</span>
              </button>
            )}

            {/* Word wrap toggle */}
            {!data?.isBinary && !markdownView && (
              <button
                onClick={() => setWrapLines((w) => !w)}
                className={`p-1.5 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
                  wrapLines
                    ? 'border-[var(--border-focus)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title="Toggle line wrapping"
              >
                <WrapText size={13} />
              </button>
            )}

            {/* Copy Content Button */}
            {!data?.isBinary && (
              <button
                onClick={handleCopyContent}
                className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer"
                title="Copy all file content"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} />
                )}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Open in Editor */}
            <button
              onClick={() => openInIde(file.path)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
              title="Open in VS Code"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">VS Code</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
              title="Close viewer (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Document Body Area */}
        <div className="flex-1 overflow-auto bg-[var(--bg-canvas)] relative">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw size={22} className="animate-spin text-[var(--text-secondary)] mb-2.5" />
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                Reading file contents...
              </span>
            </div>
          ) : isImage ? (
            /* Image Preview */
            <div className="h-full flex flex-col items-center justify-center p-8 overflow-auto">
              <div
                style={{
                  transform: `scale(${imageZoom})`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={data.content}
                  alt={file.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg"
                />
              </div>

              {/* Image zoom strip */}
              <div className="fixed bottom-14 flex items-center gap-2 p-1.5 px-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl font-mono text-xs">
                <button
                  onClick={() => setImageZoom((z) => Math.max(0.2, z - 0.2))}
                  className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[11px] w-12 text-center text-[var(--text-tertiary)]">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={() => setImageZoom((z) => Math.min(3, z + 0.2))}
                  className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() => setImageZoom(1)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : data?.isBinary ? (
            /* Binary File Message */
            <div className="h-full flex flex-col items-center justify-center p-12 text-center font-mono">
              <File size={28} className="text-[var(--text-tertiary)] mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Binary File Preview Unavailable
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1.5 max-w-md">
                This file format cannot be rendered in plain text. Use external tooling to inspect binary assets.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => openInIde(file.path)}
                  className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>Open in VS Code</span>
                </button>
                <button
                  onClick={() => openInFileManager(file.path)}
                  className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs font-mono hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <FolderOpen size={12} />
                  <span>Show in Explorer</span>
                </button>
              </div>
            </div>
          ) : markdownView && isMarkdown ? (
            /* Rendered Markdown Preview */
            <div className="p-8 max-w-3xl mx-auto space-y-4 text-xs font-mono text-[var(--text-primary)] leading-relaxed select-text">
              <div className="pb-3 border-b border-[var(--border-color)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)] tracking-wider">
                  Markdown Preview
                </span>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
                  {file.name}
                </h1>
              </div>

              {/* Simple rendered paragraphs & blocks */}
              <div className="space-y-3 font-sans text-sm">
                {lines.map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={idx} className="text-lg font-bold border-b border-[var(--border-color)] pb-1 mt-4">
                        {line.slice(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-base font-semibold mt-3">
                        {line.slice(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-sm font-semibold mt-2">
                        {line.slice(4)}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <li key={idx} className="ml-5 list-disc text-xs text-[var(--text-secondary)]">
                        {line.slice(2)}
                      </li>
                    );
                  }
                  if (line.startsWith('```')) {
                    return (
                      <div key={idx} className="py-0.5 text-[11px] font-mono text-[var(--text-tertiary)]">
                        {line}
                      </div>
                    );
                  }
                  if (!line.trim()) {
                    return <div key={idx} className="h-2" />;
                  }
                  return (
                    <p key={idx} className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Code / Text Viewer with Line Numbers */
            <div className="flex font-mono text-xs select-text min-h-full">
              {/* Line Numbers Gutter */}
              <div className="py-4 pl-3 pr-3 text-right bg-[var(--bg-subtle)] border-r border-[var(--border-color)] select-none text-[var(--text-tertiary)] text-[11px] leading-5 shrink-0">
                {lines.map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>

              {/* Code Content */}
              <div
                className={`py-4 px-4 flex-1 text-[var(--text-primary)] text-[12px] leading-5 font-mono ${
                  wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                }`}
              >
                {lines.map((line, idx) => {
                  const hasMatch =
                    searchQuery.trim() &&
                    line.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className={
                        hasMatch
                          ? 'bg-amber-400/20 text-[var(--text-primary)] rounded-xs px-1 -mx-1'
                          : ''
                      }
                    >
                      {line || '\n'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Document Status Bar Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-[11px] text-[var(--text-secondary)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{file.extension ? `${file.extension.toUpperCase()} File` : 'Document'}</span>
            </span>
            <span className="text-[var(--border-hover)]">|</span>
            <span>Encoding: UTF-8</span>
            {searchQuery && (
              <>
                <span className="text-[var(--border-hover)]">|</span>
                <span className="text-amber-500">
                  {matchingLineCount} matching {matchingLineCount === 1 ? 'line' : 'lines'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[var(--text-tertiary)]">Double-click file to open</span>
            <button
              onClick={onClose}
              className="hover:text-[var(--text-primary)] cursor-pointer underline underline-offset-2"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};