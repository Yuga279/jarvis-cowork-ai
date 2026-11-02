import React, { useState, useEffect } from 'react';
import { Artifact, Dataset, UserProfile, ArtifactVersion } from '../../types';
import { DataVisualizer } from './DataVisualizer';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { MarkdownRichEditor } from './MarkdownRichEditor';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { DataImporterModal } from './DataImporterModal';
import {
  BarChart3,
  Table as TableIcon,
  FileText,
  Sparkles,
  Plus,
  Copy,
  Download,
  Check,
  BrainCircuit,
  Loader2,
  RefreshCw,
  History,
} from 'lucide-react';

interface CanvasWorkspaceProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  currentUser?: UserProfile | null;
  onSelectArtifact: (id: string) => void;
  onSaveToDrive?: (artifact: Artifact) => void;
  onExportToGoogleSheets?: (dataset: Dataset) => void;
  onUpdateArtifact?: (id: string, newContent: string, newVersion?: ArtifactVersion) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  artifacts,
  activeArtifactId,
  currentUser,
  onSelectArtifact,
  onSaveToDrive,
  onExportToGoogleSheets,
  onUpdateArtifact,
}) => {
  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0];

  // Active Canvas View Mode
  const [viewMode, setViewMode] = useState<'analytics' | 'spreadsheet' | 'document'>('document');
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive version history for current artifact
  const artifactVersions: ArtifactVersion[] = activeArtifact?.versions && activeArtifact.versions.length > 0
    ? activeArtifact.versions
    : activeArtifact
    ? [
        {
          id: `v1_${activeArtifact.id}`,
          artifactId: activeArtifact.id,
          versionNumber: 1,
          content: activeArtifact.content,
          timestamp: activeArtifact.createdAt || Date.now(),
          author: {
            name: 'Jarvis Cowork',
            role: 'agent',
            color: '#06b6d4',
          },
          summary: 'Initial automated synthesis by Jarvis Cowork',
          wordCount: activeArtifact.content.trim() ? activeArtifact.content.trim().split(/\s+/).length : 0,
        },
      ]
    : [];

  const currentVersionNum =
    activeArtifact?.currentVersionNumber ||
    (artifactVersions.length > 0 ? artifactVersions[0].versionNumber : 1);

  // Save new version handler
  const handleSaveDocument = (newContent: string, summary = 'Manual edit in rich text editor') => {
    if (!activeArtifact) return;
    const nextVersionNum = currentVersionNum + 1;
    const newVersion: ArtifactVersion = {
      id: `v${nextVersionNum}_${Date.now()}`,
      artifactId: activeArtifact.id,
      versionNumber: nextVersionNum,
      content: newContent,
      timestamp: Date.now(),
      author: {
        name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'You'),
        role: 'user',
        color: '#10b981',
      },
      summary,
      wordCount: newContent.trim() ? newContent.trim().split(/\s+/).length : 0,
    };

    onUpdateArtifact?.(activeArtifact.id, newContent, newVersion);
  };

  // Restore previous version handler
  const handleRestoreVersion = (version: ArtifactVersion) => {
    if (!activeArtifact) return;
    const nextVersionNum = currentVersionNum + 1;
    const restoreVersionSnapshot: ArtifactVersion = {
      id: `v${nextVersionNum}_${Date.now()}`,
      artifactId: activeArtifact.id,
      versionNumber: nextVersionNum,
      content: version.content,
      timestamp: Date.now(),
      author: {
        name: currentUser?.displayName || 'You',
        role: 'user',
        color: '#06b6d4',
      },
      summary: `Restored from revision v${version.versionNumber} (${version.summary})`,
      wordCount: version.wordCount,
    };

    onUpdateArtifact?.(activeArtifact.id, version.content, restoreVersionSnapshot);
  };

  // Create explicit checkpoint milestone
  const handleCreateCheckpoint = (label: string) => {
    if (!activeArtifact) return;
    handleSaveDocument(activeArtifact.content, `Checkpoint Milestone: ${label}`);
  };

  // If active artifact has a dataset, sync it
  React.useEffect(() => {
    if (activeArtifact?.dataset) {
      setActiveDataset(activeArtifact.dataset);
    }
  }, [activeArtifact]);

  // Handle "Analyze with Jarvis" AI Engine
  const handleAnalyzeDataset = async () => {
    if (!activeDataset) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: activeDataset.name,
          columns: activeDataset.columns,
          sampleRows: activeDataset.rows.slice(0, 15),
          totalRows: activeDataset.rows.length,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          const updated: Dataset = {
            ...activeDataset,
            analysis: data.analysis,
            chartConfig: {
              chartType: data.analysis.recommendedChart || 'bar',
              xAxisKey: data.analysis.categoryColumn || activeDataset.columns[0]?.key,
              dataKeys: data.analysis.valueColumns?.length
                ? data.analysis.valueColumns
                : activeDataset.columns.filter((c) => c.type === 'number').map((c) => c.key),
            },
          };
          setActiveDataset(updated);
          setViewMode('analytics');
        }
      }
    } catch (err) {
      console.error('Data analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = () => {
    if (viewMode === 'document' && activeArtifact) {
      navigator.clipboard.writeText(activeArtifact.content);
    } else if (activeDataset) {
      navigator.clipboard.writeText(JSON.stringify(activeDataset, null, 2));
    } else {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (viewMode === 'document' && activeArtifact) {
      const blob = new Blob([activeArtifact.content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeArtifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (activeDataset) {
      const blob = new Blob([JSON.stringify(activeDataset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
      {/* Canvas Top Bar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Dataset / Artifact Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {/* Current Dataset Tab */}
          {activeDataset && (
            <button
              onClick={() => setViewMode('analytics')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 whitespace-nowrap shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[160px] truncate">{activeDataset.name}</span>
            </button>
          )}

          {/* Generated Artifacts Tabs */}
          {artifacts.map((art) => {
            const isSelected = art.id === activeArtifact?.id;
            return (
              <button
                key={art.id}
                onClick={() => {
                  onSelectArtifact(art.id);
                  if (art.dataset) setActiveDataset(art.dataset);
                  setViewMode('document');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[130px] truncate">{art.title}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsImporterOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500/60 text-slate-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            title="Import or load sample datasets"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Load Data</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Analyze with Jarvis AI Button */}
          <button
            onClick={handleAnalyzeDataset}
            disabled={isAnalyzing || !activeDataset}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Analyze dataset and generate executive intelligence"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>Analyze with Jarvis</span>
          </button>

          <button
            onClick={handleCopyText}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadFile}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Version History Drawer Trigger */}
          {activeArtifact && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open artifact version history and restore revisions"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">History</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-slate-800 text-cyan-300">
                v{currentVersionNum}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas View Mode Navigation Bar */}
      <div className="h-11 px-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Analytics</span>
          </button>

          <button
            onClick={() => setViewMode('spreadsheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'spreadsheet'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Spreadsheet Grid</span>
          </button>

          <button
            onClick={() => setViewMode('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'document'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Document</span>
          </button>
        </div>

        {/* Dataset Meta Pill */}
        {activeDataset && (
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>{activeDataset.rows.length} Records</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>{activeDataset.columns.length} Variables</span>
          </div>
        )}
      </div>

      {/* Main Multi-Type Canvas Body */}
      <div className="flex-1 p-4 overflow-hidden relative">
        {/* EMPTY STATE: data views with no dataset loaded */}
        {(viewMode === 'analytics' || viewMode === 'spreadsheet') && !activeDataset && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <BarChart3 className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Data Loaded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Import a CSV or JSON file, paste data, or pick a sample dataset to chart and edit it here.
            </p>
            <button
              onClick={() => setIsImporterOpen(true)}
              className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Load Data
            </button>
          </div>
        )}

        {/* EMPTY STATE: document view with nothing to show */}
        {viewMode === 'document' && !activeArtifact && !activeDataset && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Documents Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Ask Jarvis to research or summarize something. Generated documents will open here.
            </p>
          </div>
        )}

        {/* 1. VISUAL ANALYTICS VIEW */}
        {viewMode === 'analytics' && activeDataset && (
          <div className="h-full flex flex-col gap-3">
            {/* AI Insights Card if available */}
            {activeDataset.analysis?.insights && activeDataset.analysis.insights.length > 0 && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Jarvis Autonomous Data Insights</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                  {activeDataset.analysis.insights.map((ins, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-cyan-200/90 bg-slate-950/60 p-2.5 rounded-lg border border-cyan-500/20 leading-relaxed font-sans"
                    >
                      <span className="font-bold text-cyan-400 mr-1.5">0{idx + 1}.</span>
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0">
              <DataVisualizer
                dataset={activeDataset}
                onUpdateChartConfig={(type, xKey, yKeys) => {
                  setActiveDataset((prev) =>
                    prev && {
                      ...prev,
                      chartConfig: { chartType: type, xAxisKey: xKey, dataKeys: yKeys },
                    }
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* 2. SPREADSHEET GRID VIEW */}
        {viewMode === 'spreadsheet' && activeDataset && (
          <SpreadsheetGrid
            dataset={activeDataset}
            onUpdateRows={(newRows) => {
              setActiveDataset((prev) => prev && { ...prev, rows: newRows });
            }}
            onExportToGoogleSheets={onExportToGoogleSheets}
          />
        )}

        {/* 3. EXECUTIVE DOCUMENT VIEW (Rich Text & Markdown Editor) */}
        {viewMode === 'document' && (activeArtifact || activeDataset) && (
          <MarkdownRichEditor
            initialContent={
              activeArtifact?.content ||
              (activeDataset
                ? `# ${activeDataset.name}\n\n${activeDataset.analysis?.summary || 'Executive Cowork Briefing Document.'}\n\n### Key Metrics\n${activeDataset.columns.map((c) => `- **${c.label}** (${c.type})`).join('\n')}\n\n### Sample Observations\nTotal records processed: ${activeDataset.rows.length}`
                : '')
            }
            documentTitle={activeArtifact?.title || activeDataset?.name || ''}
            onSaveContent={handleSaveDocument}
            onSaveToDrive={
              activeArtifact && onSaveToDrive ? () => onSaveToDrive(activeArtifact) : undefined
            }
            onOpenHistory={() => setIsHistoryOpen(true)}
            currentVersionNumber={currentVersionNum}
          />
        )}
      </div>

      {/* Data Importer Modal */}
      <DataImporterModal
        isOpen={isImporterOpen}
        onImportDataset={(imported) => {
          setActiveDataset(imported);
          setViewMode('analytics');
        }}
        onClose={() => setIsImporterOpen(false)}
      />

      {/* Version History Drawer Panel */}
      <VersionHistoryPanel
        isOpen={isHistoryOpen}
        versions={artifactVersions}
        currentVersionNumber={currentVersionNum}
        documentTitle={activeArtifact?.title || activeDataset?.name || ''}
        onRestoreVersion={handleRestoreVersion}
        onCreateCheckpoint={handleCreateCheckpoint}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
