import React from 'react';
import { X, Trash2, Calendar, Clock, AlertTriangle, ArrowRight, Printer } from 'lucide-react';
import { TriageRecord } from '../types/firstaid';

interface TriageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TriageRecord[];
  onSelectRecord: (record: TriageRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
}

export const TriageHistoryModal: React.FC<TriageHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col text-slate-100 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h2 className="font-bold text-base text-white">Triage History & Symptom Progression</h2>
            <p className="text-xs text-slate-400">Past injury assessments stored locally on your device</p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                title="Clear all saved history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of records */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No triage assessments recorded yet.</p>
              <p className="text-xs text-slate-600 mt-1">
                Completed triage queries and photos will appear here for progress tracking.
              </p>
            </div>
          ) : (
            records.map((rec) => {
              const dateStr = new Date(rec.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isEmergency = rec.parsed.urgencyLevel === 'Emergency';
              const isConsult = rec.parsed.urgencyLevel === 'Consult Doctor Soon' || rec.parsed.urgencyLevel === 'Consult Doctor';

              return (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex items-start gap-3.5"
                >
                  {/* Photo thumbnail if exists */}
                  {rec.imageDataUrl ? (
                    <img
                      src={rec.imageDataUrl}
                      alt="Injury thumbnail"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 text-xs font-medium">
                      No Photo
                    </div>
                  )}

                  {/* Summary & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isEmergency
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : isConsult
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {rec.parsed.urgencyLevel}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                      {rec.description || rec.parsed.assessmentSummary || 'Injury triage query'}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {rec.parsed.immediateSteps.length} action steps · {rec.parsed.redFlags.length} red flags monitored
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onSelectRecord(rec);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Load this assessment"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(rec.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 text-xs transition-colors self-end"
                      title="Delete this record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
