import React, { useState } from 'react';
import { DeepgramConfig } from '../types';
import { speakWithDeepgramAura } from '../services/deepgramService';
import { Key, Mic, Volume2, ShieldCheck, Eye, EyeOff, X, Check, Play, Loader2 } from 'lucide-react';

interface DeepgramSettingsModalProps {
  isOpen: boolean;
  config: DeepgramConfig;
  onSave: (newConfig: DeepgramConfig) => void;
  onClose: () => void;
}

export const DeepgramSettingsModal: React.FC<DeepgramSettingsModalProps> = ({
  isOpen,
  config,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [voiceModel, setVoiceModel] = useState(config.voiceModel || 'aura-helios-en');
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  const voiceOptions = [
    { id: 'aura-helios-en', name: 'Helios (Jarvis Male)', desc: 'Crisp, articulate, authoritative British cadence' },
    { id: 'aura-arcas-en', name: 'Arcas (Deep Male)', desc: 'Deep baritone, executive presence' },
    { id: 'aura-asteria-en', name: 'Asteria (Executive Female)', desc: 'Natural, warm, high-clarity female' },
    { id: 'aura-luna-en', name: 'Luna (Dynamic Female)', desc: 'Upbeat, articulate assistant tone' },
    { id: 'aura-zeus-en', name: 'Zeus (Bold Command)', desc: 'Strong, powerful low-frequency tone' },
  ];

  const handleTestVoice = async () => {
    if (!apiKey.trim()) {
      setTestError('Please enter your Deepgram API Key first to test voice generation.');
      return;
    }
    setTestError(null);
    setTestSuccess(false);
    setIsTesting(true);

    try {
      await speakWithDeepgramAura(
        'At your service, sir. Jarvis voice systems are fully operational and ready for your command.',
        apiKey.trim(),
        voiceModel
      );
      setTestSuccess(true);
    } catch (err: any) {
      console.error('Test voice failed:', err);
      setTestError(err.message || 'Failed to synthesize test voice. Verify your Deepgram API key.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...config,
      apiKey: apiKey.trim(),
      voiceModel,
      systemPrompt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl shadow-cyan-500/10 text-slate-100 flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Deepgram Voice Agent Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Aura & Nova-2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your Deepgram Voice Agent API key for real-time natural voice dialogue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* API Key Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Deepgram API Key
            </span>
            <span className="text-[11px] text-cyan-400/80 font-normal">
              Stored securely in browser memory
            </span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Deepgram API Key (e.g. dg_...)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 pr-20 text-xs text-slate-100 placeholder:text-slate-600 outline-none font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            Used for real-time speech-to-text (Nova-2) and Jarvis text-to-speech (Aura).
          </p>
        </div>

        {/* Voice Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            Select Jarvis Persona & Aura Voice Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {voiceOptions.map((opt) => {
              const isSelected = voiceModel === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setVoiceModel(opt.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Voice Control */}
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">Audio Synthesis Test</span>
            <span className="text-[11px] text-slate-400">Play an instant greeting via Deepgram Aura</span>
          </div>
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isTesting || !apiKey.trim()}
            className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Test Voice
              </>
            )}
          </button>
        </div>

        {testError && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-[11px]">
            {testError}
          </div>
        )}
        {testSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Audio synthesized and played successfully!
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer font-sans"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
