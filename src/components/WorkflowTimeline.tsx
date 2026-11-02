import React, { useState } from 'react';
import { WorkflowTask, WorkflowStep } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
  Table,
  HardDrive,
  Globe,
  FileText,
  ShieldAlert,
  Loader2,
  Bot,
  Zap,
} from 'lucide-react';

interface WorkflowTimelineProps {
  task: WorkflowTask | null;
  onApproveStep?: (step: WorkflowStep) => void;
  onRetryStep?: (step: WorkflowStep) => void;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  task,
  onApproveStep,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getToolIcon = (tool: string) => {
    if (tool.startsWith('gmail')) return <Send className="w-4 h-4 text-rose-400" />;
    if (tool.startsWith('calendar')) return <Calendar className="w-4 h-4 text-sky-400" />;
    if (tool.startsWith('sheets')) return <Table className="w-4 h-4 text-emerald-400" />;
    if (tool.startsWith('drive')) return <HardDrive className="w-4 h-4 text-amber-400" />;
    if (tool.startsWith('browser')) return <Globe className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-indigo-400" />;
  };

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center h-full">
        <Bot className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Active Cowork Task</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Give Jarvis a command via voice or the prompt box to initiate an autonomous multi-step workflow.
        </p>
      </div>
    );
  }

  const completedCount = task.steps.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / task.steps.length) * 100);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Cowork Task Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 uppercase tracking-wider">
                Workflow Pipeline
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  task.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : task.status === 'approval_required'
                    ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white mt-1.5">{task.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{task.description}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-cyan-400 font-mono">{progressPct}%</span>
            <div className="text-[10px] text-slate-500 font-mono">
              {completedCount} / {task.steps.length} steps
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sequential Steps List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {task.steps.map((step, idx) => {
          const isExpanded = Boolean(expandedSteps[step.id]);
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-3.5 transition-all ${
                step.status === 'running'
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                  : step.status === 'approval_required'
                  ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                  : step.status === 'completed'
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-850 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : step.status === 'approval_required' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400 animate-bounce" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  {/* Step Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">Step {idx + 1}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {getToolIcon(step.tool)}
                        {step.tool}
                      </span>
                      {step.requiresConfirmation && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Gate: Approval
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 mt-1">{step.title}</h4>
                    {step.rationale && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{step.rationale}</p>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {step.status === 'approval_required' && onApproveStep && (
                    <button
                      onClick={() => onApproveStep(step)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      Review & Approve
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Parameters and Live Response */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
                  {step.params && Object.keys(step.params).length > 0 && (
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-sans font-semibold">
                        Input Parameters:
                      </span>
                      <pre className="mt-1 p-2 bg-slate-950 rounded-lg text-slate-300 overflow-x-auto text-[10px]">
                        {JSON.stringify(step.params, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.output && (
                    <div>
                      <span className="text-emerald-400/90 uppercase text-[9px] font-sans font-semibold">
                        Step Execution Output:
                      </span>
                      <pre className="mt-1 p-2 bg-slate-950 rounded-lg text-emerald-300/90 overflow-x-auto text-[10px]">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.error && (
                    <div className="p-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-[10px]">
                      Error: {step.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
