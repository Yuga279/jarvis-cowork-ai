import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Table as TableIcon,
  Minus,
  Eye,
  Columns2,
  Edit3,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Download,
  HardDrive,
  Copy,
  Loader2,
  Wand2,
  History,
} from 'lucide-react';

interface MarkdownRichEditorProps {
  initialContent: string;
  documentTitle: string;
  onSaveContent: (newContent: string, summary?: string) => void;
  onSaveToDrive?: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  onOpenHistory?: () => void;
  currentVersionNumber?: number;
}

export const MarkdownRichEditor: React.FC<MarkdownRichEditorProps> = ({
  initialContent,
  documentTitle,
  onSaveContent,
  onSaveToDrive,
  onEditingChange,
  onOpenHistory,
  currentVersionNumber = 1,
}) => {
  const [content, setContent] = useState(initialContent);
  const [editorMode, setEditorMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [isSaved, setIsSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiRefining, setIsAiRefining] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync if initialContent changes from external artifact selection
  useEffect(() => {
    setContent(initialContent);
    setIsSaved(true);
  }, [initialContent]);

  // Insert markdown tag around or at selection
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setIsSaved(false);
    onEditingChange?.(true);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleManualSave = () => {
    onSaveContent(content, 'Manual edit in rich text editor');
    setIsSaved(true);
    onEditingChange?.(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // AI Refine with Jarvis
  const handleAiRefine = async (instruction: string) => {
    if (!instruction.trim() || isAiRefining) return;
    setIsAiRefining(true);

    try {
      const res = await fetch('/api/artifact/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Please refine and edit this document following this instruction: "${instruction}". Preserve valid markdown structure, metrics, and enhance the quality.`,
          contextData: { currentContent: content },
          artifactType: 'report',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
          onSaveContent(data.content, `Refined by Jarvis: "${instruction}"`);
          setIsSaved(true);
          setAiPrompt('');
        }
      }
    } catch (err) {
      console.error('AI refinement error:', err);
    } finally {
      setIsAiRefining(false);
    }
  };

  // Metrics
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readTimeMin = Math.ceil(words / 200);

  // Simple Markdown to HTML preview renderer for common elements
  const renderSimpleMarkdown = (mdText: string) => {
    const lines = mdText.split('\n');
    return (
      <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-200 select-text">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-lg font-black text-white pt-2 border-b border-slate-800 pb-1">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-sm font-bold text-cyan-300 pt-2 border-b border-slate-800/80 pb-0.5">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-xs font-bold text-sky-300 pt-1">{line.slice(4)}</h3>;
          }
          // Blockquotes
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-2 border-cyan-400 pl-3 py-1 italic text-cyan-200/90 bg-cyan-950/20 rounded-r-lg">
                {line.slice(2)}
              </blockquote>
            );
          }
          // Task Checkboxes
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 pl-2">
                <input type="checkbox" readOnly className="rounded border-slate-700 text-cyan-500" />
                <span className="text-slate-300">{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 pl-2 line-through text-slate-500">
                <input type="checkbox" checked readOnly className="rounded border-slate-700 text-cyan-500" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          // Bullet List
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-slate-300">
                {line.slice(2)}
              </li>
            );
          }
          // Divider
          if (line.trim() === '---' || line.trim() === '***') {
            return <hr key={idx} className="border-slate-800 my-2" />;
          }
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          // Standard Paragraph
          return <p key={idx} className="text-slate-300 leading-relaxed">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Top Formatting Toolbar */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Formatting Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => insertFormatting('# ', '', 'Heading 1')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Heading 1 (# Heading)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('## ', '', 'Heading 2')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Heading 2 (## Heading)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('### ', '', 'Heading 3')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Heading 3 (### Heading)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => insertFormatting('- ', '', 'Bullet item')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ', '', 'Numbered item')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ', '', 'Task item')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Task List (- [ ] item)"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => insertFormatting('> ', '', 'Quote note')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Blockquote (> quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('`', '`', 'code snippet')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                '\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Data A | Data B | Data C |\n',
                '',
                ''
              )
            }
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Insert Table Template"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n---\n', '', '')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Horizontal Rule (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode & Save Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setEditorMode('edit')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'edit' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Editor only"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setEditorMode('split')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'split' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-side Edit & Live Preview"
            >
              <Columns2 className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setEditorMode('preview')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'preview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Preview only"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleManualSave}
            disabled={isSaved}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-slate-900 text-slate-500 border border-slate-800'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save Changes'}</span>
          </button>

          {/* Version History Button */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open version history and restore revisions"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">History</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-slate-800 text-cyan-300">
                v{currentVersionNumber}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* AI Refinement & Quick Prompt Bar */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 max-w-lg">
          <Wand2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Ask Jarvis to refine document (e.g. 'Add executive KPI table', 'Make concise')..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiRefine(aiPrompt)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleAiRefine(aiPrompt)}
            disabled={isAiRefining || !aiPrompt.trim()}
            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-40"
          >
            {isAiRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Refine
          </button>
        </div>

        {/* Quick Pre-made Refinement Chips */}
        <div className="hidden lg:flex items-center gap-1 text-[11px]">
          <button
            onClick={() => handleAiRefine('Summarize key points into an executive briefing list at top')}
            disabled={isAiRefining}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            + Key Takeaways
          </button>
          <button
            onClick={() => handleAiRefine('Make tone more punchy and corporate executive ready')}
            disabled={isAiRefining}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Executive Polish
          </button>
        </div>
      </div>

      {/* Editor & Preview Split Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Editor Left Pane */}
        {(editorMode === 'edit' || editorMode === 'split') && (
          <div className="flex-1 flex flex-col border-r border-slate-800 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsSaved(false);
                onEditingChange?.(true);
              }}
              placeholder="Write or refine markdown here..."
              className="w-full h-full bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none resize-none custom-scrollbar leading-relaxed selection:bg-cyan-500/30"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Preview Right Pane */}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40 custom-scrollbar select-text min-w-0">
            <div className="max-w-3xl mx-auto">
              {renderSimpleMarkdown(content)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>{words} words</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{chars} chars</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>~{readTimeMin} min read</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy markdown text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Download .md file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onSaveToDrive && (
            <button
              onClick={onSaveToDrive}
              className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Save to Google Drive"
            >
              <HardDrive className="w-3 h-3 text-cyan-400" />
              Save to Drive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
