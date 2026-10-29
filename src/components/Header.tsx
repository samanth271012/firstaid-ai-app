import React from 'react';
import { ShieldAlert, PhoneCall, BookOpen, HeartPulse, History, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  onOpenEmergencyModal: () => void;
  onOpenGuidesModal: () => void;
  onToggleCpr: () => void;
  onOpenHistoryModal: () => void;
  isCprOpen: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEmergencyModal,
  onOpenGuidesModal,
  onToggleCpr,
  onOpenHistoryModal,
  isCprOpen,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-sm">
      {/* Red Alert Bar for Immediate Threat */}
      <div className="bg-red-700/90 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
          <span className="truncate">
            <strong>EMERGENCY WARNING:</strong> If someone is unconscious, gasping, severely bleeding, or experiencing chest pain, call 911 immediately.
          </span>
          <button
            onClick={onOpenEmergencyModal}
            className="ml-auto underline font-bold shrink-0 hover:text-amber-200 transition-colors"
          >
            Call Now
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 ring-2 ring-red-400/30">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">FirstAid AI</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 rounded-full">
                Triage Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Calm, direct, and structured first-aid guidance & wound assessment
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Guides Button */}
          <button
            onClick={onOpenGuidesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="First-Aid Knowledge Cards"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">First-Aid Guides</span>
          </button>

          {/* CPR Metronome Toggle */}
          <button
            onClick={onToggleCpr}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isCprOpen
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="CPR Hands-Only Compression Metronome"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">CPR Pacer</span>
          </button>

          {/* Past Triage History */}
          <button
            onClick={onOpenHistoryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Saved Triage History"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Immediate Call Button */}
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-all hover:scale-[1.02]"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-white" />
            <span>Call 911</span>
          </button>
        </div>
      </div>
    </header>
  );
};
