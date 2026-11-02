import React from 'react';
import { UserProfile, DeepgramConfig } from '../types';
import { GoogleAuthButton } from './GoogleAuthButton';
import { Sparkles, Cpu } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  hasToken: boolean;
  isLoggingIn: boolean;
  deepgramConfig: DeepgramConfig;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDeepgramSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasToken,
  isLoggingIn,
  deepgramConfig,
  onLogin,
  onLogout,
  onOpenDeepgramSettings,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 bg-slate-950/80 border-b border-cyan-500/20 backdrop-blur-xl flex items-center justify-between z-30 shrink-0">
      {/* Brand & Jarvis HUD */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-slate-950" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-200 uppercase font-sans">
              JARVIS
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              COWORK
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
            Autonomous Workspace Orchestrator & Voice Agent
          </p>
        </div>
      </div>

      {/* Right Controls: Deepgram Voice Badge & Google Workspace Auth */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDeepgramSettings}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            deepgramConfig.apiKey
              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Deepgram Voice Agent Settings"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline font-mono text-[11px]">
            {deepgramConfig.apiKey ? 'Deepgram Aura' : 'Set Deepgram Key'}
          </span>
        </button>

        <GoogleAuthButton
          user={user}
          hasToken={hasToken}
          isLoggingIn={isLoggingIn}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
};
