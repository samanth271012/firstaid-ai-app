import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Volume2,
  VolumeX,
  Printer,
  Copy,
  Check,
  Share2,
  Clock,
  Send,
  RefreshCw,
  AlertOctagon,
  FileText,
  CornerDownRight,
  Eye,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { ParsedTriage } from '../types/firstaid';

interface TriageResultCardProps {
  parsed: ParsedTriage;
  originalText?: string;
  originalImageUrl?: string;
  onOpenEmergencyModal: () => void;
  onAskFollowUp: (question: string) => void;
  isFollowUpLoading?: boolean;
}

export const TriageResultCard: React.FC<TriageResultCardProps> = ({
  parsed,
  originalText,
  originalImageUrl,
  onOpenEmergencyModal,
  onAskFollowUp,
  isFollowUpLoading = false,
}) => {
  const [completedSteps, setCompletedSteps] = useState<{ [index: number]: boolean }>({});
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [followUpText, setFollowUpText] = useState<string>('');
  const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(false);

  // Toggle step completion
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Text-To-Speech for hands-free first aid assistance
  const toggleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const stepsText = parsed.immediateSteps.join('. ');
    const whatNotText = parsed.whatNotToDo.length > 0 ? ` What not to do: ${parsed.whatNotToDo.join('. ')}.` : '';
    const speechText = `${parsed.injuryIdentified ? `Injury: ${parsed.injuryIdentified}. ` : ''}Urgency: ${parsed.urgencyLevel}. Steps: ${stepsText}.${whatNotText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(parsed.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isFollowUpLoading) return;
    onAskFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  const isEmergency = parsed.urgencyLevel === 'Emergency';
  const isConsult = parsed.urgencyLevel === 'Consult Doctor Soon' || parsed.urgencyLevel === 'Consult Doctor';
  const isHomeCare = parsed.urgencyLevel === 'Home Care Suitable';

  // Word count calculation
  const wordCount = parsed.rawMarkdown.trim().split(/\s+/).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none animate-fadeIn">
      {/* 🚨 TOP HEADER: INJURY IDENTIFIED & URGENCY */}
      <div
        className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isEmergency
            ? 'bg-red-950/80 border-red-700/80 text-white'
            : isConsult
            ? 'bg-amber-950/70 border-amber-600/70 text-amber-100'
            : 'bg-emerald-950/70 border-emerald-600/70 text-emerald-100'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isEmergency
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                : isConsult
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
            }`}
          >
            {isEmergency ? (
              <AlertOctagon className="w-7 h-7" />
            ) : isConsult ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>

          <div>
            {parsed.injuryIdentified ? (
              <>
                <div className="text-[11px] uppercase tracking-wider font-extrabold opacity-75">
                  Injury Identified:
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {parsed.injuryIdentified}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      isEmergency
                        ? 'bg-red-600 text-white'
                        : isConsult
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                        : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                    }`}
                  >
                    <span>Urgency: {parsed.urgencyLevel}</span>
                  </span>
                  <span className="text-[11px] opacity-75 hidden sm:inline">
                    · {wordCount} words
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-wider font-bold opacity-80">
                  Urgency:
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {parsed.urgencyLevel}
                </h2>
              </>
            )}
          </div>
        </div>

        {/* Emergency Call Action if Emergency */}
        {isEmergency ? (
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm rounded-xl shadow-xl shadow-red-600/50 transition-all transform hover:scale-[1.02] shrink-0"
          >
            <PhoneCall className="w-5 h-5 fill-white animate-bounce" />
            <span>CALL 911 / 112 NOW</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto print:hidden">
            <button
              onClick={toggleReadAloud}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isSpeaking
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
              title="Listen to first-aid steps hands-free"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Copy rapid triage"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Print triage for medical provider"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* User context summary preview if photo or text exists */}
        {(originalImageUrl || originalText) && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
            {originalImageUrl && (
              <img
                src={originalImageUrl}
                alt="Analyzed injury"
                className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Evidence Analyzed
              </span>
              <p className="text-xs text-slate-300 italic truncate mt-0.5">
                "{originalText || 'Injury photo'}"
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded shrink-0">
              ⚡ Rapid Triage
            </span>
          </div>
        )}

        {/* ⚡ FIRST-AID STEPS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>First-Aid Steps:</span>
            </h3>
            <span className="text-[11px] text-slate-400 print:hidden">
              Tap step to mark complete
            </span>
          </div>

          <div className="space-y-2">
            {parsed.immediateSteps.map((step, idx) => {
              const isChecked = !!completedSteps[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStep(idx)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                    <span className="font-bold mr-2 text-blue-400 font-mono">
                      {idx + 1}.
                    </span>
                    <span className={isChecked ? 'line-through opacity-80' : ''}>
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. [What NOT to do] Box */}
          {parsed.whatNotToDo.length > 0 && (
            <div className="mt-2 p-3.5 bg-rose-950/25 border border-rose-800/40 rounded-xl">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-300 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>3. What NOT To Do:</span>
              </h4>
              <ul className="space-y-1 text-xs text-rose-200 list-disc list-inside">
                {parsed.whatNotToDo.map((item, idx) => (
                  <li key={idx} className="font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ⚠️ RED FLAGS: [When to go to ER] */}
        <section className="space-y-2">
          <div className="p-3.5 bg-red-950/30 border border-red-800/50 rounded-xl">
            <h4 className="font-bold text-xs uppercase tracking-wider text-red-300 flex items-center gap-1.5 mb-1.5">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Red Flags (When to go to ER):</span>
            </h4>
            <div className="text-xs text-red-200 leading-relaxed font-medium">
              {parsed.redFlags.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside">
                  {parsed.redFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p>Severe bleeding that won't stop, loss of sensation, high fever, or signs of shock.</p>
              )}
            </div>
          </div>
        </section>

        {/* Raw Markdown Accordion */}
        <div className="pt-2 border-t border-slate-800 print:hidden flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowRawMarkdown(!showRawMarkdown)}
            className="hover:text-slate-400 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showRawMarkdown ? 'Hide Raw Output' : 'View Exact Output Format'}</span>
          </button>
          <span className="font-mono text-[10px]">Strictly under 100 words</span>
        </div>

        {showRawMarkdown && (
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
            {parsed.rawMarkdown}
          </pre>
        )}

        {/* Follow-up question bar */}
        <div className="pt-2 border-t border-slate-800 print:hidden">
          <form onSubmit={handleFollowUpSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Ask follow-up or update symptoms:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="e.g. Bleeding stopped, should I bandage tightly? or Started throbbing..."
                className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!followUpText.trim() || isFollowUpLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {isFollowUpLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
