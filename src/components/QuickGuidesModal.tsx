import React, { useState } from 'react';
import { X, Search, BookOpen, AlertTriangle, ShieldCheck, Flame, Droplet, Activity, ShieldAlert, HeartPulse, AlertOctagon } from 'lucide-react';
import { QUICK_GUIDES } from '../data/quickGuides';
import { QuickGuide } from '../types/firstaid';

interface QuickGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGuideScenario?: (guide: QuickGuide) => void;
}

export const QuickGuidesModal: React.FC<QuickGuidesModalProps> = ({ isOpen, onClose, onSelectGuideScenario }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<QuickGuide>(QUICK_GUIDES[0]);

  if (!isOpen) return null;

  const filteredGuides = QUICK_GUIDES.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.keySteps.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplet':
        return <Droplet className="w-4 h-4 text-red-400" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'AlertOctagon':
        return <AlertOctagon className="w-4 h-4 text-red-400" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col text-slate-100 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">First-Aid Emergency Guides</h2>
              <p className="text-xs text-slate-400">Offline-ready protocols for common injuries and situations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area: Sidebar + Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Guide list */}
          <div className="md:col-span-5 border-r border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-950/40">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search burns, bleeding, choking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              {filteredGuides.map((guide) => {
                const isSelected = selectedGuide.id === guide.id;
                return (
                  <button
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                        {renderIcon(guide.icon)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-100">{guide.title}</div>
                        <span className="text-[10px] text-slate-400">{guide.category}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        guide.urgency === 'Emergency'
                          ? 'bg-red-500/20 text-red-300'
                          : guide.urgency === 'Consult Doctor Soon'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {guide.urgency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guide details */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-slate-900/50">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                  {selectedGuide.category} Protocol
                </span>
                <h3 className="text-xl font-bold text-white">{selectedGuide.title}</h3>
              </div>
              {onSelectGuideScenario && (
                <button
                  onClick={() => {
                    onSelectGuideScenario(selectedGuide);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Use for AI Triage
                </button>
              )}
            </div>

            {/* Key Action Steps */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <h4 className="font-semibold text-xs text-blue-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Immediate Step-by-Step Action:</span>
              </h4>
              <ol className="space-y-2 text-xs text-slate-200">
                {selectedGuide.keySteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Do NOTs */}
            <div className="p-4 bg-rose-950/20 rounded-xl border border-rose-800/40">
              <h4 className="font-semibold text-xs text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>What NOT To Do:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-200 list-disc list-inside">
                {selectedGuide.doNots.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>

            {/* When to call 911 / Hospital */}
            <div className="p-4 bg-red-950/40 rounded-xl border border-red-700/60">
              <h4 className="font-semibold text-xs text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>Red Flags (Call 911 / Go to Hospital Immediately):</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-red-200 list-disc list-inside font-medium">
                {selectedGuide.whenToCall911.map((rf, idx) => (
                  <li key={idx}>{rf}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
