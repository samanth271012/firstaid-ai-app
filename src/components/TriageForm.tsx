import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, MicOff, X, Sparkles, AlertCircle, Eye, RefreshCw, Send } from 'lucide-react';

interface TriageFormProps {
  onSubmit: (data: { text: string; imageBase64?: string; mimeType?: string }) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  {
    title: '🩸 Shallow Kitchen Cut',
    text: 'Accidentally nicked thumb with clean kitchen chef knife 5 minutes ago. Shallow cut about 1 cm long. Minor slow bleeding, cleaned with water.',
  },
  {
    title: '🔥 Hot Water Burn',
    text: 'Spilled boiling tea on my wrist 2 minutes ago. Skin is red and stinging intensely. No blisters yet, feels hot to touch.',
  },
  {
    title: '🐝 Insect Sting',
    text: 'Was stung by a bee on my forearm 10 minutes ago. Stinger was removed. Red area the size of a coin, itchy and mildly swollen, but breathing is totally normal.',
  },
  {
    title: '🦶 Twisted Ankle',
    text: 'Tripped on curb while jogging 20 minutes ago. Heard no pop, but outer ankle is swollen and sore to put full weight on.',
  },
  {
    title: '🚨 Severe Spurting Cut',
    text: 'Broken glass fell on forearm. Deep gaping laceration, heavy pulsing dark red blood soaking through towels rapidly. Feeling lightheaded.',
  },
];

export const TriageForm: React.FC<TriageFormProps> = ({ onSubmit, isLoading }) => {
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDescription((prev) => {
          const base = prev.trim();
          return base ? `${base} ${transcript}` : transcript;
        });
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Could not start voice recognition', err);
      }
    }
  };

  // Compress image before setting
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const MAX_HEIGHT = 640;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setImageDataUrl(compressedDataUrl);
          setImageMimeType('image/jpeg');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !imageDataUrl) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    onSubmit({
      text: description.trim(),
      imageBase64: imageDataUrl || undefined,
      mimeType: imageMimeType,
    });
  };

  const handleClearImage = () => {
    setImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Injury Assessment & Triage</span>
          </h2>
          <p className="text-xs text-slate-400">
            Submit a photo, a description of the symptoms, or both for immediate guidance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Multimodal Photo Input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Injury Photo (Optional but Recommended)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Visual redness, swelling, cuts & burns analysis
            </span>
          </label>

          {imageDataUrl ? (
            <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
              <img
                src={imageDataUrl}
                alt="Injury upload preview"
                className="w-20 h-20 object-cover rounded-lg border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate">Photo ready for analysis</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  Visual characteristics will be examined
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Take Photo</span>
                  </button>
                </div>

                <span className="text-xs text-slate-500">or drag & drop wound/injury photo here</span>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Text Description & Voice Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="symptom-input" className="text-xs font-semibold text-slate-300">
              Describe What Happened & Symptoms
            </label>

            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Dictate symptoms hands-free"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-400" />}
                <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              id="symptom-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cut finger while chopping carrots, bleeding moderately, washed with tap water 5 min ago. Throbbing pain 4/10..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
            Or test with a sample scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SCENARIOS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDescription(preset.text)}
                className="text-[11px] px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors text-left"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || (!description.trim() && !imageDataUrl)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
              isLoading || (!description.trim() && !imageDataUrl)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-600/25 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                <span>Triaging Injury & Safety Checks...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Get Immediate First-Aid Guidance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
