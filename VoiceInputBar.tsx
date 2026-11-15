import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Lightbulb, Loader2 } from 'lucide-react';
import { isSpeechRecognitionSupported, startSpanishDictation } from './speech';

interface VoiceInputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onHintClick?: () => void;
  hintLabel?: string;
}

export const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  placeholder = 'Escribe o di tu respuesta en español...',
  submitLabel = 'Responder',
  onHintClick,
  hintLabel = 'Pista',
}) => {
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      if (stopRef.current) {
        stopRef.current();
      }
    };
  }, []);

  const toggleMic = () => {
    if (listening) {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
      setListening(false);
      return;
    }

    setMicNote(null);
    if (!speechSupported) {
      setMicNote('Այս դիտարկիչում խոսափողով ճանաչումը հասանելի չէ։ Գրիր պատասխանդ տեքստով։');
      return;
    }

    setListening(true);
    const stop = startSpanishDictation({
      onTranscript: (text) => {
        onChange(text);
      },
      onError: (msgHy) => {
        setMicNote(msgHy);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        stopRef.current = null;
      },
    });
    stopRef.current = stop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl bg-white border border-[#D9C8BE] p-3 focus-within:border-[#7C1D36] transition-colors shadow-xs">
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder={placeholder}
          className="w-full bg-transparent text-[#1E1417] placeholder:text-[#8A757A] text-[15px] leading-relaxed resize-none focus:outline-none"
        />
        <div className="mt-2 pt-2 border-t border-[#EFE5DE] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              disabled={disabled || loading}
              className={`min-h-10 px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                listening
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-[#FAF7F2] text-[#1E1417] hover:bg-[#FEF3C7] border border-[#E2D5CC]'
              }`}
              title="Խոսել իսպաներեն (es-ES)"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#7C1D36]" />}
              <span>{listening ? 'Լսում եմ… Կանգնեցնել' : 'Խոսել'}</span>
            </button>

            {onHintClick && (
              <button
                type="button"
                onClick={onHintClick}
                disabled={disabled || loading}
                className="min-h-10 px-3.5 py-2 rounded-lg text-sm font-semibold bg-[#FEFCE8] text-[#854D0E] hover:bg-[#FEF08A] border border-[#FDE047] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-[#EA580C]" />
                <span>{hintLabel}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading || !value.trim()}
            className="min-h-10 px-5 py-2 rounded-lg text-sm font-bold bg-[#7C1D36] text-white hover:bg-[#64152A] disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{submitLabel}</span>
          </button>
        </div>
      </div>

      {listening && (
        <p className="text-xs font-medium text-[#7C1D36]">
          Խոսափողը միացված է (es-ES). Խոսիր պարզ իսպաներենով՝ խոսքդ ավտոմատ կվերածվի տեքստի։
        </p>
      )}

      {micNote && (
        <p className="text-xs text-[#9A3412] bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-3 py-2">
          {micNote}
        </p>
      )}
    </div>
  );
};
