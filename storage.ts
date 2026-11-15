import { LocationId, ProgressState } from './types';

const STORAGE_KEY = 'habla_espanol_progress_v1';

export const INITIAL_PROGRESS: ProgressState = {
  xp: 0,
  independentAnswers: 0,
  learnedPhrases: [],
  completedDialogs: [],
  completedMode3Dialogs: [],
  completedGames: [],
  missionStars: {},
  locationPoints: {
    restaurante: 0,
    supermercado: 0,
    compras: 0,
    hotel: 0,
    aeropuerto: 0,
  },
  achievements: [],
  streakDays: 1,
};

export interface AchievementDef {
  id: string;
  titleEs: string;
  titleHy: string;
  descriptionHy: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_phrase',
    titleEs: 'Primer paso',
    titleHy: 'Առաջին քայլը',
    descriptionHy: 'Բացահայտիր առաջին իսպաներեն արտահայտության հայերեն թարգմանությունը։',
  },
  {
    id: 'polyglot_15',
    titleEs: 'Coleccionista de frases',
    titleHy: 'Արտահայտությունների հավաքորդ',
    descriptionHy: 'Ուսումնասիրիր առնվազն 15 իսպաներեն արտահայտություն։',
  },
  {
    id: 'independent_5',
    titleEs: 'Voz propia',
    titleHy: 'Սեփական ձայն',
    descriptionHy: 'Գրիր կամ ասա 5 ինքնուրույն պատասխան իսպաներենով։',
  },
  {
    id: 'independent_20',
    titleEs: 'Conversador valiente',
    titleHy: 'Քաջ զրուցակից',
    descriptionHy: 'Կատարիր 20 ինքնուրույն պատասխան իրական իրավիճակներում։',
  },
  {
    id: 'dialog_master',
    titleEs: 'Maestro de diálogos',
    titleHy: 'Երկխոսությունների վարպետ',
    descriptionHy: 'Ավարտիր առնվազն 5 ամբողջական երկխոսություն։',
  },
  {
    id: 'mission_hero',
    titleEs: 'Aventurero en España',
    titleHy: 'Իսպանիայի ճանապարհորդ',
    descriptionHy: 'Ավարտիր առնվազն 1 «Misión imposible» արկած 3 աստղով։',
  },
  {
    id: 'all_locations',
    titleEs: 'Explorador total',
    titleHy: 'Լիարժեք հետախույզ',
    descriptionHy: 'Վաստակիր միավորներ քարտեզի բոլոր 5 վայրերում։',
  },
];

function evaluateAchievements(state: ProgressState): string[] {
  const earned = new Set(state.achievements);
  if (state.learnedPhrases.length >= 1) earned.add('first_phrase');
  if (state.learnedPhrases.length >= 15) earned.add('polyglot_15');
  if (state.independentAnswers >= 5) earned.add('independent_5');
  if (state.independentAnswers >= 20) earned.add('independent_20');
  if (state.completedDialogs.length >= 5) earned.add('dialog_master');
  if (Object.values(state.missionStars).some((s) => s >= 3)) earned.add('mission_hero');
  if (Object.values(state.locationPoints).every((pts) => pts > 0)) earned.add('all_locations');
  return Array.from(earned);
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const merged: ProgressState = {
      ...INITIAL_PROGRESS,
      ...parsed,
      locationPoints: {
        ...INITIAL_PROGRESS.locationPoints,
        ...(parsed.locationPoints ?? {}),
      },
      learnedPhrases: Array.isArray(parsed.learnedPhrases) ? parsed.learnedPhrases : [],
      completedDialogs: Array.isArray(parsed.completedDialogs) ? parsed.completedDialogs : [],
      completedMode3Dialogs: Array.isArray(parsed.completedMode3Dialogs) ? parsed.completedMode3Dialogs : [],
      completedGames: Array.isArray(parsed.completedGames) ? parsed.completedGames : [],
      missionStars: parsed.missionStars ?? {},
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    };
    return merged;
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveProgress(state: ProgressState): ProgressState {
  const next: ProgressState = {
    ...state,
    achievements: evaluateAchievements(state),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function resetProgressStorage(): ProgressState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return INITIAL_PROGRESS;
}

export function awardXp(
  state: ProgressState,
  amount: number,
  locationId?: LocationId
): ProgressState {
  const nextLocationPoints = { ...state.locationPoints };
  if (locationId) {
    nextLocationPoints[locationId] = (nextLocationPoints[locationId] ?? 0) + amount;
  }
  return saveProgress({
    ...state,
    xp: state.xp + amount,
    locationPoints: nextLocationPoints,
  });
}
