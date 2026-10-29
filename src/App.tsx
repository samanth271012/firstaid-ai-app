import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TriageForm } from './components/TriageForm';
import { TriageResultCard } from './components/TriageResultCard';
import { CprMetronome } from './components/CprMetronome';
import { InteractiveTimers } from './components/InteractiveTimers';
import { EmergencyDialModal } from './components/EmergencyDialModal';
import { QuickGuidesModal } from './components/QuickGuidesModal';
import { TriageHistoryModal } from './components/TriageHistoryModal';
import { parseTriageMarkdown } from './utils/triageParser';
import { generateClinicalTriage } from './utils/clinicalTriage';
import { ParsedTriage, TriageRecord, QuickGuide } from './types/firstaid';
import {
  ShieldAlert,
  HeartPulse,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'firstaid_ai_records_v1';

export default function App() {
  const [currentTriage, setCurrentTriage] = useState<ParsedTriage | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals and panels
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isGuidesModalOpen, setIsGuidesModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isCprOpen, setIsCprOpen] = useState<boolean>(false);
  const [isTimersOpen, setIsTimersOpen] = useState<boolean>(false);

  // Saved History
  const [records, setRecords] = useState<TriageRecord[]>([]);

  // Conversation history for follow-ups
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load triage history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveRecords = (newRecords: TriageRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch (e) {
      console.error('Failed to save triage history:', e);
    }
  };

  const handleTriageSubmit = async (data: { text: string; imageBase64?: string; mimeType?: string }) => {
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentDescription(data.text);
    setCurrentImage(data.imageBase64);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: data.text,
          image: data.imageBase64
            ? {
                data: data.imageBase64,
                mimeType: data.mimeType || 'image/jpeg',
              }
            : undefined,
        }),
      });

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        console.warn('Server returned non-JSON response, activating instant clinical triage.');
      }

      let rawMarkdown = json?.rawMarkdown;
      if (!rawMarkdown || typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) {
        const fallback = generateClinicalTriage(data.text, !!data.imageBase64);
        rawMarkdown = fallback.rawMarkdown;
      }

      const parsed = parseTriageMarkdown(rawMarkdown);
      setCurrentTriage(parsed);

      // Append to conversation history
      setConversationHistory([
        { role: 'user', content: data.text || 'Photo submitted for injury evaluation' },
        { role: 'assistant', content: rawMarkdown },
      ]);

      // If Emergency detected, automatically notify user
      if (parsed.urgencyLevel === 'Emergency') {
        setIsEmergencyModalOpen(true);
      }

      // Add to records
      const newRecord: TriageRecord = {
        id: 'trg_' + Date.now(),
        timestamp: Date.now(),
        description: data.text,
        imageDataUrl: data.imageBase64,
        parsed,
        completedStepIndices: [],
      };

      saveRecords([newRecord, ...records.slice(0, 19)]); // keep last 20

      // Scroll to result on small screens
      setTimeout(() => {
        const resultEl = document.getElementById('triage-result-anchor');
        if (resultEl) {
          resultEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.warn('Network issue, using client clinical triage:', err);
      // Even on total network disconnect, generate life-saving triage locally
      const fallback = generateClinicalTriage(data.text, !!data.imageBase64);
      const parsed = parseTriageMarkdown(fallback.rawMarkdown);
      setCurrentTriage(parsed);
      if (parsed.urgencyLevel === 'Emergency') {
        setIsEmergencyModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskFollowUp = async (question: string) => {
    if (!question.trim()) return;
    setIsFollowUpLoading(true);
    setErrorMsg(null);

    try {
      const updatedHistory = [...conversationHistory, { role: 'user' as const, content: question }];

      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Follow-up question regarding earlier triage: "${question}"`,
          image: currentImage
            ? {
                data: currentImage,
                mimeType: 'image/jpeg',
              }
            : undefined,
          history: updatedHistory,
        }),
      });

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        console.warn('Non-JSON response for follow-up');
      }

      let rawMarkdown = json?.rawMarkdown;
      if (!rawMarkdown) {
        const fallback = generateClinicalTriage(question, false);
        rawMarkdown = fallback.rawMarkdown;
      }

      const parsed = parseTriageMarkdown(rawMarkdown);
      setCurrentTriage(parsed);

      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant' as const, content: rawMarkdown },
      ]);
    } catch (err: any) {
      console.warn('Follow-up network error, using fallback:', err);
      const fallback = generateClinicalTriage(question, false);
      const parsed = parseTriageMarkdown(fallback.rawMarkdown);
      setCurrentTriage(parsed);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleSelectRecord = (record: TriageRecord) => {
    setCurrentTriage(record.parsed);
    setCurrentDescription(record.description);
    setCurrentImage(record.imageDataUrl);
    setConversationHistory([
      { role: 'user', content: record.description || 'Saved triage session' },
      { role: 'assistant', content: record.parsed.rawMarkdown },
    ]);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your saved triage history?')) {
      saveRecords([]);
    }
  };

  const handleDeleteRecord = (id: string) => {
    saveRecords(records.filter((r) => r.id !== id));
  };

  const handleSelectGuideScenario = (guide: QuickGuide) => {
    const scenarioPrompt = `I need immediate first aid for ${guide.title}. Please provide step-by-step guidance.`;
    handleTriageSubmit({ text: scenarioPrompt });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Header & Emergency Hotline Trigger */}
      <Header
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        onOpenGuidesModal={() => setIsGuidesModalOpen(true)}
        onToggleCpr={() => setIsCprOpen(!isCprOpen)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        isCprOpen={isCprOpen}
        historyCount={records.length}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Expandable CPR Metronome Drawer */}
        {isCprOpen && (
          <div className="animate-fadeIn">
            <CprMetronome />
          </div>
        )}

        {/* Expandable Timers Drawer */}
        {isTimersOpen && (
          <div className="animate-fadeIn">
            <InteractiveTimers />
          </div>
        )}

        {/* Emergency Quick Action Pill Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-medium">
              FirstAid AI triages symptoms & photos under strict emergency triage protocols.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTimersOpen(!isTimersOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors ${
                isTimersOpen
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{isTimersOpen ? 'Hide Timers' : 'First-Aid Timers'}</span>
            </button>

            <button
              onClick={() => setIsGuidesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Guides Library</span>
            </button>
          </div>
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-700 rounded-xl text-red-200 text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-100 font-semibold mb-0.5">Assessment Notice</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Form on Left/Top, Results on Right/Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Triage Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <TriageForm onSubmit={handleTriageSubmit} isLoading={isLoading} />

            {/* Quick First-Aid Help Cards for Instant Reference */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Immediate Action Highlights</span>
                </h3>
                <button
                  onClick={() => setIsGuidesModalOpen(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() =>
                    handleTriageSubmit({
                      text: 'Spilled boiling water on hand, red skin stinging intensely. Need first aid steps.',
                    })
                  }
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 text-left transition-colors"
                >
                  <span className="font-bold text-amber-400 block mb-0.5">Burns</span>
                  <span className="text-[11px] text-slate-400 line-clamp-2">
                    Cool running water 10-20 min. Never use ice or butter.
                  </span>
                </button>

                <button
                  onClick={() =>
                    handleTriageSubmit({
                      text: 'Deep kitchen cut on finger, bleeding moderately. Need bleeding control first aid.',
                    })
                  }
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-red-500/50 text-left transition-colors"
                >
                  <span className="font-bold text-red-400 block mb-0.5">Bleeding</span>
                  <span className="text-[11px] text-slate-400 line-clamp-2">
                    Direct continuous pressure for 10 min without lifting gauze.
                  </span>
                </button>

                <button
                  onClick={() =>
                    handleTriageSubmit({
                      text: 'Twisted ankle on stairs, swollen and bruised. Can barely put weight on it.',
                    })
                  }
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 text-left transition-colors"
                >
                  <span className="font-bold text-blue-400 block mb-0.5">Sprains</span>
                  <span className="text-[11px] text-slate-400 line-clamp-2">
                    R.I.C.E. protocol: Rest, Ice 20 min, Compress, Elevate.
                  </span>
                </button>

                <button
                  onClick={() =>
                    handleTriageSubmit({
                      text: 'Wasp sting with localized swelling and itching on forearm. No breathing difficulty.',
                    })
                  }
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
                >
                  <span className="font-bold text-purple-400 block mb-0.5">Stings</span>
                  <span className="text-[11px] text-slate-400 line-clamp-2">
                    Scrape stinger off, wash with soap & apply cold compress.
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Triage Result Card */}
          <div className="lg:col-span-7" id="triage-result-anchor">
            {currentTriage ? (
              <TriageResultCard
                parsed={currentTriage}
                originalText={currentDescription}
                originalImageUrl={currentImage}
                onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                onAskFollowUp={handleAskFollowUp}
                isFollowUpLoading={isFollowUpLoading}
              />
            ) : (
              /* Calm Standby / Waiting State */
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 text-center shadow-xl space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Ready for Injury Triage</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Submit a photo or describe the injury above to receive structured urgency level, visual assessment, immediate step-by-step first-aid care, and red flags.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-left">
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] font-bold text-red-400 block uppercase tracking-wider mb-1">
                      1. Emergency Check
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Evaluates immediate life-threatening danger and instructs 911 dispatch when warranted.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] font-bold text-blue-400 block uppercase tracking-wider mb-1">
                      2. Multimodal Vision
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Observes redness, swelling, cut edges, and depth without definitive medical diagnosis.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider mb-1">
                      3. Action Steps
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Provides clear numbered steps, what NOT to do, hospital red flags, and voice readout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer with Mandatory Disclaimer & Quick Hotline */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">
              FirstAid AI · Emergency Guidance & Injury Triage Assistant
            </p>
            <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">
              ⚖️ Medical Disclaimer: I am an AI assistant, not a doctor. This information is for general first-aid guidance and does not replace professional medical evaluation. In any life-threatening situation, call your local emergency service (911, 999, 112) immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Emergency Numbers</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmergencyDialModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      <QuickGuidesModal
        isOpen={isGuidesModalOpen}
        onClose={() => setIsGuidesModalOpen(false)}
        onSelectGuideScenario={handleSelectGuideScenario}
      />

      <TriageHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        records={records}
        onSelectRecord={handleSelectRecord}
        onClearHistory={handleClearHistory}
        onDeleteRecord={handleDeleteRecord}
      />
    </div>
  );
}
