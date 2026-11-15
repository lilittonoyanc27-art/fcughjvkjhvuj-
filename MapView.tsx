import React from 'react';
import {
  MapPin,
  ArrowRight,
  Gamepad2,
  Compass,
  MessageCircle,
  Trophy,
  BookOpen,
  Utensils,
  ShoppingBasket,
  Shirt,
  KeyRound,
  Plane,
} from 'lucide-react';
import { LOCATIONS } from './dataLocations';
import { ALL_DIALOGUES } from './dataDialogsPart2';
import { CefrLevel, LocationId, ProgressState } from './types';

function getLocationIcon(id: LocationId) {
  switch (id) {
    case 'restaurante':
      return <Utensils className="w-7 h-7 text-[#FACC15]" />;
    case 'supermercado':
      return <ShoppingBasket className="w-7 h-7 text-[#FACC15]" />;
    case 'compras':
      return <Shirt className="w-7 h-7 text-[#FACC15]" />;
    case 'hotel':
      return <KeyRound className="w-7 h-7 text-[#FACC15]" />;
    case 'aeropuerto':
      return <Plane className="w-7 h-7 text-[#FACC15]" />;
  }
}

interface MapViewProps {
  activeLevel: CefrLevel;
  onChangeLevel: (lvl: CefrLevel) => void;
  progress: ProgressState;
  onSelectLocation: (locId: LocationId) => void;
  onNavigateTab: (tab: 'games' | 'missions' | 'chat' | 'progress') => void;
  onOpenLeccion5: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  activeLevel,
  onChangeLevel,
  progress,
  onSelectLocation,
  onNavigateTab,
  onOpenLeccion5,
}) => {
  const totalStars = Object.values(progress.missionStars).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#EA580C] tracking-wide">
                Español real de España · Բացատրությունները՝ հայերեն
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-[#1E1417] leading-tight text-balance">
                Habla Español — Aventuras de la vida real
              </h1>
              <p className="text-[15px] md:text-base text-[#4A3B3F] leading-relaxed max-w-2xl">
                Պատրաստվիր իրական զրույցների Իսպանիայում։ Լսիր, սեղմիր ցանկացած նախադասության վրա՝ հայերեն թարգմանությունը տեսնելու համար, և պատասխանիր ինքնուրույն՝ ձայնով կամ տեքստով։
              </p>
            </div>

            {/* Level Selector & Primary Action */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-1 bg-[#F5EFEA] p-1 rounded-xl border border-[#E2D5CC]">
                {(['A2', 'B1', 'B2'] as CefrLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeLevel(lvl)}
                    className={`min-h-10 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeLevel === lvl
                        ? 'bg-[#FACC15] text-[#1E1417] shadow-xs'
                        : 'text-[#4A3B3F] hover:text-[#1E1417]'
                    }`}
                  >
                    Nivel {lvl}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSelectLocation('restaurante')}
                className="min-h-11 px-6 py-2.5 rounded-xl bg-[#7C1D36] hover:bg-[#64152A] text-white font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Empezar viaje en Madrid</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Summary Metrics */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#FEFCE8] border border-[#FDE68A] p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#854D0E]">Puntos XP · Միավորներ</span>
              <div className="text-2xl md:text-3xl font-extrabold text-[#7C1D36] tabular-nums mt-2">
                {progress.xp}
              </div>
              <span className="text-xs text-[#4A3B3F] mt-1">Ինքնուրույն խոսքով վաստակած</span>
            </div>

            <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#9A3412]">Respuestas propias · Պատասխաններ</span>
              <div className="text-2xl md:text-3xl font-extrabold text-[#EA580C] tabular-nums mt-2">
                {progress.independentAnswers}
              </div>
              <span className="text-xs text-[#4A3B3F] mt-1">Առանց պատրաստի տարբերակի</span>
            </div>

            <div className="rounded-2xl bg-[#FDF2F4] border border-[#F2CDD6] p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#7C1D36]">Diálogos · Երկխոսություններ</span>
              <div className="text-2xl md:text-3xl font-extrabold text-[#7C1D36] tabular-nums mt-2">
                {progress.completedDialogs.length} / {ALL_DIALOGUES.length}
              </div>
              <span className="text-xs text-[#4A3B3F] mt-1">5 իրական վայրերում</span>
            </div>

            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#6E5B60]">Estrellas · Աստղեր</span>
              <div className="text-2xl md:text-3xl font-extrabold text-[#B45309] tabular-nums mt-2">
                {totalStars} / 15
              </div>
              <span className="text-xs text-[#4A3B3F] mt-1">Misión imposible արկածներ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lección 5 Card */}
      <section className="rounded-2xl bg-gradient-to-r from-[#FDF2F4] via-[#FFF7ED] to-[#FEFCE8] border border-[#F2CDD6] p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7C1D36]">
            <BookOpen className="w-4 h-4 text-[#EA580C]" />
            <span>Lección 5 · Դաս 5 — Ռեստորանում</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1E1417]">
            Lección 5 — En el restaurante (Juan, Marta y Camarera)
          </h2>
          <p className="text-sm text-[#4A3B3F]">
            Լսեք և թարգմանեք երկխոսությունը՝ երեք մասով և մեկնաբանություններով։ Սեղմիր ցանկացած իսպաներեն արտահայտության վրա՝ հայերեն թարգմանությունը բացելու համար։
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLeccion5}
          className="min-h-11 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Abrir Lección 5</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Interactive Journey Map of 5 Locations */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1E1417] flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-[#EA580C]" />
              <span>Mapa del viaje · Ճանապարհորդության քարտեզ</span>
            </h2>
            <p className="text-sm text-[#4A3B3F] mt-1">
              Ընտրիր կանգառը՝ 5 երկխոսությունների, ինտերակտիվ տեսարանի և իրական առաջադրանքների համար։
            </p>
          </div>
          <div className="text-xs font-medium text-[#6E5B60]">
            5 lugares · 25 diálogos · Escucha, completa y habla
          </div>
        </div>

        {/* Route Path Indicator */}
        <div className="hidden lg:flex items-center justify-between px-8 py-2">
          {LOCATIONS.map((loc, idx) => (
            <React.Fragment key={loc.id}>
              <button
                type="button"
                onClick={() => onSelectLocation(loc.id)}
                className="flex items-center gap-2 text-xs font-bold text-[#1E1417] hover:text-[#7C1D36] transition-colors cursor-pointer"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold tabular-nums shadow-xs"
                  style={{ backgroundColor: loc.accentColor }}
                >
                  {idx + 1}
                </span>
                <span>{loc.titleEs}</span>
              </button>
              {idx < LOCATIONS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 bg-gradient-to-r from-[#EA580C]/45 via-[#FACC15]/70 to-[#7C1D36]/45 rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 5 Location Scene Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {LOCATIONS.map((loc, idx) => {
            const locDialogs = ALL_DIALOGUES.filter((d) => d.locationId === loc.id);
            const completedCount = locDialogs.filter((d) =>
              progress.completedDialogs.includes(d.id)
            ).length;
            const locPts = progress.locationPoints[loc.id] ?? 0;

            return (
              <div
                key={loc.id}
                className="group rounded-2xl bg-white border border-[#E6DCD5] shadow-xs overflow-hidden flex flex-col hover:border-[#EA580C] transition-colors"
              >
                <div className={`relative h-36 bg-gradient-to-br ${loc.accentBg} p-5 flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center">
                      {getLocationIcon(loc.id)}
                    </div>
                    <span className="text-xs font-bold text-[#FDE68A]">
                      {loc.characterName} · {loc.characterRole}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FACC15]">
                      Parada 0{idx + 1} · {loc.titleHy}
                    </div>
                    <h3 className="text-xl font-extrabold text-white">{loc.titleEs}</h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-sm text-[#1E1417] font-semibold">{loc.subtitleEs}</p>
                    <p className="text-xs text-[#4A3B3F] leading-relaxed">{loc.subtitleHy}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#EFE5DE]">
                    <div className="flex items-center justify-between text-xs text-[#4A3B3F] tabular-nums">
                      <span>Diálogos: {completedCount}/{locDialogs.length}</span>
                      <span className="text-[#7C1D36] font-bold">{locPts} XP</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F5EFEA] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((completedCount / locDialogs.length) * 100)}%`,
                          backgroundColor: loc.accentColor,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectLocation(loc.id)}
                      className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] hover:bg-[#7C1D36] hover:border-[#7C1D36] hover:text-white text-[#1E1417] font-bold text-sm flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Entrar en la escena</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 6th Grid Card: Direct Portal to Conversación Libre */}
          <div className="rounded-2xl bg-gradient-to-br from-[#FDF2F4] via-[#FFF7ED] to-[#FEFCE8] border border-[#F2CDD6] p-6 flex flex-col justify-between space-y-5 shadow-xs">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#7C1D36] flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-[#EA580C]">
                5 personajes · Niveles A2 / B1 / B2
              </div>
              <h3 className="text-xl font-extrabold text-[#1E1417]">Conversación libre</h3>
              <p className="text-sm text-[#4A3B3F] leading-relaxed">
                Զրուցիր վիրտուալ կերպարների հետ՝ ընտրելով հարմար իսպաներեն պատասխանների տարբերակներից (մատուցող, վաճառող, գանձապահ, ընդունարանի կամ օդանավակայանի աշխատակից)։
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('chat')}
              className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Hablar ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Launch Strip for Games & Missions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => onNavigateTab('games')}
          className="text-left rounded-2xl bg-white border border-[#E6DCD5] hover:border-[#EA580C] p-5 space-y-2 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <Gamepad2 className="w-6 h-6 text-[#EA580C]" />
            <span className="text-xs font-semibold text-[#6E5B60]">6 juegos activos</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#1E1417]">Juegos de habla y reacción</h3>
          <p className="text-xs text-[#4A3B3F] leading-relaxed">
            Habla para continuar, ¿Qué harías tú? (40), Diálogo sorpresa, Construye la frase (50), Responde rápido y Detective de errores.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('missions')}
          className="text-left rounded-2xl bg-white border border-[#E6DCD5] hover:border-[#EAB308] p-5 space-y-2 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <Compass className="w-6 h-6 text-[#D97706]" />
            <span className="text-xs font-semibold text-[#6E5B60]">5 grandes aventuras</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#1E1417]">Misión imposible</h3>
          <p className="text-xs text-[#4A3B3F] leading-relaxed">
            7 փուլից բաղկացած ամբողջական պատմություններ յուրաքանչյուր վայրի համար՝ աստղերով և XP պարգևներով։
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('progress')}
          className="text-left rounded-2xl bg-white border border-[#E6DCD5] hover:border-[#7C1D36] p-5 space-y-2 shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <Trophy className="w-6 h-6 text-[#7C1D36]" />
            <span className="text-xs font-semibold text-[#6E5B60]">{progress.achievements.length} logros</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#1E1417]">Tu progreso y logros</h3>
          <p className="text-xs text-[#4A3B3F] leading-relaxed">
            Տես քո XP միավորները, սովորած արտահայտությունները, աստղերը և նվաճումները։
          </p>
        </button>
      </section>
    </div>
  );
};
