export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedEsVoice: SpeechSynthesisVoice | null = null;

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return cachedEsVoice;

  const exactEsEs = voices.find((v) => v.lang.toLowerCase() === 'es-es');
  if (exactEsEs) {
    cachedEsVoice = exactEsEs;
    return exactEsEs;
  }

  const startsWithEsEs = voices.find((v) => v.lang.toLowerCase().startsWith('es-es'));
  if (startsWithEsEs) {
    cachedEsVoice = startsWithEsEs;
    return startsWithEsEs;
  }

  const anyEs = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (anyEs) {
    cachedEsVoice = anyEs;
    return anyEs;
  }

  return null;
}

export function speakSpanish(
  text: string,
  options?: { rate?: number; onStart?: () => void; onEnd?: () => void }
): void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = options?.rate ?? 0.96;
    utterance.pitch = 1.0;

    const voice = pickSpanishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    options?.onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function startSpanishDictation(callbacks: {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (messageHy: string) => void;
  onEnd: () => void;
}): (() => void) | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    callbacks.onError('Այս դիտարկիչում խոսքի ճանաչումը հասանելի չէ։ Խնդրում ենք գրել պատասխանը ստորև։');
    callbacks.onEnd();
    return null;
  }

  try {
    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let fullText = '';
      let hasFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        fullText += res[0].transcript + ' ';
        if (res.isFinal) hasFinal = true;
      }
      callbacks.onTranscript(fullText.trim(), hasFinal);
    };

    recognition.onerror = (event) => {
      const code = event.error || 'unknown';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        callbacks.onError('Խոսափողի թույլտվությունը մերժված է։ Կարող ես պատասխանել տեքստով։');
      } else if (code === 'no-speech') {
        callbacks.onError('Ձայն չլսվեց։ Փորձիր կրկին կամ գրիր պատասխանը։');
      } else {
        callbacks.onError('Խոսքի ճանաչման սխալ։ Կարող ես գրել պատասխանը տեքստով։');
      }
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    recognition.start();
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop failure
      }
    };
  } catch {
    callbacks.onError('Հնարավոր չեղավ միացնել խոսափողը։ Գրիր պատասխանը ստորև։');
    callbacks.onEnd();
    return null;
  }
}
