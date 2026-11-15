import React, { useState } from 'react';
import { Volume2, Languages, RotateCcw } from 'lucide-react';
import { speakSpanish } from './speech';

interface PhraseTextProps {
  es: string;
  hy: string;
  onRevealTranslation?: (phraseEs: string) => void;
  className?: string;
  textSize?: 'sm' | 'base' | 'lg';
  showSlowButton?: boolean;
}

export const PhraseText: React.FC<PhraseTextProps> = ({
  es,
  hy,
  onRevealTranslation,
  className = '',
  textSize = 'base',
  showSlowButton = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleToggle = () => {
    const next = !revealed;
    setRevealed(next);
    if (next && onRevealTranslation) {
      onRevealTranslation(es);
    }
  };

  const handleSpeak = (e: React.MouseEvent, rate = 0.96) => {
    e.stopPropagation();
    speakSpanish(es, {
      rate,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  };

  const sizeClass =
    textSize === 'lg'
      ? 'text-lg leading-relaxed'
      : textSize === 'sm'
        ? 'text-sm leading-relaxed'
        : 'text-[15px] leading-relaxed';

  return (
    <div className={`group ${className}`}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={handleToggle}
          className={`text-left flex-1 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-[#F5EFEA] focus-visible:outline-2 focus-visible:outline-[#7C1D36] cursor-pointer ${sizeClass}`}
          title="Սեղմիր՝ հայերեն թարգմանությունը տեսնելու համար"
        >
          <span className="text-[#1E1417] font-semibold">{es}</span>
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-[#7C1D36] group-hover:text-[#EA580C]">
            <Languages className="w-3.5 h-3.5 inline" />
            <span>{revealed ? 'Թաքցնել' : 'Հայերեն'}</span>
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={(e) => handleSpeak(e, 0.96)}
            aria-label="Escuchar pronunciación en español"
            title="Լսել իսպաներեն արտասանությունը"
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
              speaking
                ? 'bg-[#EA580C] border-[#EA580C] text-white'
                : 'bg-[#FAF7F2] border-[#E2D5CC] text-[#7C1D36] hover:bg-[#FEF3C7] hover:border-[#FACC15]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {showSlowButton && (
            <button
              type="button"
              onClick={(e) => handleSpeak(e, 0.72)}
              aria-label="Escuchar despacio"
              title="Լսել դանդաղ (կրկնելու համար)"
              className="w-9 h-9 rounded-lg flex items-center justify-center border bg-[#FAF7F2] border-[#E2D5CC] text-[#4A3B3F] hover:text-[#7C1D36] hover:border-[#EA580C] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {revealed && (
        <div className="mt-2 pt-2 border-t border-[#E6DCD5] text-sm text-[#7C1D36] font-medium leading-relaxed">
          {hy}
        </div>
      )}
    </div>
  );
};
