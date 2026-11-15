import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShoppingBasket,
  Shirt,
  Plane,
  Utensils,
  KeyRound,
  Sparkles,
  Volume2,
  BookOpen,
} from 'lucide-react';
import { LOCATIONS } from './dataLocations';
import { ALL_DIALOGUES } from './dataDialogsPart2';
import { CefrLevel, Dialogue, EvaluateResult, LocationId, ProgressState } from './types';
import { DialoguePlayer } from './DialoguePlayer';
import { PhraseText } from './PhraseText';
import { VoiceInputBar } from './VoiceInputBar';
import { evaluateStudentResponse } from './aiClient';
import { speakSpanish } from './speech';

interface LocationSceneProps {
  locationId: LocationId;
  activeLevel: CefrLevel;
  progress: ProgressState;
  onBackToMap: () => void;
  onRevealPhrase: (phraseEs: string) => void;
  onCompleteDialogue: (dialogueId: string, mode: 'listen' | 'complete' | 'speak', xpAmount: number) => void;
  onRecordIndependentAnswer: (locId: LocationId, xpAmount?: number) => void;
  onOpenLeccion5?: () => void;
}

const SUPERMARKET_SHELF = [
  { id: 'aceite', es: 'Aceite de oliva virgen extra', hy: 'Ձիթապտղի յուղ', price: 4.5, inList: true },
  { id: 'tomates', es: 'Tomates maduros (1 kg)', hy: 'Հասած լոլիկներ (1 կգ)', price: 2.2, inList: true },
  { id: 'huevos', es: 'Docena de huevos camperos', hy: 'Մեկ դյուժին ձու', price: 2.8, inList: true },
  { id: 'leche', es: 'Leche sin lactosa', hy: 'Առանց լակտոզայի կաթ', price: 1.4, inList: true },
  { id: 'galletas', es: 'Galletas de chocolate', hy: 'Շոկոլադե թխվածքաբլիթ', price: 1.9, inList: false },
  { id: 'manzanas', es: 'Manzanas verdes', hy: 'Կանաչ խնձորներ', price: 2.1, inList: false },
];

const SHOP_ITEMS = [
  { id: 'sudadera', es: 'Sudadera urbana', hy: 'Քաղաքային հուդի', price: 32, colors: ['Verde', 'Negro'], sizes: ['S', 'M', 'L'] },
  { id: 'camiseta', es: 'Camiseta gráfica', hy: 'Նկարով շապիկ', price: 18, colors: ['Naranja', 'Blanco'], sizes: ['S', 'M', 'L'] },
  { id: 'zapatillas', es: 'Zapatillas deportivas', hy: 'Մարզակոշիկներ', price: 44, colors: ['Blanco', 'Azul marino'], sizes: ['39', '40', '41'] },
  { id: 'gorra', es: 'Gorra clásica', hy: 'Դասական գլխարկ', price: 15, colors: ['Negro', 'Amarillo'], sizes: ['Única'] },
];

const RESTAURANT_MENU = [
  { id: 'tortilla', es: 'Tortilla de patatas', hy: 'Կարտոֆիլով տորտիլյա', price: 8.5, tag: 'Sin carne' },
  { id: 'croquetas', es: 'Croquetas de jamón', hy: 'Խոզապուխտով կրոկետներ', price: 9.0, tag: 'Con carne' },
  { id: 'gazpacho', es: 'Gazpacho andaluz', hy: 'Անդալուզյան գասպաչո', price: 6.5, tag: 'Vegano' },
  { id: 'tarta', es: 'Tarta de queso casera', hy: 'Տնական չիզքեյք', price: 5.5, tag: 'Postre' },
];

const AIRPORT_ZONES = [
  {
    id: 'facturacion',
    nameEs: 'Mostrador de facturación',
    nameHy: 'Ուղեբեռի հաշվառում',
    staffEs: 'Tu maleta pesa 25 kg y el límite es 23 kg. ¿Qué vas a hacer?',
    staffHy: 'Ճամպրուկդ կշռում է 25 կգ՝ 23 կգ սահմանի փոխարեն։ Ի՞նչ ես անելու։',
    sampleEs: 'Voy a sacar un par de libros y ponerlos en mi mochila para no pagar exceso.',
    keywords: ['sacar', 'mochila', 'pagar', 'exceso', 'kilos'],
  },
  {
    id: 'seguridad',
    nameEs: 'Control de seguridad',
    nameHy: 'Անվտանգության ստուգում',
    staffEs: 'Llevas una botella de agua llena y un portátil en la mochila. ¿Qué le dices al agente?',
    staffHy: 'Ուսապարկիդ մեջ լցված ջրի շիշ և նոութբուք ունես։ Ի՞նչ ես ասում աշխատակցին։',
    sampleEs: 'Saco el portátil a otra bandeja y vacío la botella de agua antes de pasar.',
    keywords: ['portatil', 'bandeja', 'botella', 'vaciar', 'sacar'],
  },
  {
    id: 'puerta',
    nameEs: 'Puerta de embarque C38',
    nameHy: 'Նստեցման դարպաս C38',
    staffEs: 'Tu puerta cambió de la B14 a la C38 y quedan 12 minutos. Pregunta cómo llegar.',
    staffHy: 'Դարպասդ փոխվել է B14-ից C38, և մնացել է 12 րոպե։ Հարցրու՝ ինչպես հասնել։',
    sampleEs: 'Perdone, mi vuelo cambió a la puerta C38. ¿Cómo puedo llegar rápido?',
    keywords: ['puerta', 'c38', 'como', 'llegar', 'rapido'],
  },
  {
    id: 'equipaje',
    nameEs: 'Equipaje perdido',
    nameHy: 'Կորած ուղեբեռ',
    staffEs: 'Tu maleta no salió en la cinta al llegar. Descríbela y di en qué hotel estás.',
    staffHy: 'Ճամպրուկդ ժապավենի վրա դուրս չեկավ։ Նկարագրիր այն և նշիր հյուրանոցդ։',
    sampleEs: 'Mi maleta azul mediana no ha salido en la cinta. Me alojo en el Hotel El Sol.',
    keywords: ['maleta', 'cinta', 'hotel', 'color', 'azul'],
  },
];

const HOTEL_PROBLEMS = [
  {
    id: 'ac',
    labelEs: 'El aire acondicionado no funciona',
    labelHy: 'Օդորակիչը չի աշխատում',
    clerkEs: '¡Vaya, lo siento! ¿Hace mucho calor en la 308? ¿Prefieres que suba el técnico o cambiar de habitación?',
    clerkHy: 'Օ՜, ներողություն։ 308 սենյակում շա՞տ շոգ է։ Նախընտրում ես՝ տեխնիկ բարձրանա՞, թե՞ սենյակը փոխենք։',
    sampleEs: 'Sí, hace mucho calor. Si no se arregla rápido, prefiero cambiar de habitación.',
    keywords: ['calor', 'tecnico', 'cambiar', 'habitacion', 'prefiero'],
  },
  {
    id: 'card',
    labelEs: 'He perdido la tarjeta de la habitación',
    labelHy: 'Կորցրել եմ սենյակի քարտը',
    clerkEs: 'No pasa nada, ¿me dices tu nombre y número de habitación para hacerte una copia?',
    clerkHy: 'Ոչինչ, ասա անունդ և սենյակիդ համարը՝ կրկնօրինակ պատրաստելու համար։',
    sampleEs: 'Me llamo Aram y mi habitación es la 308. Muchas gracias.',
    keywords: ['nombre', 'llamo', 'habitacion', '308', 'gracias'],
  },
  {
    id: 'luggage',
    labelEs: 'Dejar la maleta tras el check-out',
    labelHy: 'Թողնել ճամպրուկը դուրս գալուց հետո',
    clerkEs: '¡Claro! La guardamos gratis en consigna. ¿A qué hora volverás a recogerla?',
    clerkHy: 'Իհարկե։ Անվճար կպահենք պահախցիկում։ Ժամը քանիսի՞ն կվերադառնաս վերցնելու։',
    sampleEs: 'Volveré a recogerla sobre las seis de la tarde porque mi vuelo sale por la noche.',
    keywords: ['seis', 'tarde', 'recogerla', 'vuelo', 'gracias'],
  },
];

export const LocationScene: React.FC<LocationSceneProps> = ({
  locationId,
  activeLevel,
  progress,
  onBackToMap,
  onRevealPhrase,
  onCompleteDialogue,
  onRecordIndependentAnswer,
  onOpenLeccion5,
}) => {
  const location = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const dialogs = ALL_DIALOGUES.filter((d) => d.locationId === locationId);
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [sceneTab, setSceneTab] = useState<'dialogues' | 'interactive' | 'phrases'>('dialogues');

  // Supermarket interactive state
  const [basket, setBasket] = useState<string[]>([]);
  const [cashierStep, setCashierStep] = useState(0);
  const [cashierInput, setCashierInput] = useState('');
  const [cashierFeedback, setCashierFeedback] = useState<EvaluateResult | null>(null);
  const [cashierLoading, setCashierLoading] = useState(false);

  // Boutique interactive state
  const [fittingCart, setFittingCart] = useState<Array<{ id: string; color: string; size: string; price: number; es: string }>>([]);
  const [selectedShopItem, setSelectedShopItem] = useState(SHOP_ITEMS[0]);
  const [selectedColor, setSelectedColor] = useState(SHOP_ITEMS[0].colors[0]);
  const [selectedSize, setSelectedSize] = useState(SHOP_ITEMS[0].sizes[1]);
  const [shopInput, setShopInput] = useState('');
  const [shopFeedback, setShopFeedback] = useState<EvaluateResult | null>(null);
  const [shopLoading, setShopLoading] = useState(false);

  // Restaurant interactive state
  const [pickedDishes, setPickedDishes] = useState<string[]>([]);
  const [restInput, setRestInput] = useState('');
  const [restFeedback, setRestFeedback] = useState<EvaluateResult | null>(null);
  const [restLoading, setRestLoading] = useState(false);

  // Hotel interactive state
  const [selectedHotelProblem, setSelectedHotelProblem] = useState(HOTEL_PROBLEMS[0]);
  const [hotelInput, setHotelInput] = useState('');
  const [hotelFeedback, setHotelFeedback] = useState<EvaluateResult | null>(null);
  const [hotelLoading, setHotelLoading] = useState(false);

  // Airport interactive state
  const [selectedAirportZone, setSelectedAirportZone] = useState(AIRPORT_ZONES[0]);
  const [airportInput, setAirportInput] = useState('');
  const [airportFeedback, setAirportFeedback] = useState<EvaluateResult | null>(null);
  const [airportLoading, setAirportLoading] = useState(false);

  if (selectedDialogue) {
    return (
      <DialoguePlayer
        dialogue={selectedDialogue}
        locationTitleEs={location.titleEs}
        locationTitleHy={location.titleHy}
        activeLevel={activeLevel}
        onRevealPhrase={onRevealPhrase}
        onCompleteDialogue={onCompleteDialogue}
        onRecordIndependentAnswer={() => onRecordIndependentAnswer(location.id, 15)}
        onBack={() => setSelectedDialogue(null)}
      />
    );
  }

  const cashierQuestions = [
    {
      qEs: '¿Necesitas una bolsa para llevar la compra?',
      qHy: 'Տոպրակ պե՞տք է գնումները տանելու համար։',
      sample: 'No gracias, traigo mi propia bolsa.',
      keywords: ['bolsa', 'si', 'no', 'gracias', 'mia'],
    },
    {
      qEs: '¿Tienes la tarjeta de cliente?',
      qHy: 'Հաճախորդի քարտ ունե՞ս։',
      sample: 'No, no la tengo todavía.',
      keywords: ['si', 'no', 'tengo', 'tarjeta'],
    },
    {
      qEs: '¿Vas a pagar en efectivo o con tarjeta?',
      qHy: 'Վճարելու ես կանխի՞կ, թե՞ քարտով։',
      sample: 'Voy a pagar con tarjeta, por favor.',
      keywords: ['tarjeta', 'efectivo', 'pagar'],
    },
  ];

  const budgetUsed = fittingCart.reduce((sum, i) => sum + i.price, 0);
  const budgetLimit = 60;

  return (
    <div className="space-y-8">
      {/* Location Hero Scene Card */}
      <section className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className={`lg:col-span-4 bg-gradient-to-br ${location.accentBg} p-6 md:p-8 flex flex-col justify-between min-h-48`}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center text-[#FACC15]">
              {locationId === 'restaurante' && <Utensils className="w-7 h-7" />}
              {locationId === 'supermercado' && <ShoppingBasket className="w-7 h-7" />}
              {locationId === 'compras' && <Shirt className="w-7 h-7" />}
              {locationId === 'hotel' && <KeyRound className="w-7 h-7" />}
              {locationId === 'aeropuerto' && <Plane className="w-7 h-7" />}
            </div>
            <div className="space-y-1 pt-6">
              <div className="text-xs font-bold text-[#FACC15]">
                {location.characterRole}
              </div>
              <div className="text-2xl font-extrabold text-white">
                {location.characterName}
              </div>
              <div className="text-xs text-white/85">
                {location.subtitleEs}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#EA580C]">
                  {location.titleHy} · Personaje: {location.characterName} ({location.characterRole})
                </span>
                <button
                  type="button"
                  onClick={onBackToMap}
                  className="min-h-10 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] text-[#1E1417] hover:border-[#7C1D36] text-xs font-semibold flex items-center gap-1.5 border border-[#E2D5CC] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al mapa</span>
                </button>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417]">{location.titleEs}</h1>
              <p className="text-sm text-[#4A3B3F] leading-relaxed">{location.subtitleHy}</p>
            </div>

            {locationId === 'restaurante' && onOpenLeccion5 && (
              <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C1D36]">
                  <BookOpen className="w-4 h-4 text-[#EA580C]" />
                  <span>Lección 5 — En el restaurante · Դաս 5 — Ռեստորանում</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenLeccion5}
                  className="min-h-9 px-3.5 py-1.5 rounded-lg bg-[#7C1D36] hover:bg-[#64152A] text-white text-xs font-bold cursor-pointer"
                >
                  Abrir Lección 5
                </button>
              </div>
            )}

            {/* Scene Navigation Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F5EFEA] p-1.5 rounded-xl border border-[#E2D5CC]">
              <button
                type="button"
                onClick={() => setSceneTab('dialogues')}
                className={`min-h-10 px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                  sceneTab === 'dialogues'
                    ? 'bg-[#7C1D36] text-white'
                    : 'text-[#4A3B3F] hover:text-[#1E1417]'
                }`}
              >
                5 Diálogos reales
              </button>
              <button
                type="button"
                onClick={() => setSceneTab('interactive')}
                className={`min-h-10 px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                  sceneTab === 'interactive'
                    ? 'bg-[#FACC15] text-[#1E1417]'
                    : 'text-[#4A3B3F] hover:text-[#1E1417]'
                }`}
              >
                Escena interactiva
              </button>
              <button
                type="button"
                onClick={() => setSceneTab('phrases')}
                className={`min-h-10 px-3 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                  sceneTab === 'phrases'
                    ? 'bg-[#EA580C] text-white'
                    : 'text-[#4A3B3F] hover:text-[#1E1417]'
                }`}
              >
                Frases clave
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TAB 1: 5 DIALOGUES */}
      {sceneTab === 'dialogues' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-[#1E1417]">
              Situaciones de conversación · Խոսակցական իրավիճակներ
            </h2>
            <span className="text-xs font-medium text-[#6E5B60]">
              Ընտրիր իրավիճակը՝ 3 ռեժիմներով անցնելու համար
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dialogs.map((dlg) => {
              const isDone = progress.completedDialogs.includes(dlg.id);
              const isMode3Done = progress.completedMode3Dialogs.includes(dlg.id);
              return (
                <div
                  key={dlg.id}
                  className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs hover:border-[#EA580C] p-5 flex flex-col justify-between space-y-4 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6E5B60]">
                      <span>Situación {dlg.situationNumber} · Nivel {dlg.level} · {dlg.lines.length} réplicas</span>
                      {isMode3Done ? (
                        <span className="text-[#166534] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dominado
                        </span>
                      ) : isDone ? (
                        <span className="text-[#B45309] font-bold">En progreso</span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1E1417]">{dlg.titleEs}</h3>
                    <p className="text-sm text-[#7C1D36] font-semibold">{dlg.titleHy}</p>
                    <p className="text-xs text-[#4A3B3F] leading-relaxed">{dlg.summaryHy}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDialogue(dlg)}
                    className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] hover:bg-[#7C1D36] hover:border-[#7C1D36] hover:text-white text-[#1E1417] font-bold text-sm flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Practicar diálogo (3 modos)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: DEDICATED INTERACTIVE SCENE PER LOCATION */}
      {sceneTab === 'interactive' && (
        <section className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 md:p-7 space-y-6">
          {/* SUPERMERCADO INTERACTIVE */}
          {locationId === 'supermercado' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1E1417] flex items-center gap-2">
                    <ShoppingBasket className="w-5 h-5 text-[#7C1D36]" />
                    <span>Supermercado interactivo · Գնումների ցուցակ և դրամարկղ</span>
                  </h2>
                  <p className="text-sm text-[#4A3B3F] mt-1">
                    Գտիր հայերեն ցուցակի 4 ապրանքները դարակներում, լսիր իսպաներեն անունը, դիր զամբյուղը և պատասխանիր գանձապահին։
                  </p>
                </div>
                <div className="text-sm font-bold text-[#EA580C] tabular-nums">
                  Cesta: {basket.length} / 4 necesarios
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 space-y-3">
                  <div className="text-sm font-bold text-[#7C1D36]">Lista en armenio · Գնումների ցուցակ</div>
                  <ul className="space-y-2 text-sm">
                    {SUPERMARKET_SHELF.filter((i) => i.inList).map((item) => {
                      const found = basket.includes(item.id);
                      return (
                        <li
                          key={item.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                            found
                              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] font-semibold'
                              : 'bg-white border-[#E2D5CC] text-[#1E1417]'
                          }`}
                        >
                          <span>{item.hy}</span>
                          {found && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPERMARKET_SHELF.map((item) => {
                    const inBasket = basket.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
                          inBasket
                            ? 'bg-[#FEFCE8] border-[#FACC15]'
                            : 'bg-[#FAF7F2] border-[#E2D5CC]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#1E1417]">{item.es}</div>
                            <div className="text-xs text-[#6E5B60] tabular-nums mt-0.5">{item.price.toFixed(2)} €</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakSpanish(item.es)}
                            className="p-2 rounded-lg bg-white border border-[#E2D5CC] text-[#7C1D36] hover:bg-[#FDF2F4] cursor-pointer"
                            title="Լսել իսպաներեն"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            speakSpanish(item.es);
                            setBasket((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((x) => x !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          className={`min-h-10 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                            inBasket
                              ? 'bg-[#7C1D36] text-white'
                              : 'bg-[#FACC15] text-[#1E1417] hover:bg-[#EAB308]'
                          }`}
                        >
                          {inBasket ? 'En la cesta ✓ (Quitar)' : 'Poner en la cesta'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cashier 3 Questions */}
              <div className="rounded-xl bg-[#FAF7F2] border border-[#F2CDD6] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#7C1D36]">
                    En la caja · Դրամարկղ ({cashierStep + 1} / {cashierQuestions.length})
                  </div>
                </div>
                <PhraseText
                  es={`Cajero: ${cashierQuestions[cashierStep].qEs}`}
                  hy={cashierQuestions[cashierStep].qHy}
                  onRevealTranslation={onRevealPhrase}
                  textSize="lg"
                />
                <VoiceInputBar
                  value={cashierInput}
                  onChange={setCashierInput}
                  loading={cashierLoading}
                  onSubmit={async () => {
                    setCashierLoading(true);
                    const q = cashierQuestions[cashierStep];
                    const res = await evaluateStudentResponse({
                      userResponse: cashierInput,
                      promptEs: q.qEs,
                      sampleAnswerEs: q.sample,
                      expectedKeywords: q.keywords,
                      level: activeLevel,
                      contextHy: q.qHy,
                    });
                    setCashierLoading(false);
                    setCashierFeedback(res);
                    if (res.accepted) onRecordIndependentAnswer('supermercado', 15);
                  }}
                />
                {cashierFeedback && (
                  <div className="rounded-xl bg-white p-4 space-y-2 border border-[#E6DCD5]">
                    <div className="text-sm text-[#1E1417] font-medium">{cashierFeedback.feedbackHy}</div>
                    <div className="text-xs text-[#7C1D36] font-semibold">
                      Natural: {cashierFeedback.naturalVersion}
                    </div>
                    {cashierFeedback.accepted && (
                      <button
                        type="button"
                        onClick={() => {
                          setCashierInput('');
                          setCashierFeedback(null);
                          setCashierStep((s) => (s + 1) % cashierQuestions.length);
                        }}
                        className="mt-2 px-4 py-2 rounded-lg bg-[#EA580C] text-white font-bold text-xs cursor-pointer"
                      >
                        Siguiente pregunta de caja
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DE COMPRAS INTERACTIVE */}
          {locationId === 'compras' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE5DE]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1E1417] flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-[#EA580C]" />
                    <span>Tienda y probador virtual · Վիրտուալ հանդերձարան (Բյուջե 60 €)</span>
                  </h2>
                  <p className="text-sm text-[#4A3B3F] mt-1">
                    Ընտրիր հագուստ 60 € բյուջեով, փորձիր գույնն ու չափսը և արձագանքիր վաճառողի հարցին։
                  </p>
                </div>
                <div className={`text-sm font-bold tabular-nums ${budgetUsed > budgetLimit ? 'text-[#EA580C]' : 'text-[#166534]'}`}>
                  Presupuesto usado: {budgetUsed} € / {budgetLimit} €
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-3">
                  {SHOP_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedShopItem(item);
                        setSelectedColor(item.colors[0]);
                        setSelectedSize(item.sizes[0]);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                        selectedShopItem.id === item.id
                          ? 'bg-[#FDF2F4] border-[#7C1D36]'
                          : 'bg-[#FAF7F2] border-[#E2D5CC] hover:border-[#EA580C]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[#1E1417] text-sm">{item.es}</div>
                        <div className="text-xs text-[#4A3B3F]">{item.hy}</div>
                      </div>
                      <span className="font-extrabold text-[#7C1D36] tabular-nums">{item.price} €</span>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-6 rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-4">
                  <div className="text-xs font-bold text-[#EA580C]">Probador virtual · Փորձասենյակ</div>
                  <h3 className="text-lg font-extrabold text-[#1E1417]">{selectedShopItem.es} — {selectedShopItem.price} €</h3>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#4A3B3F]">Color:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedShopItem.colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            selectedColor === c
                              ? 'bg-[#FACC15] text-[#1E1417] border-[#EAB308]'
                              : 'bg-white text-[#4A3B3F] border-[#E2D5CC]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#4A3B3F]">Talla / Número:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedShopItem.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            selectedSize === s
                              ? 'bg-[#7C1D36] text-white border-[#7C1D36]'
                              : 'bg-white text-[#4A3B3F] border-[#E2D5CC]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      speakSpanish(`Me pruebo ${selectedShopItem.es} en color ${selectedColor}, talla ${selectedSize}`);
                      setFittingCart((prev) => [
                        ...prev,
                        {
                          id: `${selectedShopItem.id}-${Date.now()}`,
                          es: selectedShopItem.es,
                          color: selectedColor,
                          size: selectedSize,
                          price: selectedShopItem.price,
                        },
                      ]);
                    }}
                    className="w-full min-h-10 px-4 py-2 rounded-lg bg-[#EA580C] text-white font-bold text-sm hover:bg-[#C2410C] cursor-pointer"
                  >
                    Probar y añadir al carrito ({selectedShopItem.price} €)
                  </button>

                  {fittingCart.length > 0 && (
                    <div className="pt-2 border-t border-[#E2D5CC] space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#4A3B3F]">
                        <span>Tu selección ({fittingCart.length}):</span>
                        <button
                          type="button"
                          onClick={() => setFittingCart([])}
                          className="text-[#7C1D36] font-bold underline cursor-pointer"
                        >
                          Vaciar
                        </button>
                      </div>
                      {fittingCart.map((c) => (
                        <div key={c.id} className="text-xs text-[#1E1417] flex justify-between">
                          <span>{c.es} ({c.color}, {c.size})</span>
                          <span className="tabular-nums font-semibold">{c.price} €</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clerk Challenge */}
              <div className="rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-5 space-y-3">
                <PhraseText
                  es={`Dependiente: Lo siento, ese modelo en ${selectedColor} se acaba de agotar en tu talla. ¿Qué te gustaría hacer?`}
                  hy={`Վաճառող. Ներողություն, այդ մոդելից ${selectedColor} գույնը քո չափսով հենց նոր վերջացավ։ Ի՞նչ կցանկանաս անել։`}
                  onRevealTranslation={onRevealPhrase}
                />
                <VoiceInputBar
                  value={shopInput}
                  onChange={setShopInput}
                  loading={shopLoading}
                  onSubmit={async () => {
                    setShopLoading(true);
                    const res = await evaluateStudentResponse({
                      userResponse: shopInput,
                      promptEs: `Lo siento, no tenemos ${selectedShopItem.es} en ${selectedColor}. ¿Te gustaría probar otro color o modelo?`,
                      sampleAnswerEs: 'No pasa nada, ¿tiene este modelo en otro color o me recomienda algo parecido?',
                      expectedKeywords: ['otro', 'color', 'prefiero', 'talla', 'recomienda', 'parecido'],
                      level: activeLevel,
                    });
                    setShopLoading(false);
                    setShopFeedback(res);
                    if (res.accepted) onRecordIndependentAnswer('compras', 15);
                  }}
                />
                {shopFeedback && (
                  <div className="rounded-xl bg-white border border-[#E6DCD5] p-4 text-sm text-[#1E1417] space-y-1">
                    <div>{shopFeedback.feedbackHy}</div>
                    <div className="text-xs text-[#7C1D36] font-semibold">Natural: {shopFeedback.naturalVersion}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESTAURANTE INTERACTIVE */}
          {locationId === 'restaurante' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#EFE5DE]">
                <h2 className="text-xl font-extrabold text-[#1E1417] flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#EA580C]" />
                  <span>La carta de La Taberna · Ինտերակտիվ մենյու</span>
                </h2>
                <p className="text-sm text-[#4A3B3F] mt-1">
                  Ընտրիր ուտեստներ մենյուից, լսիր արտասանությունը և պատասխանիր մատուցողին ինքնուրույն։
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESTAURANT_MENU.map((dish) => {
                  const chosen = pickedDishes.includes(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className={`rounded-xl p-4 border flex items-center justify-between gap-3 ${
                        chosen ? 'bg-[#FFF7ED] border-[#EA580C]' : 'bg-[#FAF7F2] border-[#E2D5CC]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#7C1D36]">{dish.tag}</div>
                        <div className="text-sm font-extrabold text-[#1E1417]">{dish.es}</div>
                        <div className="text-xs text-[#4A3B3F]">{dish.hy} · {dish.price.toFixed(2)} €</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          speakSpanish(dish.es);
                          setPickedDishes((prev) =>
                            prev.includes(dish.id) ? prev.filter((x) => x !== dish.id) : [...prev, dish.id]
                          );
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                          chosen
                            ? 'bg-[#EA580C] text-white'
                            : 'bg-white border border-[#E2D5CC] text-[#1E1417] hover:bg-[#FACC15]'
                        }`}
                      >
                        {chosen ? 'Elegido ✓' : 'Elegir'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-[#FDF2F4] border border-[#F2CDD6] p-5 space-y-3">
                <PhraseText
                  es="Camarero: Tu amigo no come carne y además hoy el zumo de naranja se ha acabado. ¿Qué pides para los dos?"
                  hy="Մատուցող. Քո ընկերը միս չի ուտում, իսկ այսօր նարնջի հյութը վերջացել է։ Ի՞նչ ես պատվիրում ձեր երկուսի համար։"
                  onRevealTranslation={onRevealPhrase}
                />
                <VoiceInputBar
                  value={restInput}
                  onChange={setRestInput}
                  loading={restLoading}
                  onSubmit={async () => {
                    setRestLoading(true);
                    const res = await evaluateStudentResponse({
                      userResponse: restInput,
                      promptEs: 'Tu amigo no come carne y no queda zumo de naranja. ¿Qué pedís para comer y beber?',
                      sampleAnswerEs: 'Para mi amigo una tortilla de patatas sin carne, para mí las croquetas y dos aguas.',
                      expectedKeywords: ['tortilla', 'gazpacho', 'sin carne', 'agua', 'pedimos', 'gustaria'],
                      level: activeLevel,
                    });
                    setRestLoading(false);
                    setRestFeedback(res);
                    if (res.accepted) onRecordIndependentAnswer('restaurante', 15);
                  }}
                />
                {restFeedback && (
                  <div className="rounded-xl bg-white border border-[#E6DCD5] p-4 text-sm text-[#1E1417] space-y-1">
                    <div>{restFeedback.feedbackHy}</div>
                    <div className="text-xs text-[#7C1D36] font-semibold">Natural: {restFeedback.naturalVersion}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HOTEL INTERACTIVE */}
          {locationId === 'hotel' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#EFE5DE]">
                <h2 className="text-xl font-extrabold text-[#1E1417] flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#7C1D36]" />
                  <span>Recepción interactiva · Ընդունարան</span>
                </h2>
                <p className="text-sm text-[#4A3B3F] mt-1">
                  Ընտրիր հյուրանոցի իրավիճակը և պատասխանիր աշխատակցի հարցին իսպաներենով։
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {HOTEL_PROBLEMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedHotelProblem(p);
                      setHotelFeedback(null);
                      setHotelInput('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      selectedHotelProblem.id === p.id
                        ? 'bg-[#7C1D36] text-white border-[#7C1D36]'
                        : 'bg-[#FAF7F2] text-[#4A3B3F] border-[#E2D5CC] hover:border-[#EA580C]'
                    }`}
                  >
                    {p.labelEs}
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-4">
                <div className="text-xs text-[#EA580C] font-bold">{selectedHotelProblem.labelHy}</div>
                <PhraseText
                  es={`Recepcionista: ${selectedHotelProblem.clerkEs}`}
                  hy={selectedHotelProblem.clerkHy}
                  onRevealTranslation={onRevealPhrase}
                  textSize="lg"
                />
                <VoiceInputBar
                  value={hotelInput}
                  onChange={setHotelInput}
                  loading={hotelLoading}
                  onSubmit={async () => {
                    setHotelLoading(true);
                    const res = await evaluateStudentResponse({
                      userResponse: hotelInput,
                      promptEs: selectedHotelProblem.clerkEs,
                      sampleAnswerEs: selectedHotelProblem.sampleEs,
                      expectedKeywords: selectedHotelProblem.keywords,
                      level: activeLevel,
                    });
                    setHotelLoading(false);
                    setHotelFeedback(res);
                    if (res.accepted) onRecordIndependentAnswer('hotel', 15);
                  }}
                />
                {hotelFeedback && (
                  <div className="rounded-xl bg-white border border-[#E6DCD5] p-4 text-sm text-[#1E1417] space-y-1">
                    <div>{hotelFeedback.feedbackHy}</div>
                    <div className="text-xs text-[#7C1D36] font-semibold">Natural: {hotelFeedback.naturalVersion}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AEROPUERTO INTERACTIVE */}
          {locationId === 'aeropuerto' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#EFE5DE]">
                <h2 className="text-xl font-extrabold text-[#1E1417] flex items-center gap-2">
                  <Plane className="w-5 h-5 text-[#EA580C]" />
                  <span>Mapa de zonas del aeropuerto · Օդանավակայանի գոտիներ</span>
                </h2>
                <p className="text-sm text-[#4A3B3F] mt-1">
                  Սեղմիր օդանավակայանի չորս գոտիներից մեկի վրա և խոսիր աշխատակցի հետ։
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AIRPORT_ZONES.map((z, idx) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      setSelectedAirportZone(z);
                      setAirportFeedback(null);
                      setAirportInput('');
                    }}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      selectedAirportZone.id === z.id
                        ? 'bg-[#FEFCE8] border-[#EAB308]'
                        : 'bg-[#FAF7F2] border-[#E2D5CC] hover:border-[#EA580C]'
                    }`}
                  >
                    <div className="text-xs text-[#EA580C] font-bold">Zona 0{idx + 1}</div>
                    <div className="text-sm font-extrabold text-[#1E1417] mt-1">{z.nameEs}</div>
                    <div className="text-xs text-[#4A3B3F] mt-0.5">{z.nameHy}</div>
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-5 space-y-4">
                <div className="text-xs font-bold text-[#7C1D36]">
                  {selectedAirportZone.nameEs} · {selectedAirportZone.nameHy}
                </div>
                <PhraseText
                  es={`Empleado: ${selectedAirportZone.staffEs}`}
                  hy={selectedAirportZone.staffHy}
                  onRevealTranslation={onRevealPhrase}
                  textSize="lg"
                />
                <VoiceInputBar
                  value={airportInput}
                  onChange={setAirportInput}
                  loading={airportLoading}
                  onSubmit={async () => {
                    setAirportLoading(true);
                    const res = await evaluateStudentResponse({
                      userResponse: airportInput,
                      promptEs: selectedAirportZone.staffEs,
                      sampleAnswerEs: selectedAirportZone.sampleEs,
                      expectedKeywords: selectedAirportZone.keywords,
                      level: activeLevel,
                    });
                    setAirportLoading(false);
                    setAirportFeedback(res);
                    if (res.accepted) onRecordIndependentAnswer('aeropuerto', 15);
                  }}
                />
                {airportFeedback && (
                  <div className="rounded-xl bg-white border border-[#E6DCD5] p-4 text-sm text-[#1E1417] space-y-1">
                    <div>{airportFeedback.feedbackHy}</div>
                    <div className="text-xs text-[#7C1D36] font-semibold">Natural: {airportFeedback.naturalVersion}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: FRASES CLAVE */}
      {sceneTab === 'phrases' && (
        <section className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#EA580C]" />
            <h2 className="text-xl font-extrabold text-[#1E1417]">Expresiones útiles · Օգտակար արտահայտություններ</h2>
          </div>
          <p className="text-sm text-[#4A3B3F]">
            Սեղմիր ցանկացած արտահայտության վրա՝ հայերեն թարգմանությունը տեսնելու համար, և կրկնիր բարձրաձայն։
          </p>
          <div className="grid grid-cols-1 gap-3">
            {location.usefulPhrases.map((phrase) => (
              <div
                key={phrase.es}
                className="rounded-xl bg-[#FAF7F2] border border-[#E2D5CC] p-4"
              >
                <PhraseText
                  es={phrase.es}
                  hy={phrase.hy}
                  onRevealTranslation={onRevealPhrase}
                  showSlowButton
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
