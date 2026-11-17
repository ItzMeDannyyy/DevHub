import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  FolderTree,
  Folder,
  FolderOpen,
  File,
  FileCode2,
  FileText,
  FileJson,
  Palette,
  Cpu,
  Image as ImageIcon,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  RefreshCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Layers,
  Network,
  ListTree,
  Eye,
} from 'lucide-react';
import { Project, FileTreeNode } from '../types';
import { getDirectoryTree, openInIde, openInTerminal, openInFileManager } from '../services/tauriBridge';
import { CategoryBadge, PriorityBadge } from './Badges';
import { DocumentViewerModal } from './DocumentViewerModal';

interface WorkingTreeDiagramViewProps {
  project: Project;
  onBack: () => void;
  onShowToast?: (message: string) => void;
}

// Helper to format byte size nicely
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper for extension-based icons
const getFileIcon = (extension?: string, isDir = false, isOpen = false) => {
  if (isDir) {
    return isOpen ? (
      <FolderOpen size={13} className="text-[var(--text-primary)] shrink-0" />
    ) : (
      <Folder size={13} className="text-[var(--text-secondary)] shrink-0" />
    );
  }

  const ext = (extension || '').toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode2 size={13} className="text-sky-500 shrink-0" />;
    case 'rs':
      return <Cpu size={13} className="text-amber-500 shrink-0" />;
    case 'json':
    case 'toml':
    case 'yaml':
    case 'yml':
      return <FileJson size={13} className="text-emerald-500 shrink-0" />;
    case 'css':
    case 'scss':
    case 'less':
      return <Palette size={13} className="text-violet-500 shrink-0" />;
    case 'md':
    case 'txt':
    case 'doc':
      return <FileText size={13} className="text-blue-500 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico':
    case 'webp':
      return <ImageIcon size={13} className="text-rose-500 shrink-0" />;
    default:
      return <File size={13} className="text-[var(--text-tertiary)] shrink-0" />;
  }
};

export const WorkingTreeDiagramView: React.FC<WorkingTreeDiagramViewProps> = ({
  project,
  onBack,
  onShowToast,
}) => {
  const [treeData, setTreeData] = useState<FileTreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'diagram' | 'outline'>('diagram');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const [viewingFile, setViewingFile] = useState<FileTreeNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedPath, setCopiedPath] = useState(false);

  // Load tree from Tauri or fallback
  const fetchTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDirectoryTree(project.path, 5);
      setTreeData(data);
      if (data) {
        // Expand root and 1st level children by default
        const initialExpanded = new Set<string>();
        initialExpanded.add(data.id);
        if (data.children) {
          data.children.forEach((child) => {
            if (child.isDir) {
              initialExpanded.add(child.id);
            }
          });
        }
        setExpandedNodes(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load tree:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project.path]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Compute statistics
  const stats = useMemo(() => {
    let folderCount = 0;
    let fileCount = 0;
    let totalBytes = 0;
    let maxDepth = 0;

    const traverse = (node: FileTreeNode, depth = 1) => {
      if (depth > maxDepth) maxDepth = depth;
      if (node.isDir) {
        folderCount++;
        if (node.children) {
          node.children.forEach((child) => traverse(child, depth + 1));
        }
      } else {
        fileCount++;
        totalBytes += node.size || 0;
      }
    };

    if (treeData) {
      traverse(treeData);
    }

    return {
      folderCount,
      fileCount,
      totalBytes,
      maxDepth,
    };
  }, [treeData]);

  // Handle Search Filtering & auto-expansion of matches
  const isMatch = useCallback(
    (node: FileTreeNode, query: string): boolean => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      if (node.name.toLowerCase().includes(q)) return true;
      if (node.extension && node.extension.toLowerCase().includes(q)) return true;
      if (node.children) {
        return node.children.some((child) => isMatch(child, query));
      }
      return false;
    },
    []
  );

  // Auto-expand paths matching search query
  useEffect(() => {
    if (!searchQuery.trim() || !treeData) return;

    const matchedIds = new Set<string>();
    const expandMatchingBranches = (node: FileTreeNode): boolean => {
      let branchHasMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (node.children) {
        for (const child of node.children) {
          if (expandMatchingBranches(child)) {
            branchHasMatch = true;
          }
        }
      }

      if (branchHasMatch && node.isDir) {
        matchedIds.add(node.id);
      }
      return branchHasMatch;
    };

    expandMatchingBranches(treeData);
    setExpandedNodes((prev) => new Set([...prev, ...matchedIds]));
  }, [searchQuery, treeData]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (!treeData) return;
    const all = new Set<string>();
    const collectAllDirIds = (node: FileTreeNode) => {
      if (node.isDir) {
        all.add(node.id);
        if (node.children) {
          node.children.forEach(collectAllDirIds);
        }
      }
    };
    collectAllDirIds(treeData);
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    if (!treeData) return;
    setExpandedNodes(new Set([treeData.id]));
  };

  const handleCopyPath = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(true);
    if (onShowToast) onShowToast('Path copied to clipboard');
    setTimeout(() => setCopiedPath(false), 1400);
  };

  return (
    <div className="w-full animate-fade-in flex flex-col space-y-4">
      {/* Top Back Navigation (Placed above the repository container) */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="monochrome-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono font-medium transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft size={13} />
          <span>Back to Repositories</span>
        </button>
      </div>

      {/* Repository Card Container */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-6 h-6 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
              <FolderTree size={13} />
            </span>
            <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)] font-sans">
              {project.name}
            </h1>
            <CategoryBadge category={project.category} size="sm" />
            <PriorityBadge priority={project.priority} size="sm" />
          </div>

          {/* Quick IDE & Terminal Launchers */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => openInIde(project.path)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
              title="Launch editor"
            >
              <ExternalLink size={12} />
              <span>Open in VS Code</span>
            </button>
            <button
              onClick={() => openInTerminal(project.path)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer"
              title="Open Terminal"
            >
              <Terminal size={12} />
            </button>
            <button
              onClick={() => openInFileManager(project.path)}
              className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer"
              title="Open Explorer"
            >
              <FolderOpen size={12} />
            </button>
            <button
              onClick={fetchTree}
              disabled={isLoading}
              className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer disabled:opacity-40"
              title="Re-scan directory tree"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Path & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)] gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[var(--text-tertiary)] select-none">Path:</span>
            <span className="text-[var(--text-primary)] truncate font-mono text-[11px]">
              {project.path}
            </span>
            <button
              onClick={() => handleCopyPath(project.path)}
              className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
              title="Copy path"
            >
              {copiedPath ? (
                <Check size={12} className="text-emerald-500" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3.5 text-[11px] font-mono shrink-0">
            <span className="inline-flex items-center gap-1">
              <Folder size={11} className="text-[var(--text-tertiary)]" />
              <strong className="text-[var(--text-primary)]">{stats.folderCount}</strong> folders
            </span>
            <span className="inline-flex items-center gap-1">
              <FileCode2 size={11} className="text-[var(--text-tertiary)]" />
              <strong className="text-[var(--text-primary)]">{stats.fileCount}</strong> files
            </span>
            {stats.totalBytes > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="text-[var(--text-tertiary)]">Size:</span>
                <strong className="text-[var(--text-primary)]">{formatFileSize(stats.totalBytes)}</strong>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Layers size={11} className="text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-tertiary)]">Depth:</span>
              <strong className="text-[var(--text-primary)]">{stats.maxDepth}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        {/* Search / Filter Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Filter files or folders (e.g. .tsx, config, route)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="monochrome-input w-full pl-8.5 pr-8 py-1.5 rounded-lg text-xs font-mono placeholder-[var(--text-tertiary)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* View Switcher & Expansion Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Diagram vs Outline */}
          <div className="p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center">
            <button
              onClick={() => setViewMode('diagram')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                viewMode === 'diagram'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-2xs border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Network size={12} />
              <span>Diagram Tree</span>
            </button>
            <button
              onClick={() => setViewMode('outline')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                viewMode === 'outline'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium shadow-2xs border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListTree size={12} />
              <span>Outline</span>
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block" />

          {/* Expand / Collapse All */}
          <button
            onClick={handleExpandAll}
            className="monochrome-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
            title="Expand all folder nodes"
          >
            <Maximize2 size={11} />
            <span>Expand All</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="monochrome-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
            title="Collapse all folder nodes"
          >
            <Minimize2 size={11} />
            <span>Collapse</span>
          </button>

          {/* Zoom controls for diagram */}
          {viewMode === 'diagram' && (
            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut size={12} />
              </button>
              <span className="text-[10px] font-mono w-10 text-center text-[var(--text-tertiary)]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] min-h-[520px] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-[var(--text-secondary)] mb-3" />
            <h3 className="text-sm font-mono font-semibold text-[var(--text-primary)]">
              Generating Working Tree Diagram...
            </h3>
            <p className="text-xs font-mono text-[var(--text-tertiary)] mt-1 max-w-sm">
              Inspecting filesystem hierarchy and constructing node relationships.
            </p>
          </div>
        ) : !treeData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <FolderTree size={24} className="text-[var(--text-tertiary)] mb-3" />
            <h3 className="text-sm font-mono font-semibold text-[var(--text-primary)]">
              Unable to read directory tree
            </h3>
            <p className="text-xs font-mono text-[var(--text-tertiary)] mt-1 mb-4 max-w-sm">
              Ensure the directory path exists on disk and is accessible.
            </p>
            <button
              onClick={fetchTree}
              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry Scan</span>
            </button>
          </div>
        ) : viewMode === 'diagram' ? (
          /* Visual Node Diagram (Horizontal / Multi-level branching graph) */
          <div className="flex-1 overflow-auto p-8 select-none">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                transition: 'transform 0.15s ease-out',
              }}
              className="inline-block min-w-full"
            >
              <DiagramTreeNode
                node={treeData}
                expandedNodes={expandedNodes}
                onToggleExpand={toggleExpand}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onOpenFile={(n) => setViewingFile(n)}
                searchQuery={searchQuery}
                isMatch={isMatch}
                isRoot={true}
              />
            </div>
          </div>
        ) : (
          /* Outline Explorer Tree View */
          <div className="flex-1 overflow-auto p-4 font-mono text-xs select-none">
            <OutlineTreeNode
              node={treeData}
              depth={0}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleExpand}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onOpenFile={(n) => setViewingFile(n)}
              searchQuery={searchQuery}
              isMatch={isMatch}
            />
          </div>
        )}

        {/* Selected Node Details Floating Inspector Card */}
        {selectedNode && (
          <div className="border-t border-[var(--border-color)] bg-[var(--bg-subtle)] p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in text-xs font-mono">
            <div className="flex items-center gap-2.5 truncate">
              {getFileIcon(selectedNode.extension, selectedNode.isDir, true)}
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)] truncate">
                    {selectedNode.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[10px] text-[var(--text-tertiary)]">
                    {selectedNode.isDir ? 'Folder' : selectedNode.extension ? `.${selectedNode.extension}` : 'File'}
                  </span>
                  {selectedNode.size !== undefined && (
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {formatFileSize(selectedNode.size)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                  {selectedNode.path}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {!selectedNode.isDir && (
                <button
                  onClick={() => setViewingFile(selectedNode)}
                  className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
                  title="View document content (or double-click node)"
                >
                  <Eye size={12} />
                  <span>View Document</span>
                </button>
              )}
              <button
                onClick={() => handleCopyPath(selectedNode.path)}
                className="monochrome-btn inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
              >
                <Copy size={11} />
                <span>Copy Path</span>
              </button>
              <button
                onClick={() => openInIde(selectedNode.path)}
                className="monochrome-btn inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
              >
                <ExternalLink size={11} />
                <span>Open in Editor</span>
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal (Opens on Double-Click or View Document Button) */}
      <DocumentViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};

// ==========================================
// 1. DIAGRAM TREE NODE COMPONENT (Visual Graph)
// ==========================================
interface DiagramTreeNodeProps {
  node: FileTreeNode;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  selectedNode: FileTreeNode | null;
  onSelectNode: (node: FileTreeNode) => void;
  onOpenFile: (node: FileTreeNode) => void;
  searchQuery: string;
  isMatch: (node: FileTreeNode, q: string) => boolean;
  isRoot?: boolean;
}

const DiagramTreeNode: React.FC<DiagramTreeNodeProps> = ({
  node,
  expandedNodes,
  onToggleExpand,
  selectedNode,
  onSelectNode,
  onOpenFile,
  searchQuery,
  isMatch,
  isRoot = false,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode?.id === node.id;
  const matchesSearch = !searchQuery || isMatch(node, searchQuery);

  if (!matchesSearch) return null;

  const childrenCount = node.children ? node.children.length : 0;

  return (
    <div className="flex items-start">
      {/* Node Card / Pill */}
      <div className="flex flex-col items-start relative shrink-0">
        <div
          onClick={() => {
            onSelectNode(node);
            if (node.isDir) {
              onToggleExpand(node.id);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!node.isDir) {
              onOpenFile(node);
            }
          }}
          title={
            node.isDir
              ? `${node.name} (Folder - Click to expand)`
              : `${node.name} (Double-click to view document)`
          }
          className={`group/node flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer font-mono shadow-xs ${
            isSelected
              ? 'border-[var(--text-primary)] bg-[var(--bg-subtle)] ring-1 ring-[var(--text-primary)]'
              : node.isDir
              ? 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]'
              : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-canvas)]'
          } ${isRoot ? 'ring-2 ring-[var(--border-hover)] py-2.5 px-3.5' : ''}`}
        >
          {/* Node Icon */}
          <div className="shrink-0 flex items-center">
            {getFileIcon(node.extension, node.isDir, isExpanded)}
          </div>

          {/* Node Label */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs ${
                node.isDir
                  ? 'font-bold text-[var(--text-primary)]'
                  : 'font-medium text-[var(--text-secondary)]'
              }`}
            >
              {node.name}
            </span>

            {/* Subdirectory badge or File Size badge */}
            {node.isDir && childrenCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[10px] text-[var(--text-tertiary)] font-mono">
                {childrenCount}
              </span>
            )}
            {!node.isDir && node.size !== undefined && (
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                {formatFileSize(node.size)}
              </span>
            )}
          </div>

          {/* Expand/Collapse Chevron for directories */}
          {node.isDir && childrenCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 rounded hover:bg-[var(--bg-canvas)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-1 cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Children branches connecting with SVG orthogonal lines */}
      {node.isDir && isExpanded && node.children && node.children.length > 0 && (
        <div className="flex flex-col relative pl-8 ml-3 space-y-2.5 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-color)]">
          {node.children.map((child) => (
            <div key={child.id} className="relative flex items-center">
              {/* Connecting horizontal branch line */}
              <div className="absolute -left-8 top-1/2 w-8 h-px bg-[var(--border-color)]" />

              <DiagramTreeNode
                node={child}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                selectedNode={selectedNode}
                onSelectNode={onSelectNode}
                onOpenFile={onOpenFile}
                searchQuery={searchQuery}
                isMatch={isMatch}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. OUTLINE TREE NODE COMPONENT (Explorer View)
// ==========================================
interface OutlineTreeNodeProps {
  node: FileTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  selectedNode: FileTreeNode | null;
  onSelectNode: (node: FileTreeNode) => void;
  onOpenFile: (node: FileTreeNode) => void;
  searchQuery: string;
  isMatch: (node: FileTreeNode, q: string) => boolean;
}

const OutlineTreeNode: React.FC<OutlineTreeNodeProps> = ({
  node,
  depth,
  expandedNodes,
  onToggleExpand,
  selectedNode,
  onSelectNode,
  onOpenFile,
  searchQuery,
  isMatch,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode?.id === node.id;
  const matchesSearch = !searchQuery || isMatch(node, searchQuery);

  if (!matchesSearch) return null;

  return (
    <div>
      <div
        onClick={() => {
          onSelectNode(node);
          if (node.isDir) onToggleExpand(node.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!node.isDir) {
            onOpenFile(node);
          }
        }}
        title={
          node.isDir
            ? `${node.name} (Folder)`
            : `${node.name} (Double-click to view document)`
        }
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        className={`group flex items-center justify-between py-1.5 pr-3 rounded-md transition-colors cursor-pointer ${
          isSelected
            ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {node.isDir ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {getFileIcon(node.extension, node.isDir, isExpanded)}

          <span className="truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] shrink-0 font-mono">
          {!node.isDir && node.size !== undefined && (
            <span>{formatFileSize(node.size)}</span>
          )}
          {node.isDir && node.children && (
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      {/* Render Subdirectory Children */}
      {node.isDir && isExpanded && node.children && (
        <div className="relative border-l border-[var(--border-color)] ml-4">
          {node.children.map((child) => (
            <OutlineTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              selectedNode={selectedNode}
              onSelectNode={onSelectNode}
              onOpenFile={onOpenFile}
              searchQuery={searchQuery}
              isMatch={isMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};