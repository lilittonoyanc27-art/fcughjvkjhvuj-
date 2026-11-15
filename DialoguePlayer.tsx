import React, { useEffect, useState } from 'react';
import {
  Play,
  SkipForward,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { CefrLevel, Dialogue, EvaluateResult } from './types';
import { PhraseText } from './PhraseText';
import { VoiceInputBar } from './VoiceInputBar';
import { evaluateStudentResponse } from './aiClient';
import { speakSpanish, stopSpeaking } from './speech';

type DialogueMode = 'listen' | 'complete' | 'speak';

interface DialoguePlayerProps {
  dialogue: Dialogue;
  locationTitleEs: string;
  locationTitleHy: string;
  activeLevel: CefrLevel;
  onRevealPhrase: (phraseEs: string) => void;
  onCompleteDialogue: (dialogueId: string, mode: DialogueMode, xpAmount: number) => void;
  onRecordIndependentAnswer: () => void;
  onBack: () => void;
}

export const DialoguePlayer: React.FC<DialoguePlayerProps> = ({
  dialogue,
  locationTitleEs,
  locationTitleHy,
  activeLevel,
  onRevealPhrase,
  onCompleteDialogue,
  onRecordIndependentAnswer,
  onBack,
}) => {
  const [mode, setMode] = useState<DialogueMode>('listen');

  // Mode 1 state: Listen & Comprehend
  const [visibleCount, setVisibleCount] = useState(2);
  const [playingAll, setPlayingAll] = useState(false);
  const [compAnswers, setCompAnswers] = useState<Record<string, number>>({});
  const [mode1Completed, setMode1Completed] = useState(false);

  // Mode 2 state: Complete the dialogue
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

  // Mode 3 state: Ahora te toca a ti
  const studentTurnIndices = dialogue.lines
    .map((line, idx) => (line.speaker === 'student' ? idx : -1))
    .filter((idx) => idx !== -1);
  const [turnStep, setTurnStep] = useState(0);
  const [hintTier, setHintTier] = useState<0 | 1 | 2>(0);
  const [userInput, setUserInput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluateResult | null>(null);
  const [submittedTurnText, setSubmittedTurnText] = useState('');
  const [mode3Done, setMode3Done] = useState(false);

  useEffect(() => {
    setVisibleCount(2);
    setPlayingAll(false);
    setCompAnswers({});
    setMode1Completed(false);
    setSelectedOptions({});
    setTurnStep(0);
    setHintTier(0);
    setUserInput('');
    setEvalResult(null);
    setSubmittedTurnText('');
    setMode3Done(false);
    stopSpeaking();
  }, [dialogue.id]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handlePlayAll = () => {
    if (playingAll) {
      stopSpeaking();
      setPlayingAll(false);
      return;
    }
    setVisibleCount(dialogue.lines.length);
    setPlayingAll(true);
    let idx = 0;
    const speakNext = () => {
      if (idx >= dialogue.lines.length) {
        setPlayingAll(false);
        return;
      }
      const line = dialogue.lines[idx];
      idx += 1;
      speakSpanish(line.es, {
        rate: 0.94,
        onEnd: () => {
          setTimeout(speakNext, 350);
        },
      });
    };
    speakNext();
  };

  const handleSelectCompAnswer = (qId: string, optIdx: number) => {
    const next = { ...compAnswers, [qId]: optIdx };
    setCompAnswers(next);
    if (Object.keys(next).length === dialogue.comprehension.length && !mode1Completed) {
      setMode1Completed(true);
      onCompleteDialogue(dialogue.id, 'listen', 25);
    }
  };

  const studentLineIds = dialogue.lines.filter((l) => l.speaker === 'student').map((l) => l.id);
  const allMode2Answered = studentLineIds.every((id) => selectedOptions[id] !== undefined);

  const handleSelectMode2 = (lineId: string, optIdx: number) => {
    const next = { ...selectedOptions, [lineId]: optIdx };
    setSelectedOptions(next);
    const doneNow = studentLineIds.every((id) => next[id] !== undefined);
    if (doneNow) {
      onCompleteDialogue(dialogue.id, 'complete', 35);
    }
  };

  // Mode 3 active line calculation
  const activeStudentIndex = studentTurnIndices[turnStep] ?? 0;
  const activeStudentLine = dialogue.lines[activeStudentIndex];
  const prevCharacterLine =
    activeStudentIndex > 0 ? dialogue.lines[activeStudentIndex - 1] : null;

  const handleHintClick = () => {
    setHintTier((prev) => (prev === 0 ? 1 : 2));
  };

  const handleSubmitFreeResponse = async () => {
    if (!userInput.trim() || !activeStudentLine) return;
    setEvaluating(true);
    setSubmittedTurnText(userInput.trim());

    const result = await evaluateStudentResponse({
      userResponse: userInput.trim(),
      promptEs: prevCharacterLine ? prevCharacterLine.es : dialogue.titleEs,
      sampleAnswerEs: activeStudentLine.es,
      expectedKeywords: activeStudentLine.expectedKeywords,
      level: activeLevel || dialogue.level,
      contextHy: dialogue.summaryHy,
    });

    setEvaluating(false);
    setEvalResult(result);
    if (result.accepted) {
      onRecordIndependentAnswer();
    }
  };

  const handleNextStudentTurn = () => {
    setUserInput('');
    setEvalResult(null);
    setSubmittedTurnText('');
    setHintTier(0);
    if (turnStep + 1 < studentTurnIndices.length) {
      setTurnStep(turnStep + 1);
    } else {
      setMode3Done(true);
      onCompleteDialogue(dialogue.id, 'speak', 60);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5B60] mb-1.5">
              <span>{locationTitleEs} · {locationTitleHy}</span>
              <span aria-hidden="true">·</span>
              <span>Situación {dialogue.situationNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#7C1D36] font-bold">Nivel {dialogue.level}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#1E1417]">{dialogue.titleEs}</h2>
            <p className="text-sm text-[#4A3B3F] mt-1">{dialogue.titleHy} — {dialogue.summaryHy}</p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="min-h-10 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FAF7F2] text-[#1E1417] hover:border-[#7C1D36] border border-[#E2D5CC] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Volver a la escena
          </button>
        </div>

        {/* Mode Segmented Control */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F5EFEA] p-1.5 rounded-xl border border-[#E2D5CC]">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setPlayingAll(false);
              setMode('listen');
            }}
            className={`min-h-11 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'listen'
                ? 'bg-[#7C1D36] text-white'
                : 'text-[#4A3B3F] hover:text-[#1E1417]'
            }`}
          >
            1. Escucha y comprende
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setPlayingAll(false);
              setMode('complete');
            }}
            className={`min-h-11 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'complete'
                ? 'bg-[#FACC15] text-[#1E1417]'
                : 'text-[#4A3B3F] hover:text-[#1E1417]'
            }`}
          >
            2. Completa el diálogo
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setPlayingAll(false);
              setMode('speak');
            }}
            className={`min-h-11 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'speak'
                ? 'bg-[#EA580C] text-white'
                : 'text-[#4A3B3F] hover:text-[#1E1417]'
            }`}
          >
            3. Ahora te toca a ti
          </button>
        </div>
      </div>

      {/* MODE 1: ESCUCHA Y COMPRENDE */}
      {mode === 'listen' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EFE5DE]">
              <p className="text-sm text-[#4A3B3F]">
                Սեղմիր ցանկացած իսպաներեն նախադասության վրա՝ հայերեն թարգմանությունը բացելու համար։
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="min-h-10 px-4 py-2 rounded-xl text-sm font-bold bg-[#7C1D36] text-white hover:bg-[#64152A] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{playingAll ? 'Detener audio' : 'Escuchar todo'}</span>
                </button>
                {visibleCount < dialogue.lines.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => Math.min(c + 2, dialogue.lines.length))}
                    className="min-h-10 px-4 py-2 rounded-xl text-sm font-bold bg-[#FACC15] text-[#1E1417] hover:bg-[#EAB308] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Siguiente réplica</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {dialogue.lines.slice(0, visibleCount).map((line) => {
                const isStudent = line.speaker === 'student';
                return (
                  <div
                    key={line.id}
                    className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl w-full sm:w-[88%] rounded-2xl p-4 border ${
                        isStudent
                          ? 'bg-[#FDF2F4] border-[#F2CDD6]'
                          : 'bg-[#FAF7F2] border-[#E2D5CC]'
                      }`}
                    >
                      <div className={`text-xs font-extrabold mb-1.5 ${isStudent ? 'text-[#7C1D36]' : 'text-[#EA580C]'}`}>
                        {line.speakerLabel}
                      </div>
                      <PhraseText
                        es={line.es}
                        hy={line.hy}
                        onRevealTranslation={onRevealPhrase}
                        showSlowButton
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCount < dialogue.lines.length && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(dialogue.lines.length)}
                  className="text-sm font-bold text-[#7C1D36] hover:text-[#EA580C] underline underline-offset-4 cursor-pointer"
                >
                  Mostrar todo el diálogo ({dialogue.lines.length} réplicas)
                </button>
              </div>
            )}
          </div>

          {/* 3 Comprehension Questions */}
          <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 md:p-6 space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-[#1E1417]">
                Preguntas de comprensión · Հասկանալու ստուգում
              </h3>
              <p className="text-sm text-[#4A3B3F]">
                Պատասխանիր երեք հարցերին՝ ամրապնդելու իրավիճակի ընկալումը։
              </p>
            </div>

            <div className="space-y-4">
              {dialogue.comprehension.map((q, qIdx) => {
                const chosen = compAnswers[q.id];
                const isAnswered = chosen !== undefined;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 space-y-3"
                  >
                    <div className="text-sm font-bold text-[#1E1417]">
                      {qIdx + 1}. {q.questionEs}
                    </div>
                    <div className="text-xs text-[#4A3B3F]">{q.questionHy}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const selected = chosen === optIdx;
                        let btnStyle =
                          'bg-white border-[#E2D5CC] text-[#1E1417] hover:border-[#EA580C]';
                        if (isAnswered) {
                          if (opt.isCorrect) {
                            btnStyle = 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] font-semibold';
                          } else if (selected) {
                            btnStyle = 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]';
                          }
                        }
                        return (
                          <button
                            key={opt.es}
                            type="button"
                            onClick={() => handleSelectCompAnswer(q.id, optIdx)}
                            className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                          >
                            <span>{opt.es}</span>
                            {isAnswered && opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                            )}
                            {isAnswered && selected && !opt.isCorrect && (
                              <XCircle className="w-4 h-4 text-[#EA580C] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {isAnswered && (
                      <p className="text-xs font-medium text-[#7C1D36] pt-1">{q.explanationHy}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {mode1Completed && (
              <div className="rounded-xl bg-[#F0FDF4] border border-[#86EFAC] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-[#166534] font-semibold">
                  Հրաշալի է։ Ավարտեցիր «Escucha y comprende» փուլը (+25 XP)։ Այժմ անցիր երկրորդ կամ երրորդ ռեժիմին։
                </div>
                <button
                  type="button"
                  onClick={() => setMode('speak')}
                  className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] text-white font-bold text-sm hover:bg-[#C2410C] cursor-pointer"
                >
                  Ir a «Ahora te toca a ti»
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: COMPLETA EL DIÁLOGO */}
      {mode === 'complete' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 md:p-6 space-y-4">
          <div className="pb-3 border-b border-[#EFE5DE]">
            <h3 className="text-lg font-extrabold text-[#1E1417]">Completa el diálogo · Լրացրու երկխոսությունը</h3>
            <p className="text-sm text-[#4A3B3F]">
              Ընտրիր ամենատեղին պատասխանը յուրաքանչյուր բաց թողնված քայլում և կարդա հայերեն բացատրությունը։
            </p>
          </div>

          <div className="space-y-4">
            {dialogue.lines.map((line) => {
              if (line.speaker === 'character') {
                return (
                  <div key={line.id} className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4">
                    <div className="text-xs font-bold text-[#EA580C] mb-1">{line.speakerLabel}</div>
                    <PhraseText es={line.es} hy={line.hy} onRevealTranslation={onRevealPhrase} />
                  </div>
                );
              }

              const chosenIdx = selectedOptions[line.id];
              const options = line.options ?? [];
              const chosenOpt = chosenIdx !== undefined ? options[chosenIdx] : null;

              return (
                <div
                  key={line.id}
                  className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-4 space-y-3"
                >
                  <div className="text-xs font-bold text-[#7C1D36]">
                    Tú · Ընտրիր քո պատասխանը
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {options.map((opt, idx) => {
                      const isSelected = chosenIdx === idx;
                      let cls =
                        'bg-white border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36]';
                      if (chosenIdx !== undefined) {
                        if (opt.isBest) {
                          cls = 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] font-semibold';
                        } else if (isSelected) {
                          cls = 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]';
                        }
                      }
                      return (
                        <button
                          key={opt.es}
                          type="button"
                          onClick={() => handleSelectMode2(line.id, idx)}
                          className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${cls}`}
                        >
                          <span>{opt.es}</span>
                          {chosenIdx !== undefined && opt.isBest && (
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                          )}
                          {chosenIdx !== undefined && isSelected && !opt.isBest && (
                            <XCircle className="w-4 h-4 text-[#EA580C] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {chosenOpt && (
                    <div className="rounded-lg bg-white border border-[#E6DCD5] p-3 text-sm text-[#1E1417] flex items-start justify-between gap-3">
                      <span>{chosenOpt.explanationHy}</span>
                      <button
                        type="button"
                        onClick={() => speakSpanish(line.es)}
                        className="p-2 rounded-lg bg-[#FDF2F4] text-[#7C1D36] hover:bg-[#F9DDE3] shrink-0 cursor-pointer"
                        title="Լսել ճիշտ տարբերակը"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allMode2Answered && (
            <div className="rounded-xl bg-[#FEFCE8] border border-[#FACC15] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[#1E1417] font-semibold">
                Ապրես։ Լրացրիր ամբողջ երկխոսությունը (+35 XP)։ Այժմ փորձիր պատասխանել ինքնուրույն՝ առանց պատրաստի տարբերակների։
              </div>
              <button
                type="button"
                onClick={() => setMode('speak')}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] text-white font-bold text-sm hover:bg-[#C2410C] cursor-pointer"
              >
                Ahora te toca a ti
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: AHORA TE TOCA A TI */}
      {mode === 'speak' && (
        <div className="rounded-2xl bg-white border border-[#F2CDD6] shadow-xs p-5 md:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#EA580C]">
                Práctica de conversación · {activeLevel} · Paso {Math.min(turnStep + 1, studentTurnIndices.length)} de {studentTurnIndices.length}
              </div>
              <h3 className="text-xl font-extrabold text-[#1E1417] mt-0.5">
                Ahora te toca a ti — Հիմա քո հերթն է
              </h3>
            </div>
            <div className="text-xs text-[#6E5B60]">
              Կառուցիր քո սեփական պատասխանը (պատրաստի տարբերակները թաքցված են)
            </div>
          </div>

          {!mode3Done && activeStudentLine ? (
            <div className="space-y-5">
              {/* Interlocutor Prompt Card */}
              {prevCharacterLine ? (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-2">
                  <div className="text-xs font-bold text-[#7C1D36]">
                    {prevCharacterLine.speakerLabel}
                  </div>
                  <PhraseText
                    es={prevCharacterLine.es}
                    hy={prevCharacterLine.hy}
                    onRevealTranslation={onRevealPhrase}
                    textSize="lg"
                    showSlowButton
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-2">
                  <div className="text-xs font-bold text-[#7C1D36]">Situación inicial · Սկիզբ</div>
                  <p className="text-base text-[#1E1417]">{dialogue.summaryHy}</p>
                </div>
              )}

              {/* Progressive Hint Box */}
              {hintTier > 0 && (
                <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-4 space-y-2">
                  <div className="text-xs font-bold text-[#854D0E]">
                    Pista · Հուշում ({hintTier === 1 ? 'Հիմնական բառ և ուղղություն' : 'Նախադասության սկիզբ'})
                  </div>
                  <p className="text-sm text-[#1E1417]">
                    {activeStudentLine.hintHy}
                  </p>
                  {activeStudentLine.hintWord && (
                    <p className="text-sm text-[#4A3B3F]">
                      Բանալի բառ՝ <strong className="text-[#7C1D36]">{activeStudentLine.hintWord}</strong>
                    </p>
                  )}
                  {hintTier === 2 && activeStudentLine.hintStarter && (
                    <p className="text-sm text-[#EA580C] font-bold">
                      Սկսիր այսպես՝ «{activeStudentLine.hintStarter}»
                    </p>
                  )}
                </div>
              )}

              {/* Student Voice + Text Input */}
              <VoiceInputBar
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleSubmitFreeResponse}
                loading={evaluating}
                onHintClick={handleHintClick}
                hintLabel={hintTier === 0 ? 'Pista' : hintTier === 1 ? 'Más pista' : 'Pista'}
                placeholder="Ասա կամ գրիր քո պատասխանը իսպաներենով..."
              />

              {/* Evaluation Feedback */}
              {evalResult && (
                <div
                  className={`rounded-2xl p-5 border space-y-3 ${
                    evalResult.accepted
                      ? evalResult.quality === 'excelente'
                        ? 'bg-[#F0FDF4] border-[#86EFAC]'
                        : 'bg-[#FEFCE8] border-[#FDE047]'
                      : 'bg-[#FFF7ED] border-[#FDBA74]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#1E1417] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#EA580C]" />
                      <span>
                        {evalResult.quality === 'excelente'
                          ? '¡Excelente! · Հիանալի է'
                          : evalResult.quality === 'bueno'
                            ? '¡Muy bien! · Շատ լավ է'
                            : evalResult.quality === 'mejorable'
                              ? 'Se entiende, pero puedes mejorarlo · Կարող ես բարելավել'
                              : 'Inténtalo otra vez · Փորձիր կրկին'}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-[#6E5B60]">
                      {evalResult.usedFallback ? 'Անցանց լեզվական ստուգում' : 'AI վերլուծություն'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white p-3 border border-[#E6DCD5]">
                      <div className="text-xs text-[#6E5B60] mb-1">Tu respuesta · Քո պատասխանը</div>
                      <div className="text-[#1E1417]">{submittedTurnText}</div>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-[#F2CDD6]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-[#7C1D36] font-bold">
                          Mejor / Natural · Ավելի բնական տարբերակ
                        </span>
                        <button
                          type="button"
                          onClick={() => speakSpanish(evalResult.naturalVersion)}
                          className="text-[#7C1D36] hover:text-[#EA580C] cursor-pointer"
                          title="Լսել բնական տարբերակը"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[#1E1417] font-semibold">{evalResult.naturalVersion}</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#1E1417] leading-relaxed">{evalResult.feedbackHy}</p>

                  {evalResult.accepted && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextStudentTurn}
                        className="min-h-10 px-5 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-sm hover:bg-[#64152A] flex items-center gap-2 cursor-pointer"
                      >
                        <span>
                          {turnStep + 1 < studentTurnIndices.length
                            ? 'Siguiente turno'
                            : 'Finalizar diálogo'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] p-6 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
              <h4 className="text-xl font-extrabold text-[#1E1417]">
                ¡Diálogo completado con tu propia voz! (+60 XP)
              </h4>
              <p className="text-sm text-[#4A3B3F] max-w-xl mx-auto">
                Շնորհավորում եմ։ Դու ինքնուրույն անցար ամբողջ իրավիճակը իսպաներենով՝ արձագանքելով զրուցակցիդ հարցերին։
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTurnStep(0);
                    setMode3Done(false);
                    setEvalResult(null);
                    setUserInput('');
                  }}
                  className="min-h-10 px-4 py-2 rounded-xl bg-white border border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36] text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practicar otra vez</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="min-h-10 px-5 py-2 rounded-xl bg-[#FACC15] text-[#1E1417] hover:bg-[#EAB308] text-sm font-bold cursor-pointer"
                >
                  Elegir otra situación
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
