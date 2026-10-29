import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Droplet, Flame, Snowflake, CheckCircle2 } from 'lucide-react';

interface PresetTimer {
  id: string;
  label: string;
  minutes: number;
  icon: 'droplet' | 'flame' | 'snowflake';
  description: string;
}

const PRESETS: PresetTimer[] = [
  {
    id: 'pressure',
    label: 'Bleeding Pressure',
    minutes: 10,
    icon: 'droplet',
    description: 'Keep firm continuous pressure without lifting the gauze for 10 min.',
  },
  {
    id: 'burn-water',
    label: 'Cool Water on Burn',
    minutes: 15,
    icon: 'flame',
    description: 'Run cool (not ice) tap water gently over burn for 15 min.',
  },
  {
    id: 'ice-pack',
    label: 'Ice / Cold Compress',
    minutes: 20,
    icon: 'snowflake',
    description: 'Apply wrapped ice pack for 20 min on, then 20 min off.',
  },
];

export const InteractiveTimers: React.FC = () => {
  const [activePreset, setActivePreset] = useState<PresetTimer>(PRESETS[0]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(PRESETS[0].minutes * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const now = audioCtxRef.current.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtxRef.current!.createOscillator();
        const gain = audioCtxRef.current!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.2, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtxRef.current!.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setCompleted(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const selectPreset = (preset: PresetTimer) => {
    setActivePreset(preset);
    setSecondsRemaining(preset.minutes * 60);
    setIsActive(false);
    setCompleted(false);
  };

  const toggleTimer = () => {
    if (!isActive && !audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsRemaining(activePreset.minutes * 60);
    setCompleted(false);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = activePreset.minutes * 60;
  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-xl">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-slate-100">First-Aid Action Timers</h3>
          <p className="text-xs text-slate-400">Accurate timing for bleeding control, burns, and cold therapy</p>
        </div>
      </div>

      {/* Preset selection tabs */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {PRESETS.map((preset) => {
          const isSelected = activePreset.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1">
                {preset.icon === 'droplet' && <Droplet className="w-3.5 h-3.5 text-red-400" />}
                {preset.icon === 'flame' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                {preset.icon === 'snowflake' && <Snowflake className="w-3.5 h-3.5 text-sky-400" />}
                <span className="truncate">{preset.label}</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-200">{preset.minutes} min</span>
            </button>
          );
        })}
      </div>

      {/* Active Timer Display */}
      <div className="mt-5 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
        <p className="text-xs text-slate-300 font-medium mb-3">{activePreset.description}</p>

        <div className="relative inline-flex items-center justify-center my-2">
          {/* Circular progress bar / digital clock */}
          <div className="text-5xl font-mono font-extrabold tracking-wider text-white">
            {formattedTime}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
          <div
            className="bg-blue-500 h-full transition-all duration-500 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {completed && (
          <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Time complete! Re-assess the injury now.</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isActive ? 'Pause' : secondsRemaining < totalSeconds ? 'Resume' : 'Start Timer'}</span>
          </button>

          <button
            onClick={resetTimer}
            title="Reset timer"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
