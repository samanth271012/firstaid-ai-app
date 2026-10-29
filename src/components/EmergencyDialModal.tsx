import React, { useState } from 'react';
import { X, PhoneCall, AlertTriangle, ShieldAlert, MapPin, Globe } from 'lucide-react';

interface EmergencyDialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CountryHotline {
  country: string;
  code: string;
  policeFireAmbulance: string;
  flag: string;
}

const HOTLINES: CountryHotline[] = [
  { country: 'United States & Canada', code: 'US/CA', policeFireAmbulance: '911', flag: '🇺🇸' },
  { country: 'United Kingdom', code: 'UK', policeFireAmbulance: '999', flag: '🇬🇧' },
  { country: 'European Union (All EU)', code: 'EU', policeFireAmbulance: '112', flag: '🇪🇺' },
  { country: 'Australia', code: 'AU', policeFireAmbulance: '000', flag: '🇦🇺' },
  { country: 'New Zealand', code: 'NZ', policeFireAmbulance: '111', flag: '🇳🇿' },
  { country: 'India', code: 'IN', policeFireAmbulance: '112', flag: '🇮🇳' },
  { country: 'Japan', code: 'JP', policeFireAmbulance: '119', flag: '🇯🇵' },
];

export const EmergencyDialModal: React.FC<EmergencyDialModalProps> = ({ isOpen, onClose }) => {
  const [selectedHotline, setSelectedHotline] = useState<CountryHotline>(HOTLINES[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-600 rounded-xl text-white shadow-lg shadow-red-600/30">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Emergency Services Hotline</h2>
            <p className="text-xs text-red-300 font-medium">Immediate connection to emergency first responders</p>
          </div>
        </div>

        {/* Big One-Click Call Button */}
        <div className="my-5 p-5 bg-red-950/40 border border-red-600/60 rounded-2xl text-center">
          <span className="text-xs text-red-300 font-semibold uppercase tracking-wider block mb-2">
            Selected Region: {selectedHotline.country}
          </span>
          <a
            href={`tel:${selectedHotline.policeFireAmbulance}`}
            className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-2xl rounded-xl shadow-xl shadow-red-600/40 transition-all transform hover:scale-[1.01]"
          >
            <PhoneCall className="w-6 h-6 fill-white" />
            <span>Call {selectedHotline.policeFireAmbulance} Now</span>
          </a>
          <p className="text-[11px] text-slate-300 mt-2">
            Tap to open your phone's dialer immediately.
          </p>
        </div>

        {/* Change Region Selector */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch Country / Emergency Number:</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {HOTLINES.map((h) => (
              <button
                key={h.code}
                onClick={() => setSelectedHotline(h)}
                className={`p-2 rounded-lg text-left text-xs border flex items-center justify-between transition-all ${
                  selectedHotline.code === h.code
                    ? 'bg-red-950/60 border-red-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{h.flag}</span>
                  <span className="truncate">{h.code}</span>
                </span>
                <span className="font-mono font-bold text-red-400">{h.policeFireAmbulance}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Specialized Hotline: Poison Control */}
        <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-xl mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-200 block">Poison Control (US)</span>
              <span className="text-slate-300 text-[11px]">Free, 24/7 toxic ingestion guidance</span>
            </div>
          </div>
          <a
            href="tel:18002221222"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
          >
            1-800-222-1222
          </a>
        </div>

        {/* What to tell the dispatcher */}
        <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>When the dispatcher answers, clearly state:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 pl-1">
            <li>Your exact location (address, landmark, cross streets)</li>
            <li>What happened and how many people are hurt</li>
            <li>Whether the person is conscious and breathing</li>
            <li>Do not hang up until the operator tells you to</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
