import React, { useState } from 'react';
import { ArtifactVersion } from '../../types';
import {
  History,
  RotateCcw,
  Check,
  X,
  Eye,
  Calendar,
  User as UserIcon,
  Bot,
  Clock,
  Sparkles,
  FileText,
  ArrowRight,
  GitCommit,
  Plus,
} from 'lucide-react';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  versions: ArtifactVersion[];
  currentVersionNumber: number;
  documentTitle: string;
  onRestoreVersion: (version: ArtifactVersion) => void;
  onCreateCheckpoint?: (summary: string) => void;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  isOpen,
  versions,
  currentVersionNumber,
  documentTitle,
  onRestoreVersion,
  onCreateCheckpoint,
  onClose,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [showCheckpointInput, setShowCheckpointInput] = useState(false);
  const [restoredSuccessId, setRestoredSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sort versions newest first
  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);
  const activeVersion = sortedVersions.find((v) => v.id === selectedVersionId) || sortedVersions[0];
  const currentVersion = sortedVersions.find((v) => v.versionNumber === currentVersionNumber) || sortedVersions[0];

  const handleRestore = (v: ArtifactVersion) => {
    onRestoreVersion(v);
    setRestoredSuccessId(v.id);
    setTimeout(() => setRestoredSuccessId(null), 2500);
  };

  const handleAddCheckpoint = () => {
    if (!checkpointLabel.trim()) return;
    onCreateCheckpoint?.(checkpointLabel.trim());
    setCheckpointLabel('');
    setShowCheckpointInput(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-slate-950 border-l border-cyan-500/30 shadow-2xl shadow-cyan-950/50 flex flex-col animate-in slide-in-from-right duration-250 text-slate-100">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Version History
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                {versions.length} {versions.length === 1 ? 'version' : 'versions'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
              {documentTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCheckpointInput(!showCheckpointInput)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Name a checkpoint milestone"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] hidden sm:inline">Checkpoint</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Checkpoint Creator */}
      {showCheckpointInput && (
        <div className="p-3 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center gap-2 animate-in fade-in">
          <input
            type="text"
            placeholder="Label this version (e.g. Final Executive Review)..."
            value={checkpointLabel}
            onChange={(e) => setCheckpointLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCheckpoint()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleAddCheckpoint}
            disabled={!checkpointLabel.trim()}
            className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer hover:bg-cyan-400 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      {/* Main Content: Split List and Snapshot Preview */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Version List Sidebar */}
        <div className="w-full md:w-56 border-r border-slate-800/80 overflow-y-auto p-3 space-y-2.5 custom-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block px-1">
            Revisions Timeline:
          </span>

          {sortedVersions.map((v) => {
            const isCurrent = v.versionNumber === currentVersionNumber;
            const isSelected = activeVersion?.id === v.id;

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVersionId(v.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-mono">
                      v{v.versionNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-snug font-sans">
                  {v.summary}
                </p>

                <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    {v.author.role === 'agent' || v.author.role === 'workflow' ? (
                      <Bot className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <UserIcon className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className="truncate max-w-[80px]">{v.author.name}</span>
                  </span>
                  <span>{v.wordCount} words</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Version Snapshot Inspector */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden min-w-0">
          {activeVersion && (
            <>
              {/* Snapshot Inspector Header */}
              <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 font-mono">
                      Snapshot v{activeVersion.versionNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(activeVersion.timestamp).toLocaleDateString()} {new Date(activeVersion.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {activeVersion.summary}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeVersion.versionNumber !== currentVersionNumber && (
                    <button
                      onClick={() => handleRestore(activeVersion)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                    >
                      {restoredSuccessId === activeVersion.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-950" />
                          <span>Restored!</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Version Content Preview */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/70 select-text">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {activeVersion.content}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Automatic versioning enabled on every save
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white cursor-pointer"
        >
          Close History
        </button>
      </div>
    </div>
  );
};
