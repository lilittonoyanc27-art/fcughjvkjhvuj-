import React, { useState } from 'react';
import { Trophy, Star, Award, Trash2, CheckCircle2 } from 'lucide-react';
import { ProgressState } from './types';
import { ACHIEVEMENTS } from './storage';
import { LOCATIONS } from './dataLocations';
import { ALL_DIALOGUES } from './dataDialogsPart2';

interface ProgressViewProps {
  progress: ProgressState;
  onResetProgress: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ progress, onResetProgress }) => {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const totalStars = Object.values(progress.missionStars).reduce((a, b) => a + b, 0);
  const rankLabel =
    progress.xp >= 600
      ? 'Maestro B2 · Բարձր մակարդակ'
      : progress.xp >= 250
        ? 'Viajero B1 · Վստահ զրուցակից'
        : 'Explorador A2 · Սկսնակ ճանապարհորդ';

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#EA580C]">{rankLabel}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417] mt-1">
            Tu progreso y logros · Առաջընթաց և նվաճումներ
          </h1>
          <p className="text-sm text-[#4A3B3F] mt-1">
            Արդյունքները պահպանվում են ավտոմատ կերպով՝ էջը թարմացնելուց հետո չեն կորչում։
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="min-h-10 px-4 py-2 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-[#9A3412] hover:bg-[#FFEDD5] text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reiniciar progreso</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E1417]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white border border-[#E6DCD5] shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#1E1417]">¿Reiniciar todo el progreso?</h2>
            <p className="text-sm text-[#4A3B3F] leading-relaxed">
              Վստա՞հ ես, որ ուզում ես զրոյացնել քո բոլոր XP միավորները, աստղերը, սովորած արտահայտությունները և նվաճումները։
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmResetOpen(false);
                }}
                className="min-h-10 px-4 py-2 rounded-xl bg-[#7C1D36] text-white font-bold text-sm cursor-pointer"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-[#FEFCE8] border border-[#FDE68A] p-5">
          <div className="text-xs font-semibold text-[#854D0E]">Puntos XP</div>
          <div className="text-3xl font-extrabold text-[#7C1D36] tabular-nums mt-1">{progress.xp}</div>
          <div className="text-xs text-[#4A3B3F] mt-1">Ընդհանուր միավոր</div>
        </div>

        <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-5">
          <div className="text-xs font-semibold text-[#9A3412]">Respuestas propias</div>
          <div className="text-3xl font-extrabold text-[#EA580C] tabular-nums mt-1">
            {progress.independentAnswers}
          </div>
          <div className="text-xs text-[#4A3B3F] mt-1">Ինքնուրույն պատասխան</div>
        </div>

        <div className="rounded-2xl bg-[#FDF2F4] border border-[#F2CDD6] p-5">
          <div className="text-xs font-semibold text-[#7C1D36]">Expresiones</div>
          <div className="text-3xl font-extrabold text-[#7C1D36] tabular-nums mt-1">
            {progress.learnedPhrases.length}
          </div>
          <div className="text-xs text-[#4A3B3F] mt-1">Սովորած արտահայտություն</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E6DCD5] p-5">
          <div className="text-xs font-semibold text-[#6E5B60]">Diálogos</div>
          <div className="text-3xl font-extrabold text-[#EA580C] tabular-nums mt-1">
            {progress.completedDialogs.length}/{ALL_DIALOGUES.length}
          </div>
          <div className="text-xs text-[#4A3B3F] mt-1">Ավարտված երկխոսություն</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E6DCD5] p-5">
          <div className="text-xs font-semibold text-[#6E5B60]">Estrellas</div>
          <div className="text-3xl font-extrabold text-[#B45309] tabular-nums mt-1 flex items-center gap-1.5">
            <span>{totalStars}/15</span>
            <Star className="w-6 h-6 text-[#EAB308] fill-[#FACC15]" />
          </div>
          <div className="text-xs text-[#4A3B3F] mt-1">Առաքելությունների աստղ</div>
        </div>
      </div>

      {/* Location Progress Breakdown */}
      <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-[#1E1417]">Progreso por ubicación · Առաջընթաց ըստ վայրերի</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {LOCATIONS.map((loc) => {
            const locDialogs = ALL_DIALOGUES.filter((d) => d.locationId === loc.id);
            const done = locDialogs.filter((d) => progress.completedDialogs.includes(d.id)).length;
            const pts = progress.locationPoints[loc.id] ?? 0;
            const pct = Math.round((done / locDialogs.length) * 100);
            return (
              <div key={loc.id} className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 space-y-2.5">
                <div className="text-sm font-extrabold text-[#1E1417]">{loc.titleEs}</div>
                <div className="text-xs text-[#6E5B60]">{loc.titleHy}</div>
                <div className="h-2 rounded-full bg-[#EFE5DE] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: loc.accentColor }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#4A3B3F] tabular-nums">
                  <span>{done}/{locDialogs.length} diálogos</span>
                  <span className="text-[#7C1D36] font-bold">{pts} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#EA580C]" />
          <h2 className="text-lg font-extrabold text-[#1E1417]">Logros de conversación · Խոսակցական նվաճումներ</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = progress.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl p-4 border space-y-1.5 ${
                  unlocked
                    ? 'bg-[#FEFCE8] border-[#FACC15]'
                    : 'bg-[#FAF7F2] border-[#E2D5CC] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-[#1E1417]">{ach.titleEs}</span>
                  {unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  ) : (
                    <Award className="w-4 h-4 text-[#9D8B8F] shrink-0" />
                  )}
                </div>
                <div className="text-xs font-bold text-[#7C1D36]">{ach.titleHy}</div>
                <p className="text-xs text-[#4A3B3F]">{ach.descriptionHy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
