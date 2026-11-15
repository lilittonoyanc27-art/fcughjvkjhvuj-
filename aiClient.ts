import { CefrLevel, EvaluateResult } from './types';

export async function checkAiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.aiAvailable);
  } catch {
    return false;
  }
}

export async function evaluateStudentResponse(params: {
  userResponse: string;
  promptEs: string;
  sampleAnswerEs: string;
  expectedKeywords?: string[];
  level: CefrLevel;
  contextHy?: string;
}): Promise<EvaluateResult> {
  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error('Server evaluate failed');
    }
    return (await res.json()) as EvaluateResult;
  } catch {
    const trimmed = params.userResponse.trim();
    if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
      return {
        accepted: false,
        quality: 'incorrecto',
        naturalVersion: params.sampleAnswerEs,
        feedbackEs: 'Intenta escribir una frase más completa.',
        feedbackHy: 'Փորձիր գրել ավելի ամբողջական նախադասություն իսպաներենով։',
        usedFallback: true,
      };
    }
    return {
      accepted: true,
      quality: 'bueno',
      naturalVersion: params.sampleAnswerEs,
      feedbackEs: '¡Buena respuesta! Compárala con esta opción natural.',
      feedbackHy: 'Լավ պատասխան է։ Համեմատիր այն առաջարկվող բնական տարբերակի հետ։',
      usedFallback: true,
    };
  }
}

export async function sendFreeChatTurn(params: {
  role: string;
  level: CefrLevel;
  history: Array<{ sender: 'ai' | 'user'; text: string }>;
  userMessage: string;
}): Promise<{
  replyEs: string;
  replyHy: string;
  hintHy: string;
  suggestedOptions: Array<{ es: string; hy: string }>;
  correctionEs: string;
  correctionHy: string;
  usedFallback: boolean;
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Error al conectar con el servidor');
  }
  const data = await res.json();
  return {
    ...data,
    suggestedOptions: Array.isArray(data.suggestedOptions) ? data.suggestedOptions : [],
  };
}
