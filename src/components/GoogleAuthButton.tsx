import React from 'react';
import { UserProfile } from '../types';
import { LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleAuthButtonProps {
  user: UserProfile | null;
  hasToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  user,
  hasToken,
  isLoggingIn,
  onLogin,
  onLogout,
}) => {
  if (user && hasToken) {
    return (
      <div className="flex items-center gap-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Google User'}
            className="w-7 h-7 rounded-full border border-cyan-400/40 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-cyan-600/30 flex items-center justify-center text-xs font-semibold text-cyan-200">
            {user.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-100 max-w-[120px] truncate">
              {user.displayName || user.email}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono tracking-tight">Workspace Connected</span>
        </div>
        <button
          onClick={onLogout}
          title="Disconnect Google Workspace"
          className="ml-1 p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLogin}
      disabled={isLoggingIn}
      className="group relative inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 text-slate-100 text-xs font-semibold rounded-xl border border-white/20 shadow-sm backdrop-blur-md transition-all duration-200 disabled:opacity-60 cursor-pointer"
    >
      {/* Official Google 'G' icon */}
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
      <span>{isLoggingIn ? 'Connecting...' : 'Connect Google Workspace'}</span>
      {!hasToken && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Requires connection for full actions" />
      )}
    </button>
  );
};
