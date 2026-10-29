import React, { useState, useEffect, useRef } from 'react';
import { HeartPulse, Play, Pause, RotateCcw, Volume2, VolumeX, ShieldAlert, PhoneCall } from 'lucide-react';

export const CprMetronome: React.FC = () => {
  const [bpm, setBpm] = useState<number>(110); // Standard AHA target: 100-120 bpm
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [compressionsCount, setCompressionsCount] = useState<number>(0);
  const [pulse, setPulse] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  // Play click audio
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.08);
    } catch {
      // Audio might be blocked until user gesture
    }
  };

  useEffect(() => {
    if (isRunning) {
      const intervalMs = (60 / bpm) * 1000;
      timerRef.current = window.setInterval(() => {
        playBeep();
        setPulse(true);
        setTimeout(() => setPulse(false), 120);
        setCompressionsCount((prev) => prev + 1);
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, bpm, soundEnabled]);

  const toggleRun = () => {
    if (!isRunning && !audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCompressionsCount(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-100">CPR Compression Metronome</h3>
            <p className="text-xs text-slate-400">Target: 100–120 compressions/min (Hands-Only CPR)</p>
          </div>
        </div>

        <a
          href="tel:911"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 911 First</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 items-center">
        {/* Visual Pulse Indicator & Controls */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-75 ${
              pulse
                ? 'scale-110 bg-red-500 text-white shadow-[0_0_35px_rgba(239,68,68,0.7)]'
                : 'scale-100 bg-slate-800/80 text-red-400'
            }`}
          >
            <HeartPulse className={`w-10 h-10 ${pulse ? 'scale-125' : 'scale-100'} transition-transform`} />
            <span className="text-xs font-bold mt-1 tracking-wider uppercase">Push</span>
          </div>

          <div className="mt-4 text-center">
            <span className="text-3xl font-extrabold text-white tracking-tight">{compressionsCount}</span>
            <span className="text-xs text-slate-400 block uppercase font-medium">Compressions Given</span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={toggleRun}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Pause Metronome' : 'Start CPR Pace'}</span>
            </button>

            <button
              onClick={handleReset}
              title="Reset Count"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span>Tempo:</span>
            {[100, 110, 120].map((rate) => (
              <button
                key={rate}
                onClick={() => setBpm(rate)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  bpm === rate ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rate} BPM
              </button>
            ))}
          </div>
        </div>

        {/* Life-Saving Hands-Only CPR Instructions */}
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-2.5 text-red-200">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-red-100 font-semibold mb-0.5">If adult is unresponsive & not breathing normally:</strong>
              1. Shout for help & call 911 immediately. Put phone on speaker.
            </div>
          </div>

          <div className="p-2.5 bg-slate-800/50 rounded-lg">
            <span className="font-semibold text-slate-100 block mb-0.5">2. Hand Placement:</span>
            Place heel of one hand in the center of the chest. Place other hand on top, interlacing fingers.
          </div>

          <div className="p-2.5 bg-slate-800/50 rounded-lg">
            <span className="font-semibold text-slate-100 block mb-0.5">3. Push Hard & Fast:</span>
            Lock elbows and push at least 2 inches (5 cm) deep. Let chest fully recoil between pushes.
          </div>

          <div className="p-2.5 bg-slate-800/50 rounded-lg">
            <span className="font-semibold text-slate-100 block mb-0.5">4. Don't Stop:</span>
            Keep pushing to the beat until paramedics arrive, an AED is ready, or the person clearly wakes up.
          </div>
        </div>
      </div>
    </div>
  );
};
