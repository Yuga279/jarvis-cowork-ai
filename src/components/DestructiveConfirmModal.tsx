import React from 'react';
import { ConfirmationRequest } from '../types';
import { AlertTriangle, Send, Calendar, Table, HardDrive, Check, X } from 'lucide-react';

interface DestructiveConfirmModalProps {
  request: ConfirmationRequest | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DestructiveConfirmModal: React.FC<DestructiveConfirmModalProps> = ({
  request,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !request) return null;

  const getToolIcon = () => {
    if (request.tool.startsWith('gmail')) return <Send className="w-5 h-5 text-amber-400" />;
    if (request.tool.startsWith('calendar')) return <Calendar className="w-5 h-5 text-amber-400" />;
    if (request.tool.startsWith('sheets')) return <Table className="w-5 h-5 text-amber-400" />;
    return <HardDrive className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-500/10 text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
            {getToolIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wider font-mono">
                Approval Required
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">{request.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{request.description}</p>
          </div>
        </div>

        {/* Action Details Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans mb-2 font-semibold">
            Action Payload Details:
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {Object.entries(request.details).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-0.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-cyan-400 font-semibold">{key}:</span>
                <span className="text-slate-200 break-words whitespace-pre-wrap">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Jarvis Cowork requires your explicit consent before executing operations that modify or transmit user workspace data.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Cancel / Skip Step
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <Check className="w-4 h-4 text-slate-950" />
            Approve & Execute Action
          </button>
        </div>
      </div>
    </div>
  );
};
