import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Shuffle,
  Puzzle,
  Timer,
  SearchCheck,
  Volume2,
  Lightbulb,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Mic,
} from 'lucide-react';
import {
  SPEAK_TO_CONTINUE_STORIES,
  SURPRISE_SCENARIOS,
  WHAT_WOULD_YOU_DO_ITEMS,
} from './dataGamesPart1';
import {
  ERROR_DETECTIVE_ITEMS,
  QUICK_REPLY_ITEMS,
  SENTENCE_TASKS,
} from './dataGamesPart2';
import { LOCATIONS } from './dataLocations';
import { CefrLevel, EvaluateResult, LocationId } from './types';
import { VoiceInputBar } from './VoiceInputBar';
import { PhraseText } from './PhraseText';
import { evaluateStudentResponse } from './aiClient';
import { speakSpanish, startSpanishDictation, isSpeechRecognitionSupported } from './speech';

type GameTab = 'continue' | 'whatwould' | 'surprise' | 'build' | 'quick' | 'detective';

interface GamesHubProps {
  activeLevel: CefrLevel;
  onRevealPhrase: (phraseEs: string) => void;
  onAwardProgress: (locId: LocationId, xp: number, isIndependent?: boolean, gameId?: string) => void;
}

export const GamesHub: React.FC<GamesHubProps> = ({
  activeLevel,
  onRevealPhrase,
  onAwardProgress,
}) => {
  const [gameTab, setGameTab] = useState<GameTab>('continue');
  const [locFilter, setLocFilter] = useState<'all' | LocationId>('all');

  // 1. Habla para continuar state
  const [storyIdx, setStoryIdx] = useState(0);
  const [storyStepIdx, setStoryStepIdx] = useState(0);
  const [storyMemory, setStoryMemory] = useState<string[]>([]);
  const [storyInput, setStoryInput] = useState('');
  const [storyEval, setStoryEval] = useState<EvaluateResult | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  // 2. ¿Qué harías tú? (40 items)
  const filteredWhatItems =
    locFilter === 'all'
      ? WHAT_WOULD_YOU_DO_ITEMS
      : WHAT_WOULD_YOU_DO_ITEMS.filter((i) => i.locationId === locFilter);
  const [whatIdx, setWhatIdx] = useState(0);
  const [whatInput, setWhatInput] = useState('');
  const [whatHintTier, setWhatHintTier] = useState<0 | 1 | 2>(0);
  const [whatAttempted, setWhatAttempted] = useState(false);
  const [whatShowSample, setWhatShowSample] = useState(false);
  const [whatEval, setWhatEval] = useState<EvaluateResult | null>(null);
  const [whatLoading, setWhatLoading] = useState(false);

  // 3. Diálogo sorpresa
  const [surpriseLoc, setSurpriseLoc] = useState<'all' | LocationId>('all');
  const [surpriseItem, setSurpriseItem] = useState(SURPRISE_SCENARIOS[0]);
  const [surpriseStage, setSurpriseStage] = useState<'twist' | 'done'>('twist');
  const [surpriseInput, setSurpriseInput] = useState('');
  const [surpriseEval, setSurpriseEval] = useState<EvaluateResult | null>(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  // 4. Construye la frase (50 tasks)
  const filteredSentences =
    locFilter === 'all'
      ? SENTENCE_TASKS
      : SENTENCE_TASKS.filter((s) => s.locationId === locFilter);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [pickedWordIndices, setPickedWordIndices] = useState<number[]>([]);
  const [sentenceChecked, setSentenceChecked] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [pronounceText, setPronounceText] = useState('');
  const [pronounceListening, setPronounceListening] = useState(false);
  const [pronounceNote, setPronounceNote] = useState('');
  const stopPronounceRef = useRef<(() => void) | null>(null);

  // 5. Responde rápido (15 / 30 / 60s)
  const [timerChoice, setTimerChoice] = useState<15 | 30 | 60>(30);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [quickIdx, setQuickIdx] = useState(0);
  const [quickInput, setQuickInput] = useState('');
  const [quickEval, setQuickEval] = useState<EvaluateResult | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  // 6. Detective de errores
  const filteredErrors =
    locFilter === 'all'
      ? ERROR_DETECTIVE_ITEMS
      : ERROR_DETECTIVE_ITEMS.filter((e) => e.locationId === locFilter);
  const [errorIdx, setErrorIdx] = useState(0);
  const [errorChoice, setErrorChoice] = useState<number | null>(null);

  // Reset indices safely when filter changes
  useEffect(() => {
    setWhatIdx(0);
    setWhatInput('');
    setWhatHintTier(0);
    setWhatAttempted(false);
    setWhatShowSample(false);
    setWhatEval(null);

    setSentenceIdx(0);
    setPickedWordIndices([]);
    setSentenceChecked('idle');
    setPronounceText('');
    setPronounceNote('');

    setErrorIdx(0);
    setErrorChoice(null);
  }, [locFilter]);

  // Quick reply countdown
  useEffect(() => {
    if (!timerActive) return;
    if (secondsLeft <= 0) {
      setTimerActive(false);
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, secondsLeft]);

  useEffect(() => {
    return () => {
      if (stopPronounceRef.current) stopPronounceRef.current();
    };
  }, []);

  // Helper to weave student's previous answer into Habla para continuar
  const currentStory = SPEAK_TO_CONTINUE_STORIES[storyIdx];
  const currentStoryStep = currentStory.steps[storyStepIdx];
  const extractCityFromAnswer = (ans: string): string => {
    const lower = ans.toLowerCase();
    if (lower.includes('barcelona')) return 'Barcelona';
    if (lower.includes('valencia')) return 'Valencia';
    if (lower.includes('sevilla')) return 'Sevilla';
    if (lower.includes('málaga') || lower.includes('malaga')) return 'Málaga';
    if (lower.includes('madrid')) return 'Madrid';
    return 'tu destino';
  };
  const resolvedStoryPromptEs = currentStoryStep.promptTemplateEs.replace(
    '{lastAnswer_city}',
    storyMemory[0] ? extractCityFromAnswer(storyMemory[0]) : 'Barcelona'
  );

  // Current items
  const currentWhat = filteredWhatItems[whatIdx % filteredWhatItems.length] ?? WHAT_WOULD_YOU_DO_ITEMS[0];
  const currentSentence = filteredSentences[sentenceIdx % filteredSentences.length] ?? SENTENCE_TASKS[0];
  const currentQuick = QUICK_REPLY_ITEMS[quickIdx % QUICK_REPLY_ITEMS.length];
  const currentError = filteredErrors[errorIdx % filteredErrors.length] ?? ERROR_DETECTIVE_ITEMS[0];

  const handlePickRandomSurprise = (loc: 'all' | LocationId) => {
    const pool = loc === 'all' ? SURPRISE_SCENARIOS : SURPRISE_SCENARIOS.filter((s) => s.locationId === loc);
    const others = pool.filter((s) => s.id !== surpriseItem.id);
    const source = others.length > 0 ? others : pool;
    const picked = source[Math.floor(Math.random() * source.length)];
    setSurpriseItem(picked);
    setSurpriseStage('twist');
    setSurpriseInput('');
    setSurpriseEval(null);
  };

  const assembledSentence = pickedWordIndices.map((idx) => currentSentence.words[idx]).join(' ');

  const normalizeCompare = (s: string) =>
    s
      .toLowerCase()
      .replace(/[¿?¡!.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const handleCheckSentence = () => {
    const ok = normalizeCompare(assembledSentence) === normalizeCompare(currentSentence.correctEs);
    setSentenceChecked(ok ? 'correct' : 'wrong');
    if (ok) {
      speakSpanish(currentSentence.correctEs);
      onAwardProgress(currentSentence.locationId, 15, false, `sentence-${currentSentence.id}`);
    }
  };

  const handlePronounceCheck = () => {
    if (pronounceListening) {
      if (stopPronounceRef.current) stopPronounceRef.current();
      setPronounceListening(false);
      return;
    }
    setPronounceNote('');
    if (!isSpeechRecognitionSupported()) {
      setPronounceNote('Այս դիտարկիչում խոսափողը հասանելի չէ։ Լսիր օրինակը և կրկնիր բարձրաձայն։');
      return;
    }
    setPronounceListening(true);
    stopPronounceRef.current = startSpanishDictation({
      onTranscript: (text) => setPronounceText(text),
      onError: (msg) => {
        setPronounceNote(msg);
        setPronounceListening(false);
      },
      onEnd: () => setPronounceListening(false),
    });
  };

  const gameTabs: Array<{ id: GameTab; label: string; sub: string; icon: React.ReactNode }> = [
    { id: 'continue', label: 'Habla para continuar', sub: 'Պատմություն', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'whatwould', label: '¿Qué harías tú?', sub: '40 իրավիճակ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'surprise', label: 'Diálogo sorpresa', sub: 'Անակնկալ', icon: <Shuffle className="w-4 h-4" /> },
    { id: 'build', label: 'Construye la frase', sub: '50 նախադասություն', icon: <Puzzle className="w-4 h-4" /> },
    { id: 'quick', label: 'Responde rápido', sub: 'Ժամաչափ', icon: <Timer className="w-4 h-4" /> },
    { id: 'detective', label: 'Detective de errores', sub: 'Սխալների որոնում', icon: <SearchCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Games Header & Selector */}
      <div className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417]">
              Juegos y retos de conversación · Խոսակցական խաղեր
            </h1>
            <p className="text-sm text-[#4A3B3F] mt-1">
              Զարգացրու արագ մտածելու, նախադասություն կազմելու և սխալները նկատելու հմտությունները։
            </p>
          </div>

          {(gameTab === 'whatwould' || gameTab === 'build' || gameTab === 'detective') && (
            <select
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value as 'all' | LocationId)}
              className="min-h-10 px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-sm text-[#1E1417] font-medium focus:outline-none focus:border-[#7C1D36]"
            >
              <option value="all">Todas las ubicaciones · Բոլոր վայրերը</option>
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.titleEs} ({l.titleHy})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {gameTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setGameTab(t.id)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                gameTab === t.id
                  ? 'bg-[#7C1D36] text-white border-[#7C1D36]'
                  : 'bg-[#FAF7F2] text-[#1E1417] border-[#E2D5CC] hover:border-[#EA580C]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {t.icon}
                <span className="truncate">{t.label}</span>
              </div>
              <div
                className={`text-[11px] mt-1 ${
                  gameTab === t.id ? 'text-[#FDE68A] font-medium' : 'text-[#6E5B60]'
                }`}
              >
                {t.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GAME 1: HABLA PARA CONTINUAR */}
      {gameTab === 'continue' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#EA580C]">
                Historia conectada · Սյուժեն հիշում է քո պատասխանները
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">
                {currentStory.titleEs} · {currentStory.titleHy}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {SPEAK_TO_CONTINUE_STORIES.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setStoryIdx(idx);
                    setStoryStepIdx(0);
                    setStoryMemory([]);
                    setStoryInput('');
                    setStoryEval(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    storyIdx === idx
                      ? 'bg-[#FACC15] text-[#1E1417] border-[#EAB308]'
                      : 'bg-[#FAF7F2] text-[#4A3B3F] border-[#E2D5CC] hover:border-[#EA580C]'
                  }`}
                >
                  {LOCATIONS.find((l) => l.id === st.locationId)?.titleEs}
                </button>
              ))}
            </div>
          </div>

          {/* Previous turns memory */}
          {storyMemory.length > 0 && (
            <div className="space-y-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4">
              <div className="text-xs text-[#6E5B60] font-bold">
                Historial de la escena · Նախորդ պատասխանները
              </div>
              {storyMemory.map((ans, idx) => (
                <div key={idx} className="text-xs text-[#1E1417]">
                  <span className="text-[#7C1D36] font-bold">Paso {idx + 1} (Tú): </span>
                  <span>{ans}</span>
                </div>
              ))}
            </div>
          )}

          {storyStepIdx < currentStory.steps.length ? (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#7C1D36]">
                Paso {storyStepIdx + 1} de {currentStory.steps.length} · {currentStory.characterRole}
              </div>

              <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5">
                <PhraseText
                  es={resolvedStoryPromptEs}
                  hy={currentStoryStep.promptHy}
                  onRevealTranslation={onRevealPhrase}
                  textSize="lg"
                  showSlowButton
                />
              </div>

              <VoiceInputBar
                value={storyInput}
                onChange={setStoryInput}
                loading={storyLoading}
                onHintClick={() => setStoryInput(currentStoryStep.hintHy)}
                hintLabel="Ver guía en armenio"
                onSubmit={async () => {
                  setStoryLoading(true);
                  const res = await evaluateStudentResponse({
                    userResponse: storyInput,
                    promptEs: resolvedStoryPromptEs,
                    sampleAnswerEs: currentStoryStep.sampleAnswerEs,
                    expectedKeywords: currentStoryStep.expectedKeywords,
                    level: activeLevel,
                    contextHy: currentStoryStep.promptHy,
                  });
                  setStoryLoading(false);
                  setStoryEval(res);
                  if (res.accepted) {
                    onAwardProgress(currentStory.locationId, 20, true);
                  }
                }}
              />

              {storyEval && (
                <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 space-y-2">
                  <div className="text-sm font-bold text-[#1E1417]">{storyEval.feedbackEs}</div>
                  <div className="text-sm text-[#4A3B3F]">{storyEval.feedbackHy}</div>
                  <div className="text-xs text-[#7C1D36] font-bold">Natural: {storyEval.naturalVersion}</div>
                  {storyEval.accepted && (
                    <button
                      type="button"
                      onClick={() => {
                        setStoryMemory((prev) => [...prev, storyInput.trim()]);
                        setStoryInput('');
                        setStoryEval(null);
                        if (storyStepIdx + 1 < currentStory.steps.length) {
                          setStoryStepIdx((s) => s + 1);
                        } else {
                          setStoryStepIdx(currentStory.steps.length);
                          onAwardProgress(currentStory.locationId, 30, false, currentStory.id);
                        }
                      }}
                      className="mt-2 px-4 py-2 rounded-lg bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continuar historia</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#F0FDF4] border border-[#86EFAC] p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
              <h3 className="text-xl font-extrabold text-[#1E1417]">¡Escena completada paso a paso!</h3>
              <p className="text-sm text-[#4A3B3F]">
                Կերպարները կապեցին քո պատասխանները և դու լիովին առաջ տարար խոսակցությունը։
              </p>
              <button
                type="button"
                onClick={() => {
                  setStoryStepIdx(0);
                  setStoryMemory([]);
                  setStoryInput('');
                  setStoryEval(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#FACC15] text-[#1E1417] font-bold text-sm cursor-pointer"
              >
                Repetir escena
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 2: ¿QUÉ HARÍAS TÚ? (40 SITUATIONS) */}
      {gameTab === 'whatwould' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs text-[#7C1D36] font-bold">
                Situación {(whatIdx % filteredWhatItems.length) + 1} de {filteredWhatItems.length} · Nivel {currentWhat.level}
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">¿Qué harías tú? · Ի՞նչ կանեիր դու</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakSpanish(`${currentWhat.storyEs} ${currentWhat.questionEs}`)}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#7C1D36]" />
                <span>Escuchar la situación</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWhatIdx((i) => (i + 1) % filteredWhatItems.length);
                  setWhatInput('');
                  setWhatHintTier(0);
                  setWhatAttempted(false);
                  setWhatShowSample(false);
                  setWhatEval(null);
                }}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] text-xs font-bold cursor-pointer"
              >
                Siguiente situación →
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-3">
            <PhraseText
              es={currentWhat.storyEs}
              hy={currentWhat.storyHy}
              onRevealTranslation={onRevealPhrase}
              textSize="lg"
            />
            <div className="text-base font-extrabold text-[#7C1D36] pt-1">{currentWhat.questionEs}</div>
          </div>

          {/* Progressive Hints */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWhatHintTier((t) => (t === 0 ? 1 : 2))}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FEFCE8] border border-[#FDE047] text-[#854D0E] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              <span>
                {whatHintTier === 0
                  ? 'Necesito una pista (1 palabra)'
                  : whatHintTier === 1
                    ? 'Segunda pista (inicio de frase)'
                    : 'Pistas activadas'}
              </span>
            </button>

            <button
              type="button"
              disabled={!whatAttempted}
              onClick={() => setWhatShowSample((s) => !s)}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] text-xs font-bold flex items-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              title={whatAttempted ? 'Տեսնել հնարավոր պատասխանը' : 'Նախ փորձիր գրել կամ ասել քո պատասխանը'}
            >
              <Eye className="w-4 h-4" />
              <span>
                {whatAttempted
                  ? whatShowSample
                    ? 'Ocultar posible respuesta'
                    : 'Ver una posible respuesta'
                  : 'Ver posible respuesta (tras tu intento)'}
              </span>
            </button>
          </div>

          {whatHintTier >= 1 && (
            <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-3.5 text-sm space-y-1">
              <div className="text-[#4A3B3F]">
                Պատասխանի բանալի բառ՝ <strong className="text-[#7C1D36]">{currentWhat.hintWord}</strong>
              </div>
              {whatHintTier === 2 && (
                <div className="text-[#EA580C] font-bold">
                  Սկսիր այսպես՝ «{currentWhat.hintStarter}»
                </div>
              )}
            </div>
          )}

          {whatShowSample && whatAttempted && (
            <div className="rounded-xl bg-[#F0FDF4] border border-[#86EFAC] p-4 space-y-1.5">
              <div className="text-xs font-bold text-[#166534]">Posible respuesta natural:</div>
              <div className="text-sm font-extrabold text-[#1E1417]">{currentWhat.possibleAnswerEs}</div>
              <div className="text-xs text-[#4A3B3F]">{currentWhat.possibleAnswerHy}</div>
            </div>
          )}

          <VoiceInputBar
            value={whatInput}
            onChange={setWhatInput}
            loading={whatLoading}
            onSubmit={async () => {
              setWhatAttempted(true);
              setWhatLoading(true);
              const res = await evaluateStudentResponse({
                userResponse: whatInput,
                promptEs: `${currentWhat.storyEs} ${currentWhat.questionEs}`,
                sampleAnswerEs: currentWhat.possibleAnswerEs,
                expectedKeywords: currentWhat.expectedKeywords,
                level: activeLevel,
                contextHy: currentWhat.storyHy,
              });
              setWhatLoading(false);
              setWhatEval(res);
              if (res.accepted) onAwardProgress(currentWhat.locationId, 18, true);
            }}
          />

          {whatEval && (
            <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 space-y-2">
              <div className="text-sm font-bold text-[#1E1417]">{whatEval.feedbackEs}</div>
              <div className="text-sm text-[#4A3B3F]">{whatEval.feedbackHy}</div>
              <div className="text-xs text-[#7C1D36] font-bold">Natural: {whatEval.naturalVersion}</div>
            </div>
          )}
        </div>
      )}

      {/* GAME 3: DIÁLOGO SORPRESA */}
      {gameTab === 'surprise' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#EA580C]">
                Diálogo sorpresa · Անկանխատեսելի շրջադարձ
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">{surpriseItem.titleEs}</h2>
              <p className="text-xs text-[#7C1D36] font-semibold mt-0.5">{surpriseItem.titleHy}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={surpriseLoc}
                onChange={(e) => {
                  const val = e.target.value as 'all' | LocationId;
                  setSurpriseLoc(val);
                  handlePickRandomSurprise(val);
                }}
                className="min-h-10 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-xs text-[#1E1417] font-medium"
              >
                <option value="all">Cualquier lugar · Ցանկացած վայր</option>
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.titleEs}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handlePickRandomSurprise(surpriseLoc)}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Nueva sorpresa aleatoria</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4">
              <PhraseText es={surpriseItem.openingEs} hy={surpriseItem.openingHy} onRevealTranslation={onRevealPhrase} />
            </div>
            <div className="rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-4">
              <div className="text-xs font-extrabold text-[#EA580C] mb-1">¡Giro inesperado! · Անակնկալ</div>
              <PhraseText es={surpriseItem.twistEs} hy={surpriseItem.twistHy} onRevealTranslation={onRevealPhrase} />
            </div>
            <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-4">
              <PhraseText es={surpriseItem.followUpEs} hy={surpriseItem.followUpHy} onRevealTranslation={onRevealPhrase} textSize="lg" />
            </div>
          </div>

          {surpriseStage === 'twist' ? (
            <VoiceInputBar
              value={surpriseInput}
              onChange={setSurpriseInput}
              loading={surpriseLoading}
              onHintClick={() => setSurpriseInput('')}
              hintLabel="Pista disponible abajo"
              onSubmit={async () => {
                setSurpriseLoading(true);
                const res = await evaluateStudentResponse({
                  userResponse: surpriseInput,
                  promptEs: `${surpriseItem.twistEs} ${surpriseItem.followUpEs}`,
                  sampleAnswerEs: surpriseItem.sampleAnswerEs,
                  expectedKeywords: surpriseItem.expectedKeywords,
                  level: activeLevel,
                  contextHy: surpriseItem.hintHy,
                });
                setSurpriseLoading(false);
                setSurpriseEval(res);
                if (res.accepted) {
                  setSurpriseStage('done');
                  onAwardProgress(surpriseItem.locationId, 25, true);
                }
              }}
            />
          ) : null}

          <div className="text-xs font-medium text-[#7C1D36]">Հուշում՝ {surpriseItem.hintHy}</div>

          {surpriseEval && (
            <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 space-y-2">
              <div className="text-sm font-bold text-[#1E1417]">{surpriseEval.feedbackEs}</div>
              <div className="text-sm text-[#4A3B3F]">{surpriseEval.feedbackHy}</div>
              <div className="text-xs text-[#7C1D36] font-bold">Natural: {surpriseEval.naturalVersion}</div>
            </div>
          )}
        </div>
      )}

      {/* GAME 4: CONSTRUYE LA FRASE (50 TASKS + SPEAK ALOUD) */}
      {gameTab === 'build' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#7C1D36]">
                Frase {(sentenceIdx % filteredSentences.length) + 1} de {filteredSentences.length} · Nivel {currentSentence.level}
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">Construye la frase · Կազմիր նախադասությունը</h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setSentenceIdx((i) => (i + 1) % filteredSentences.length);
                setPickedWordIndices([]);
                setSentenceChecked('idle');
                setPronounceText('');
                setPronounceNote('');
              }}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] text-xs font-bold cursor-pointer"
            >
              Siguiente frase →
            </button>
          </div>

          <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-5 space-y-1">
            <div className="text-xs text-[#854D0E] font-semibold">Հայերեն · Traduce ordenando las palabras:</div>
            <div className="text-lg font-extrabold text-[#1E1417]">{currentSentence.hy}</div>
          </div>

          {/* Assembled zone */}
          <div className="min-h-16 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 flex flex-wrap gap-2 items-center">
            {pickedWordIndices.length === 0 ? (
              <span className="text-sm text-[#6E5B60]">
                Սեղմիր ստորև բերված բառերի վրա՝ ճիշտ հերթականությամբ հավաքելու համար…
              </span>
            ) : (
              pickedWordIndices.map((wIdx, orderIdx) => (
                <button
                  key={`${wIdx}-${orderIdx}`}
                  type="button"
                  onClick={() => {
                    setSentenceChecked('idle');
                    setPickedWordIndices((prev) => prev.filter((_, idx) => idx !== orderIdx));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FACC15] text-[#1E1417] border border-[#EAB308] font-bold text-sm cursor-pointer"
                >
                  {currentSentence.words[wIdx]}
                </button>
              ))
            )}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-2">
            {currentSentence.words.map((word, idx) => {
              const used = pickedWordIndices.includes(idx);
              return (
                <button
                  key={`${word}-${idx}`}
                  type="button"
                  disabled={used}
                  onClick={() => {
                    setSentenceChecked('idle');
                    setPickedWordIndices((prev) => [...prev, idx]);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#D9C8BE] text-[#1E1417] font-semibold text-sm hover:border-[#7C1D36] disabled:opacity-30 cursor-pointer"
                >
                  {word}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCheckSentence}
              disabled={pickedWordIndices.length !== currentSentence.words.length}
              className="min-h-10 px-5 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-sm disabled:opacity-40 cursor-pointer"
            >
              Comprobar frase
            </button>
            <button
              type="button"
              onClick={() => {
                setPickedWordIndices([]);
                setSentenceChecked('idle');
              }}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          </div>

          {sentenceChecked === 'wrong' && (
            <div className="rounded-xl bg-[#FFF7ED] border border-[#FDBA74] p-4 text-sm text-[#9A3412] font-medium">
              Փորձիր կրկին։ Սեղմիր վերևի բառերի վրա՝ հեռացնելու և նորից դասավորելու համար։
            </div>
          )}

          {sentenceChecked === 'correct' && (
            <div className="rounded-xl bg-[#F0FDF4] border border-[#86EFAC] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-[#166534] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Correcto! Հիանալի է։ Այժմ արտասանիր բարձրաձայն․
                </span>
                <button
                  type="button"
                  onClick={() => speakSpanish(currentSentence.correctEs)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E2D5CC] text-[#7C1D36] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Escuchar modelo</span>
                </button>
              </div>
              <div className="text-base font-extrabold text-[#1E1417]">{currentSentence.correctEs}</div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePronounceCheck}
                  className={`min-h-10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
                    pronounceListening
                      ? 'bg-[#EA580C] text-white'
                      : 'bg-[#FACC15] text-[#1E1417]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{pronounceListening ? 'Լսում եմ… Կանգնեցնել' : 'Pronunciar en voz alta'}</span>
                </button>
                {pronounceText && (
                  <span className="text-xs text-[#1E1417]">
                    Քո արտասանած տեքստը՝ «<strong>{pronounceText}</strong>»
                  </span>
                )}
              </div>
              {pronounceNote && <p className="text-xs text-[#9A3412]">{pronounceNote}</p>}
            </div>
          )}
        </div>
      )}

      {/* GAME 5: RESPONDE RÁPIDO (15 / 30 / 60s TIMER) */}
      {gameTab === 'quick' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#EA580C]">
                Pregunta {(quickIdx % QUICK_REPLY_ITEMS.length) + 1} de {QUICK_REPLY_ITEMS.length} · {currentQuick.role}
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">Responde rápido · Արագ արձագանք</h2>
            </div>

            <div className="flex items-center gap-2">
              {([15, 30, 60] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setTimerChoice(sec);
                    setSecondsLeft(sec);
                    setTimerActive(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums border cursor-pointer ${
                    timerChoice === sec
                      ? 'bg-[#FACC15] text-[#1E1417] border-[#EAB308]'
                      : 'bg-[#FAF7F2] text-[#4A3B3F] border-[#E2D5CC]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              <div
                className={`px-3.5 py-1.5 rounded-lg text-sm font-extrabold tabular-nums border ${
                  secondsLeft <= 5 && timerActive
                    ? 'bg-[#FFF7ED] border-[#EA580C] text-[#EA580C]'
                    : 'bg-[#FDF2F4] border-[#F2CDD6] text-[#7C1D36]'
                }`}
              >
                {secondsLeft}s
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(timerChoice);
                setTimerActive(true);
                setQuickEval(null);
                setQuickInput('');
                speakSpanish(currentQuick.questionEs);
              }}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-xs cursor-pointer"
            >
              Iniciar reloj y escuchar pregunta
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickIdx((i) => (i + 1) % QUICK_REPLY_ITEMS.length);
                setSecondsLeft(timerChoice);
                setTimerActive(false);
                setQuickEval(null);
                setQuickInput('');
              }}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] text-xs font-bold cursor-pointer"
            >
              Siguiente pregunta →
            </button>
          </div>

          <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5">
            <PhraseText
              es={`${currentQuick.role}: ${currentQuick.questionEs}`}
              hy={currentQuick.questionHy}
              onRevealTranslation={onRevealPhrase}
              textSize="lg"
            />
          </div>

          <VoiceInputBar
            value={quickInput}
            onChange={setQuickInput}
            loading={quickLoading}
            onSubmit={async () => {
              setTimerActive(false);
              setQuickLoading(true);
              const res = await evaluateStudentResponse({
                userResponse: quickInput,
                promptEs: currentQuick.questionEs,
                sampleAnswerEs: currentQuick.sampleAnswerEs,
                expectedKeywords: currentQuick.expectedKeywords,
                level: activeLevel,
              });
              setQuickLoading(false);
              setQuickEval(res);
              if (res.accepted) onAwardProgress(currentQuick.locationId, 15, true);
            }}
          />

          {secondsLeft === 0 && !quickEval && (
            <div className="text-xs font-semibold text-[#9A3412]">
              Ժամանակը լրացավ, բայց միևնույն է ավարտիր նախադասությունդ և ուղարկիր ստուգման։
            </div>
          )}

          {quickEval && (
            <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 space-y-1.5">
              <div className="text-sm font-bold text-[#1E1417]">{quickEval.feedbackEs}</div>
              <div className="text-sm text-[#4A3B3F]">{quickEval.feedbackHy}</div>
              <div className="text-xs text-[#7C1D36] font-bold">Natural: {quickEval.naturalVersion}</div>
            </div>
          )}
        </div>
      )}

      {/* GAME 6: DETECTIVE DE ERRORES */}
      {gameTab === 'detective' && (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
            <div>
              <div className="text-xs font-bold text-[#7C1D36]">
                Caso {(errorIdx % filteredErrors.length) + 1} de {filteredErrors.length} · {currentError.contextEs}
              </div>
              <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">
                Detective de errores · Գտիր և ուղղիր սխալը
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorIdx((i) => (i + 1) % filteredErrors.length);
                setErrorChoice(null);
              }}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] text-xs font-bold cursor-pointer"
            >
              Siguiente caso →
            </button>
          </div>

          <div className="rounded-xl bg-[#FFF7ED] border border-[#FDBA74] p-5 space-y-1">
            <div className="text-xs font-bold text-[#EA580C]">Frase con error · Սխալ տարբերակ</div>
            <div className="text-lg font-extrabold text-[#1E1417]">«{currentError.wrongEs}»</div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs text-[#4A3B3F] font-bold">Ընտրիր ճիշտ ուղղումը․</div>
            {currentError.options.map((opt, idx) => {
              const answered = errorChoice !== null;
              const selected = errorChoice === idx;
              let cls = 'bg-[#FAF7F2] border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36]';
              if (answered) {
                if (opt.isCorrect) cls = 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] font-bold';
                else if (selected) cls = 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]';
              }
              return (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => {
                    if (errorChoice !== null) return;
                    setErrorChoice(idx);
                    if (opt.isCorrect) {
                      speakSpanish(currentError.correctEs);
                      onAwardProgress(currentError.locationId, 15, false, currentError.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${cls}`}
                >
                  <span>{opt.text}</span>
                  {answered && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />}
                  {answered && selected && !opt.isCorrect && <XCircle className="w-4 h-4 text-[#EA580C] shrink-0" />}
                </button>
              );
            })}
          </div>

          {errorChoice !== null && (
            <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-4 space-y-2">
              <div className="text-xs font-bold text-[#854D0E]">Explicación en armenio · Բացատրություն</div>
              <p className="text-sm text-[#1E1417] leading-relaxed">{currentError.explanationHy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
