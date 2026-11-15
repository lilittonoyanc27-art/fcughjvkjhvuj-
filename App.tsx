import { useState } from 'react';
import { Map, BookOpen, Gamepad2, Compass, MessageCircle, Trophy } from 'lucide-react';
import { CefrLevel, LocationId, ProgressState } from './types';
import { awardXp, loadProgress, resetProgressStorage, saveProgress } from './storage';
import { ALL_DIALOGUES } from './dataDialogsPart2';
import { MapView } from './MapView';
import { LocationScene } from './LocationScene';
import { Leccion5View } from './Leccion5View';
import { GamesHub } from './GamesHub';
import { MissionsView } from './MissionsView';
import { FreeChatView } from './FreeChatView';
import { ProgressView } from './ProgressView';

type AppTab = 'map' | 'leccion5' | 'games' | 'missions' | 'chat' | 'progress';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('map');
  const [activeLocationId, setActiveLocationId] = useState<LocationId | null>(null);
  const [activeLevel, setActiveLevel] = useState<CefrLevel>('B1');
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  const handleRevealPhrase = (phraseEs: string) => {
    setProgress((prev) => {
      if (prev.learnedPhrases.includes(phraseEs)) return prev;
      return saveProgress({
        ...prev,
        xp: prev.xp + 2,
        learnedPhrases: [...prev.learnedPhrases, phraseEs],
      });
    });
  };

  const handleCompleteDialogue = (
    dialogueId: string,
    mode: 'listen' | 'complete' | 'speak',
    xpAmount: number
  ) => {
    const dlg = ALL_DIALOGUES.find((d) => d.id === dialogueId);
    setProgress((prev) => {
      const completedDialogs = prev.completedDialogs.includes(dialogueId)
        ? prev.completedDialogs
        : [...prev.completedDialogs, dialogueId];
      const completedMode3Dialogs =
        mode === 'speak' && !prev.completedMode3Dialogs.includes(dialogueId)
          ? [...prev.completedMode3Dialogs, dialogueId]
          : prev.completedMode3Dialogs;

      const updated = awardXp(
        {
          ...prev,
          completedDialogs,
          completedMode3Dialogs,
        },
        xpAmount,
        dlg?.locationId
      );
      return updated;
    });
  };

  const handleRecordIndependentAnswer = (locId: LocationId, xpAmount = 15) => {
    setProgress((prev) =>
      awardXp(
        {
          ...prev,
          independentAnswers: prev.independentAnswers + 1,
        },
        xpAmount,
        locId
      )
    );
  };

  const handleAwardGameProgress = (
    locId: LocationId,
    xp: number,
    isIndependent = false,
    gameId?: string
  ) => {
    setProgress((prev) => {
      const completedGames =
        gameId && !prev.completedGames.includes(gameId)
          ? [...prev.completedGames, gameId]
          : prev.completedGames;
      return awardXp(
        {
          ...prev,
          independentAnswers: prev.independentAnswers + (isIndependent ? 1 : 0),
          completedGames,
        },
        xp,
        locId
      );
    });
  };

  const handleCompleteMission = (
    missionId: string,
    locationId: LocationId,
    stars: number,
    xp: number
  ) => {
    setProgress((prev) => {
      const bestStars = Math.max(prev.missionStars[missionId] ?? 0, stars);
      return awardXp(
        {
          ...prev,
          missionStars: {
            ...prev.missionStars,
            [missionId]: bestStars,
          },
        },
        xp,
        locationId
      );
    });
  };

  const handleResetProgress = () => {
    setProgress(resetProgressStorage());
  };

  const desktopNavItems: Array<{ id: AppTab; label: string }> = [
    { id: 'map', label: 'Mapa' },
    { id: 'leccion5', label: 'Lección 5' },
    { id: 'games', label: 'Juegos' },
    { id: 'missions', label: 'Misiones' },
    { id: 'progress', label: 'Progreso' },
  ];

  const mobileNavItems: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
    { id: 'map', label: 'Mapa', icon: <Map className="w-4 h-4" /> },
    { id: 'leccion5', label: 'Lección 5', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'games', label: 'Juegos', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'missions', label: 'Misiones', icon: <Compass className="w-4 h-4" /> },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'progress', label: 'Progreso', icon: <Trophy className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab !== 'map') {
      setActiveLocationId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1417] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6DCD5]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('map');
              setActiveLocationId(null);
            }}
            className="text-lg font-extrabold tracking-tight text-[#7C1D36] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Habla Español
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#4A3B3F]">
            {desktopNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-[#7C1D36] border-[#7C1D36] font-bold'
                      : 'border-transparent hover:text-[#EA580C]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleNavClick('chat')}
              className={`min-h-10 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#7C1D36] text-white'
                  : 'bg-[#EA580C] hover:bg-[#C2410C] text-white'
              }`}
            >
              Practicar ahora
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-12">
        {activeTab === 'map' && !activeLocationId && (
          <MapView
            activeLevel={activeLevel}
            onChangeLevel={setActiveLevel}
            progress={progress}
            onSelectLocation={(id) => setActiveLocationId(id)}
            onNavigateTab={(tab) => handleNavClick(tab)}
            onOpenLeccion5={() => handleNavClick('leccion5')}
          />
        )}

        {activeTab === 'map' && activeLocationId && (
          <LocationScene
            locationId={activeLocationId}
            activeLevel={activeLevel}
            progress={progress}
            onBackToMap={() => setActiveLocationId(null)}
            onRevealPhrase={handleRevealPhrase}
            onCompleteDialogue={handleCompleteDialogue}
            onRecordIndependentAnswer={handleRecordIndependentAnswer}
            onOpenLeccion5={() => handleNavClick('leccion5')}
          />
        )}

        {activeTab === 'leccion5' && (
          <Leccion5View
            onRevealPhrase={handleRevealPhrase}
            onBack={() => handleNavClick('map')}
          />
        )}

        {activeTab === 'games' && (
          <GamesHub
            activeLevel={activeLevel}
            onRevealPhrase={handleRevealPhrase}
            onAwardProgress={handleAwardGameProgress}
          />
        )}

        {activeTab === 'missions' && (
          <MissionsView
            activeLevel={activeLevel}
            progress={progress}
            onRevealPhrase={handleRevealPhrase}
            onCompleteMission={handleCompleteMission}
            onRecordIndependentAnswer={handleRecordIndependentAnswer}
          />
        )}

        {activeTab === 'chat' && (
          <FreeChatView
            activeLevel={activeLevel}
            onChangeLevel={setActiveLevel}
            onRevealPhrase={handleRevealPhrase}
            onRecordIndependentAnswer={handleRecordIndependentAnswer}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView progress={progress} onResetProgress={handleResetProgress} />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6DCD5] grid grid-cols-6 h-16">
        {mobileNavItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer ${
                active ? 'text-[#7C1D36]' : 'text-[#6E5B60]'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-full px-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
