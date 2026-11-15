import React, { useState } from 'react';
import { Star, ArrowRight, CheckCircle2, Compass, RotateCcw } from 'lucide-react';
import { MISSIONS } from './dataMissions';
import { LOCATIONS } from './dataLocations';
import { CefrLevel, EvaluateResult, LocationId, Mission, ProgressState } from './types';
import { PhraseText } from './PhraseText';
import { VoiceInputBar } from './VoiceInputBar';
import { evaluateStudentResponse } from './aiClient';

interface MissionsViewProps {
  activeLevel: CefrLevel;
  progress: ProgressState;
  onRevealPhrase: (phraseEs: string) => void;
  onCompleteMission: (missionId: string, locationId: LocationId, stars: number, xp: number) => void;
  onRecordIndependentAnswer: (locId: LocationId) => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  activeLevel,
  progress,
  onRevealPhrase,
  onCompleteMission,
  onRecordIndependentAnswer,
}) => {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [choicePicked, setChoicePicked] = useState<number | null>(null);
  const [speakInput, setSpeakInput] = useState('');
  const [speakEval, setSpeakEval] = useState<EvaluateResult | null>(null);
  const [speakLoading, setSpeakLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [missionDoneStars, setMissionDoneStars] = useState<number | null>(null);

  const startMission = (m: Mission) => {
    setActiveMission(m);
    setStepIndex(0);
    setMistakes(0);
    setChoicePicked(null);
    setSpeakInput('');
    setSpeakEval(null);
    setShowHint(false);
    setMissionDoneStars(null);
  };

  if (!activeMission) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[#EA580C]">
            <Compass className="w-4 h-4" />
            <span>5 aventuras completas · 7 retos por misión</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417] mt-1">
            Misión imposible · Մեծ արկածներ Իսպանիայում
          </h1>
          <p className="text-sm text-[#4A3B3F] mt-2 max-w-2xl">
            Յուրաքանչյուր առաքելություն միավորում է երկխոսություններ, խնդիրների լուծում և ինքնուրույն պատասխաններ։ Վաստակիր մինչև 3 աստղ յուրաքանչյուր արկածի համար։
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MISSIONS.map((m) => {
            const loc = LOCATIONS.find((l) => l.id === m.locationId);
            const stars = progress.missionStars[m.id] ?? 0;
            return (
              <div
                key={m.id}
                className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {loc && (
                  <div className={`bg-gradient-to-br ${loc.accentBg} px-5 py-4 flex items-center justify-between gap-2`}>
                    <span className="text-xs font-bold text-[#FACC15]">
                      {loc.titleEs} · Nivel {m.level}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= stars ? 'text-[#FACC15] fill-[#FACC15]' : 'text-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-extrabold text-[#1E1417]">{m.titleEs}</h2>
                    <div className="text-sm font-bold text-[#7C1D36]">{m.titleHy}</div>
                    <p className="text-xs text-[#4A3B3F] leading-relaxed">{m.descriptionHy}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startMission(m)}
                    className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#1E1417] font-extrabold text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span>{stars > 0 ? 'Volver a jugar misión' : 'Aceptar misión'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentStep = activeMission.steps[stepIndex];

  const advanceMissionStep = () => {
    setChoicePicked(null);
    setSpeakInput('');
    setSpeakEval(null);
    setShowHint(false);

    if (stepIndex + 1 < activeMission.steps.length) {
      setStepIndex((s) => s + 1);
    } else {
      const earnedStars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      setMissionDoneStars(earnedStars);
      onCompleteMission(activeMission.id, activeMission.locationId, earnedStars, earnedStars * 35);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Mission Header */}
      <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#EA580C]">
            {activeMission.titleEs} · Paso {Math.min(stepIndex + 1, activeMission.steps.length)} de {activeMission.steps.length}
          </div>
          <h2 className="text-xl font-extrabold text-[#1E1417] mt-0.5">{currentStep?.zoneEs}</h2>
        </div>

        <button
          type="button"
          onClick={() => setActiveMission(null)}
          className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36] text-xs font-bold cursor-pointer"
        >
          Salir de la misión
        </button>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-7 gap-2">
        {activeMission.steps.map((st, idx) => (
          <div
            key={st.id}
            className={`h-2 rounded-full ${
              missionDoneStars !== null || idx < stepIndex
                ? 'bg-[#7C1D36]'
                : idx === stepIndex
                  ? 'bg-[#EA580C]'
                  : 'bg-[#E6DCD5]'
            }`}
          />
        ))}
      </div>

      {missionDoneStars !== null ? (
        <div className="rounded-3xl bg-white border border-[#86EFAC] shadow-xs p-8 text-center space-y-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-10 h-10 ${
                  s <= missionDoneStars ? 'text-[#EAB308] fill-[#FACC15]' : 'text-[#D9C8BE]'
                }`}
              />
            ))}
          </div>
          <h3 className="text-2xl font-extrabold text-[#1E1417]">
            ¡Misión completada! · Առաքելությունը հաղթահարված է
          </h3>
          <p className="text-sm text-[#4A3B3F] max-w-lg mx-auto">
            Վաստակեցիր {missionDoneStars} աստղ և +{missionDoneStars * 35} XP։ Շարունակիր մյուս արկածները՝ բոլոր 15 աստղերը հավաքելու համար։
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => startMission(activeMission)}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMission(null)}
              className="min-h-10 px-5 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-sm cursor-pointer"
            >
              Volver a las misiones
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
          <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-2">
            <div className="text-xs font-extrabold text-[#7C1D36]">{currentStep.speaker}</div>
            <PhraseText
              es={currentStep.promptEs}
              hy={currentStep.promptHy}
              onRevealTranslation={onRevealPhrase}
              textSize="lg"
              showSlowButton
            />
            {currentStep.wrongEs && (
              <div className="mt-3 p-3 rounded-lg bg-[#FFF7ED] border border-[#FDBA74] text-sm font-bold text-[#9A3412]">
                «{currentStep.wrongEs}»
              </div>
            )}
          </div>

          {currentStep.type === 'speak' && (
            <div className="space-y-4">
              {showHint && currentStep.hintHy && (
                <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-3.5 text-sm text-[#1E1417]">
                  Հուշում՝ {currentStep.hintHy}
                </div>
              )}

              <VoiceInputBar
                value={speakInput}
                onChange={setSpeakInput}
                loading={speakLoading}
                onHintClick={() => setShowHint((h) => !h)}
                hintLabel="Pista"
                onSubmit={async () => {
                  setSpeakLoading(true);
                  const res = await evaluateStudentResponse({
                    userResponse: speakInput,
                    promptEs: currentStep.promptEs,
                    sampleAnswerEs: currentStep.sampleAnswerEs ?? '',
                    expectedKeywords: currentStep.expectedKeywords,
                    level: activeLevel,
                    contextHy: currentStep.promptHy,
                  });
                  setSpeakLoading(false);
                  setSpeakEval(res);
                  if (res.accepted) {
                    onRecordIndependentAnswer(activeMission.locationId);
                  } else {
                    setMistakes((m) => m + 1);
                  }
                }}
              />

              {speakEval && (
                <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 space-y-2">
                  <div className="text-sm font-bold text-[#1E1417]">{speakEval.feedbackEs}</div>
                  <div className="text-sm text-[#4A3B3F]">{speakEval.feedbackHy}</div>
                  <div className="text-xs text-[#7C1D36] font-bold">Natural: {speakEval.naturalVersion}</div>
                  {speakEval.accepted && (
                    <button
                      type="button"
                      onClick={advanceMissionStep}
                      className="mt-2 px-5 py-2 rounded-xl bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Siguiente paso</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {(currentStep.type === 'choice' || currentStep.type === 'error') && currentStep.options && (
            <div className="space-y-3">
              {currentStep.options.map((opt, idx) => {
                const label = opt.es ?? opt.text ?? '';
                const answered = choicePicked !== null;
                const selected = choicePicked === idx;
                let cls = 'bg-[#FAF7F2] border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36]';
                if (answered) {
                  if (opt.isCorrect) cls = 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] font-bold';
                  else if (selected) cls = 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]';
                }
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (choicePicked !== null) return;
                      setChoicePicked(idx);
                      if (!opt.isCorrect) setMistakes((m) => m + 1);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 cursor-pointer ${cls}`}
                  >
                    <span>{label}</span>
                    {answered && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />}
                  </button>
                );
              })}

              {choicePicked !== null && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-sm font-medium text-[#7C1D36]">
                    {currentStep.options[choicePicked].feedbackHy
                      ? currentStep.options[choicePicked].feedbackHy
                      : currentStep.options[choicePicked].isCorrect
                        ? 'Ճիշտ է։ Հիանալի նկատեցիր։'
                        : 'Փորձիր ուշադիր կարդալ մյուս տարբերակը։'}
                  </span>
                  <button
                    type="button"
                    onClick={advanceMissionStep}
                    className="px-5 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
