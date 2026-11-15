import React, { useEffect, useState } from 'react';
import { Play, Square, Languages, ArrowLeft } from 'lucide-react';
import { PhraseText } from './PhraseText';
import { speakSpanish, stopSpeaking } from './speech';

interface LeccionLine {
  id: string;
  speakerEs: string;
  speakerHy: string;
  es: string;
  hy: string;
  role: 'juan' | 'marta' | 'camarera';
}

interface LeccionPart {
  id: string;
  titleEs: string;
  titleHy: string;
  lines: LeccionLine[];
}

const LECCION_5_PARTS: LeccionPart[] = [
  {
    id: 'parte-1',
    titleEs: 'Parte 1',
    titleHy: 'Մաս 1',
    lines: [
      {
        id: 'l5-1',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿Comemos aquí o buscamos algún sitio mejor?',
        hy: 'Այստե՞ղ ուտենք, թե՞ ավելի լավ տեղ փնտրենք։',
      },
      {
        id: 'l5-2',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Ya es hora de comer y, la verdad es que tengo mucha hambre.',
        hy: 'Արդեն ճաշելու ժամանակն է, և, ճիշտն ասած, ես շատ սոված եմ։',
      },
    ],
  },
  {
    id: 'parte-2',
    titleEs: 'Parte 2',
    titleHy: 'Մաս 2',
    lines: [
      {
        id: 'l5-3',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Entonces, entramos. Creo que a estas horas nos va a ser difícil encontrar algo mejor.',
        hy: 'Այդ դեպքում ներս մտնենք։ Կարծում եմ՝ այս ժամին մեզ համար դժվար կլինի ավելի լավ տեղ գտնել։',
      },
      {
        id: 'l5-4',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Vienen ustedes a comer?',
        hy: 'Դուք ճաշելո՞ւ եք եկել։',
      },
      {
        id: 'l5-5',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Sí. Hay menú, ¿verdad?',
        hy: 'Այո։ Համալիր ճաշացանկ ունեք, չէ՞։',
      },
      {
        id: 'l5-6',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Les importa esperar un cuarto de hora? Por ahora no tenemos mesas libres.',
        hy: 'Դեմ չե՞ք լինի տասնհինգ րոպե սպասել։ Առայժմ ազատ սեղաններ չունենք։',
      },
      {
        id: 'l5-7',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'No tenemos prisa. Podemos esperar.',
        hy: 'Մենք չենք շտապում։ Կարող ենք սպասել։',
      },
      {
        id: 'l5-8',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Qué desean?',
        hy: 'Ի՞նչ կցանկանայիք պատվիրել։',
      },
      {
        id: 'l5-9',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿Qué hay de primero?',
        hy: 'Ի՞նչ ունեք որպես առաջին ուտեստ։',
      },
      {
        id: 'l5-10',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'Sopa de marisco o de cocido, canelones, ensalada mixta, entremeses variados...',
        hy: 'Ծովամթերքով ապուր կամ մսով և բանջարեղենով ապուր, կանելոններ, խառը աղցան, տարբեր տեսակի նախուտեստներ...',
      },
      {
        id: 'l5-11',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Para mí, una sopa de marisco.',
        hy: 'Ինձ համար՝ մեկ ծովամթերքով ապուր։',
      },
      {
        id: 'l5-12',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'La ensalada mixta, ¿lleva atún?',
        hy: 'Խառը աղցանը թունա պարունակո՞ւմ է։',
      },
      {
        id: 'l5-13',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'Sí, pero podemos quitarlo, si no le gusta.',
        hy: 'Այո, բայց կարող ենք այն հանել, եթե Ձեզ դուր չի գալիս։',
      },
      {
        id: 'l5-14',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Muy bien. Entonces, una ensalada.',
        hy: 'Շատ լավ։ Այդ դեպքում՝ մեկ աղցան։',
      },
      {
        id: 'l5-15',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'De segundo, pueden elegir entre merluza a la romana, paella y chuletas de cordero...',
        hy: 'Որպես երկրորդ ուտեստ կարող եք ընտրել խմորի մեջ տապակած հեկ ձուկ, պաելյա կամ գառան կոտլետներ...',
      },
      {
        id: 'l5-16',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿Con guarnición?',
        hy: 'Խավարտո՞վ։',
      },
      {
        id: 'l5-17',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'Patatas fritas o un poco de verdura.',
        hy: 'Տապակած կարտոֆիլ կամ մի քիչ բանջարեղեն։',
      },
      {
        id: 'l5-18',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿Qué me aconseja usted?',
        hy: 'Ի՞նչ խորհուրդ կտաք ինձ։',
      },
      {
        id: 'l5-19',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'La paella está muy buena, es la especialidad de la casa.',
        hy: 'Պաելյան շատ համեղ է, դա մեր ռեստորանի ֆիրմային ուտեստն է։',
      },
      {
        id: 'l5-20',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Pues para mí, una paella.',
        hy: 'Դե ուրեմն, ինձ համար՝ մեկ պաելյա։',
      },
      {
        id: 'l5-21',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Yo voy a tomar lo mismo.',
        hy: 'Ես էլ նույնը կվերցնեմ։',
      },
      {
        id: 'l5-22',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Para beber?',
        hy: 'Իսկ խմելո՞ւ համար։',
      },
      {
        id: 'l5-23',
        speakerEs: 'Juan (a Marta)',
        speakerHy: 'Խուան (Մարտային)',
        role: 'juan',
        es: '¿Quieres una caña?',
        hy: 'Մի բաժակ գարեջուր ուզո՞ւմ ես։',
      },
      {
        id: 'l5-24',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Mejor, vino. No me gusta la cerveza.',
        hy: 'Ավելի լավ է՝ գինի։ Ես գարեջուր չեմ սիրում։',
      },
      {
        id: 'l5-25',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Una botella de agua mineral y media de vino tinto.',
        hy: 'Մեկ շիշ հանքային ջուր և կես շիշ կարմիր գինի։',
      },
      {
        id: 'l5-26',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Mmm, parece que la paella está muy buena.',
        hy: 'Մմմ, կարծես պաելյան շատ համեղ է։',
      },
      {
        id: 'l5-27',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Sí, está riquísima. ¿Vamos a pedir otra?',
        hy: 'Այո, անչափ համեղ է։ Եվս մեկը պատվիրե՞նք։',
      },
      {
        id: 'l5-28',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'No hace falta, ya no tengo hambre. Y el vino, ¿qué tal está?',
        hy: 'Կարիք չկա, ես արդեն սոված չեմ։ Իսկ գինին ինչպե՞սն է։',
      },
      {
        id: 'l5-29',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'No está mal.',
        hy: 'Վատը չէ։',
      },
      {
        id: 'l5-30',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Van a pedir algo de postre? Hay fruta del tiempo, helado y arroz con leche.',
        hy: 'Որևէ աղանդեր պատվիրելո՞ւ եք։ Ունենք սեզոնային մրգեր, պաղպաղակ և կաթնային բրնձով աղանդեր։',
      },
      {
        id: 'l5-31',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Yo quiero un café con leche, no, mejor, un cortado.',
        hy: 'Ես կուզեմ կաթով սուրճ, չէ, ավելի լավ է՝ մեկ կորտադո։',
      },
      {
        id: 'l5-32',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: '¿Y el señor?',
        hy: 'Իսկ պարո՞նը։',
      },
      {
        id: 'l5-33',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿No quedan trufas?',
        hy: 'Տրյուֆելներ չե՞ն մնացել։',
      },
      {
        id: 'l5-34',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'Sí, pero eso no está incluido en el precio del menú.',
        hy: 'Այո, բայց դրանք ներառված չեն համալիր ճաշացանկի գնի մեջ։',
      },
      {
        id: 'l5-35',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'Es igual, tráigame unas trufas, por favor.',
        hy: 'Ոչինչ, մի քանի տրյուֆել բերեք ինձ, խնդրում եմ։',
      },
      {
        id: 'l5-36',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: 'La cuenta, cuando pueda.',
        hy: 'Հաշիվը, երբ կարողանաք։',
      },
      {
        id: 'l5-37',
        speakerEs: 'Camarera',
        speakerHy: 'Մատուցողուհի',
        role: 'camarera',
        es: 'Enseguida.',
        hy: 'Անմիջապես։',
      },
    ],
  },
  {
    id: 'parte-3',
    titleEs: 'Parte 3',
    titleHy: 'Մաս 3',
    lines: [
      {
        id: 'l5-38',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¡¡¡Treinta y cinco euros!!! ¡Y de menú!',
        hy: 'Երեսունհինգ եվրո՜։ Եվ այն էլ համալիր ճաշացանկի համա՜ր։',
      },
      {
        id: 'l5-39',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Deben de ser las trufas...',
        hy: 'Երևի տրյուֆելների պատճառով է...',
      },
      {
        id: 'l5-40',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¿Cómo que las trufas? ¡Esto es un atraco!',
        hy: 'Ի՞նչ է նշանակում՝ տրյուֆելների պատճառով։ Սա իսկական թալա՜ն է։',
      },
      {
        id: 'l5-41',
        speakerEs: 'Marta',
        speakerHy: 'Մարտա',
        role: 'marta',
        es: 'Anda, mi vida, paga y vámonos.',
        hy: 'Դե լավ, սիրելիս, վճարիր ու գնանք։',
      },
      {
        id: 'l5-42',
        speakerEs: 'Juan',
        speakerHy: 'Խուան',
        role: 'juan',
        es: '¡Pero no voy a dejar propina! ¡Ni un duro!',
        hy: 'Բայց ես թեյավճար չեմ թողնելու։ Ոչ մի կոպեկ։',
      },
    ],
  },
];

const COMENTARIOS = [
  { num: '¹', es: 'Tráigame', hy: 'Բերեք ինձ, խնդրում եմ։' },
  { num: '²', es: 'Cuando pueda', hy: 'Երբ կարողանաք։' },
  { num: '³', es: '¡Esto es un atraco!', hy: 'Սա իսկական թալան է։' },
  { num: '⁴', es: 'Anda, mi vida, paga y vámonos', hy: 'Դե լավ, սիրելիս, վճարիր ու գնանք։' },
  { num: '⁵', es: '¡Ni un duro!', hy: 'Ոչ մի կոպեկ։' },
];

interface Leccion5ViewProps {
  onRevealPhrase: (phraseEs: string) => void;
  onBack?: () => void;
}

export const Leccion5View: React.FC<Leccion5ViewProps> = ({ onRevealPhrase, onBack }) => {
  const [playingPartId, setPlayingPartId] = useState<string | null>(null);
  const [activePartTab, setActivePartTab] = useState<'all' | 'parte-1' | 'parte-2' | 'parte-3'>('all');

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handlePlayPart = (part: LeccionPart) => {
    if (playingPartId === part.id) {
      stopSpeaking();
      setPlayingPartId(null);
      return;
    }

    stopSpeaking();
    setPlayingPartId(part.id);
    let idx = 0;

    const speakNext = () => {
      if (idx >= part.lines.length) {
        setPlayingPartId(null);
        return;
      }
      const line = part.lines[idx];
      idx += 1;
      speakSpanish(line.es, {
        rate: 0.94,
        onEnd: () => {
          setTimeout(speakNext, 320);
        },
      });
    };

    speakNext();
  };

  const visibleParts =
    activePartTab === 'all'
      ? LECCION_5_PARTS
      : LECCION_5_PARTS.filter((p) => p.id === activePartTab);

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <section className="rounded-3xl bg-white border border-[#E6DCD5] p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#EA580C]">
              Lección 5 · Դաս 5 — Ռեստորանում
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417]">
              Lección 5 — En el restaurante
            </h1>
            <p className="text-sm font-semibold text-[#7C1D36]">
              1. Escucha y traduce el diálogo · Լսեք և թարգմանեք երկխոսությունը։
            </p>
            <p className="text-xs text-[#4A3B3F] flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-[#EA580C]" />
              <span>Սեղմիր ցանկացած իսպաներեն արտահայտության վրա՝ հայերեն թարգմանությունը բացելու համար։</span>
            </p>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          )}
        </div>

        {/* Part Filter */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: 'Todo el diálogo · Ամբողջը' },
            { id: 'parte-1', label: 'Parte 1 — Մաս 1' },
            { id: 'parte-2', label: 'Parte 2 — Մաս 2' },
            { id: 'parte-3', label: 'Parte 3 — Մաս 3' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePartTab(tab.id as typeof activePartTab)}
              className={`min-h-10 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activePartTab === tab.id
                  ? 'bg-[#7C1D36] text-white border-[#7C1D36]'
                  : 'bg-[#FAF7F2] text-[#4A3B3F] border-[#E2D5CC] hover:border-[#EA580C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Dialogue Parts */}
      {visibleParts.map((part) => {
        const isPlaying = playingPartId === part.id;
        return (
          <section
            key={part.id}
            className="rounded-3xl bg-white border border-[#E6DCD5] p-5 md:p-7 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EFE5DE]">
              <div>
                <h2 className="text-xl font-extrabold text-[#7C1D36]">
                  {part.titleEs} — {part.titleHy}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handlePlayPart(part)}
                className={`min-h-10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-[#EA580C] text-white'
                    : 'bg-[#FACC15] text-[#1E1417] hover:bg-[#EAB308]'
                }`}
              >
                {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Detener audio' : `Escuchar ${part.titleEs}`}</span>
              </button>
            </div>

            <div className="space-y-3">
              {part.lines.map((line) => {
                const speakerBadgeColor =
                  line.role === 'camarera'
                    ? 'text-[#7C1D36]'
                    : line.role === 'marta'
                      ? 'text-[#EA580C]'
                      : 'text-[#854D0E]';

                const bubbleSurface =
                  line.role === 'camarera'
                    ? 'bg-[#FDF2F4] border-[#F2CDD6]'
                    : line.role === 'marta'
                      ? 'bg-[#FFF7ED] border-[#FED7AA]'
                      : 'bg-[#FEFCE8] border-[#FDE68A]';

                return (
                  <div
                    key={line.id}
                    className={`rounded-2xl p-4 border ${bubbleSurface}`}
                  >
                    <div className={`text-xs font-extrabold mb-1.5 ${speakerBadgeColor}`}>
                      {line.speakerEs} · {line.speakerHy}
                    </div>
                    <PhraseText
                      es={line.es}
                      hy={line.hy}
                      onRevealTranslation={onRevealPhrase}
                      showSlowButton
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Comentario Table */}
      <section className="rounded-3xl bg-white border border-[#E6DCD5] p-6 md:p-7 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1E1417]">
            Comentario — Մեկնաբանություններ
          </h2>
          <p className="text-xs text-[#4A3B3F] mt-1">
            Սլայդի վերջում նշված արտահայտությունները․ սեղմիր արտահայտության վրա՝ լսելու և հայերեն թարգմանությունը բացելու համար։
          </p>
        </div>

        <div className="space-y-2.5">
          {COMENTARIOS.map((item) => (
            <div
              key={item.num}
              className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 flex items-start gap-3"
            >
              <span className="text-sm font-extrabold text-[#7C1D36] pt-0.5 shrink-0">{item.num}</span>
              <div className="flex-1">
                <PhraseText
                  es={item.es}
                  hy={item.hy}
                  onRevealTranslation={onRevealPhrase}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
