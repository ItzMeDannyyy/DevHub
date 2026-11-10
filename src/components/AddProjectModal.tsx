import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Tag,
  AlertTriangle,
  Calendar,
  FileText,
  Save,
} from 'lucide-react';
import { Project, ProjectCategory, Priority } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  initialProject?: Project | null;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [category, setCategory] = useState<Exclude<ProjectCategory, 'all'>>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setPath(initialProject.path);
      setCategory(initialProject.category);
      setPriority(initialProject.priority);
      setDeadline(initialProject.deadline || '');
      setNotes(initialProject.notes || '');
    } else {
      setName('');
      setPath('');
      setCategory('work');
      setPriority('medium');
      setDeadline('');
      setNotes('');
    }
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;

    onSave({
      ...(initialProject ? { id: initialProject.id } : {}),
      name: name.trim(),
      path: path.trim(),
      category,
      priority,
      deadline: deadline || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">
            {initialProject ? 'Edit Project' : 'Register New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Client Billing Dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Folder Path (Absolute) *
            </label>
            <div className="relative">
              <Folder
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                required
                placeholder="C:\Users\...\Projects\billing"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Exclude<ProjectCategory, 'all'>)
                  }
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="work">Work</option>
                  <option value="client">Client</option>
                  <option value="personal">Personal</option>
                  <option value="open-source">Open Source</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <AlertTriangle
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Deadline (Optional)
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes & Next Steps
            </label>
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3 top-3 text-slate-500 pointer-events-none"
              />
              <textarea
                rows={2}
                placeholder="Key deliverables, reminders, or current blocker..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>{initialProject ? 'Update Project' : 'Save Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
