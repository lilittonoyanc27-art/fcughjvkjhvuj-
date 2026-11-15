export type LocationId = 'restaurante' | 'supermercado' | 'compras' | 'hotel' | 'aeropuerto';

export type CefrLevel = 'A2' | 'B1' | 'B2';

export interface LocationMeta {
  id: LocationId;
  titleEs: string;
  titleHy: string;
  subtitleEs: string;
  subtitleHy: string;
  characterRole: string;
  characterName: string;
  accentColor: string;
  accentBg: string;
  usefulPhrases: Array<{ es: string; hy: string }>;
}

export interface DialogueOption {
  es: string;
  isBest: boolean;
  explanationHy: string;
}

export interface DialogueLine {
  id: string;
  speaker: 'character' | 'student';
  speakerLabel: string;
  es: string;
  hy: string;
  // Used in Mode 2 (Completa el diálogo) when speaker === 'student'
  options?: DialogueOption[];
  // Used in Mode 3 (Ahora te toca a ti) when speaker === 'student'
  hintWord?: string;
  hintStarter?: string;
  hintHy?: string;
  expectedKeywords?: string[];
}

export interface ComprehensionQuestion {
  id: string;
  questionEs: string;
  questionHy: string;
  options: Array<{ es: string; isCorrect: boolean }>;
  explanationHy: string;
}

export interface Dialogue {
  id: string;
  locationId: LocationId;
  situationNumber: number;
  titleEs: string;
  titleHy: string;
  level: CefrLevel;
  summaryHy: string;
  lines: DialogueLine[];
  comprehension: ComprehensionQuestion[];
}

export interface SpeakToContinueStep {
  id: string;
  promptTemplateEs: string; // Supports {lastAnswer} or dynamic context
  promptHy: string;
  hintHy: string;
  sampleAnswerEs: string;
  expectedKeywords: string[];
}

export interface SpeakToContinueStory {
  id: string;
  locationId: LocationId;
  titleEs: string;
  titleHy: string;
  characterRole: string;
  level: CefrLevel;
  steps: SpeakToContinueStep[];
}

export interface WhatWouldYouDoItem {
  id: string;
  locationId: LocationId;
  level: CefrLevel;
  storyEs: string;
  storyHy: string;
  questionEs: string;
  hintWord: string;
  hintStarter: string;
  possibleAnswerEs: string;
  possibleAnswerHy: string;
  expectedKeywords: string[];
}

export interface SurpriseScenario {
  id: string;
  locationId: LocationId;
  titleEs: string;
  titleHy: string;
  openingEs: string;
  openingHy: string;
  twistEs: string;
  twistHy: string;
  followUpEs: string;
  followUpHy: string;
  hintHy: string;
  sampleAnswerEs: string;
  expectedKeywords: string[];
}

export interface SentenceTask {
  id: string;
  locationId: LocationId;
  level: CefrLevel;
  hy: string;
  correctEs: string;
  words: string[];
}

export interface QuickReplyItem {
  id: string;
  locationId: LocationId;
  role: string;
  questionEs: string;
  questionHy: string;
  sampleAnswerEs: string;
  expectedKeywords: string[];
}

export interface ErrorDetectiveItem {
  id: string;
  locationId: LocationId;
  level: CefrLevel;
  contextEs: string;
  wrongEs: string;
  correctEs: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanationHy: string;
}

export interface MissionStep {
  id: string;
  zoneEs: string;
  speaker: string;
  type: 'choice' | 'speak' | 'error';
  promptEs: string;
  promptHy: string;
  hintHy?: string;
  options?: Array<{ es?: string; text?: string; isCorrect: boolean; feedbackHy?: string }>;
  wrongEs?: string;
  sampleAnswerEs?: string;
  expectedKeywords?: string[];
}

export interface Mission {
  id: string;
  locationId: LocationId;
  titleEs: string;
  titleHy: string;
  descriptionHy: string;
  level: CefrLevel;
  steps: MissionStep[];
}

export interface EvaluateResult {
  accepted: boolean;
  quality: 'excelente' | 'bueno' | 'mejorable' | 'incorrecto';
  naturalVersion: string;
  feedbackEs: string;
  feedbackHy: string;
  usedFallback?: boolean;
}

export interface ProgressState {
  xp: number;
  independentAnswers: number;
  learnedPhrases: string[];
  completedDialogs: string[];
  completedMode3Dialogs: string[];
  completedGames: string[];
  missionStars: Record<string, number>;
  locationPoints: Record<LocationId, number>;
  achievements: string[];
  streakDays: number;
}
