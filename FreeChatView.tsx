import React, { useEffect, useState } from 'react';
import { MessageCircle, HelpCircle, RotateCcw, Volume2, Languages, ArrowRight } from 'lucide-react';
import { CefrLevel, LocationId } from './types';
import { PhraseText } from './PhraseText';
import { checkAiHealth, sendFreeChatTurn } from './aiClient';
import { speakSpanish } from './speech';

interface ReplyOption {
  es: string;
  hy: string;
}

interface CharacterOption {
  role: 'Camarero' | 'Dependiente' | 'Cajero' | 'Recepcionista' | 'Empleado del aeropuerto';
  name: string;
  locationId: LocationId;
  locationHy: string;
  openings: Record<
    CefrLevel,
    {
      es: string;
      hy: string;
      hintHy: string;
      options: ReplyOption[];
    }
  >;
}

const CHARACTERS: CharacterOption[] = [
  {
    role: 'Camarero',
    name: 'Mateo',
    locationId: 'restaurante',
    locationHy: 'Ռեստորան',
    openings: {
      A2: {
        es: '¡Hola! Bienvenido a La Taberna. ¿Tienes reserva o buscas mesa para comer?',
        hy: 'Բարև։ Բարի գալուստ «Լա Տաբեռնա»։ Ամրագրում ունե՞ս, թե՞ սեղան ես փնտրում ուտելու համար։',
        hintHy: 'Ընտրիր սեղանի կամ ամրագրման մասին պատասխաններից մեկը։',
        options: [
          { es: 'Hola, busco una mesa para dos personas, por favor.', hy: 'Բարև, երկու հոգու համար սեղան եմ փնտրում, խնդրեմ։' },
          { es: 'Sí, tengo una reserva a nombre de Aram.', hy: 'Այո, ամրագրում ունեմ Արամի անունով։' },
          { es: '¿Tienen alguna mesa libre en la terraza?', hy: 'Բացօթյա հատվածում ազատ սեղան ունե՞ք։' },
        ],
      },
      B1: {
        es: '¡Buenas tardes! Hoy tenemos mucha gente. ¿Prefieres mesa dentro o en la terraza y qué te apetece tomar?',
        hy: 'Բարի երեկո։ Այսօր շատ մարդ կա։ Նախընտրո՞ւմ ես սեղան ներսում, թե՞ բացօթյա, և ի՞նչ կցանկանաս խմել։',
        hintHy: 'Նշիր տեղիդ նախընտրությունը և խմիչքը։',
        options: [
          { es: 'Prefiero sentarme dentro y quiero un zumo de naranja, por favor.', hy: 'Նախընտրում եմ ներսում նստել և մեկ նարնջի հյութ կուզեմ, խնդրեմ։' },
          { es: 'Si hay sitio en la terraza, mejor fuera, y una botella de agua.', hy: 'Եթե բացօթյա տեղ կա, ավելի լավ է դրսում, և մեկ շիշ ջուր։' },
          { es: 'Me da igual el sitio, pero primero quería ver la carta.', hy: 'Ինձ համար տարբերություն չկա, բայց նախ կուզեի ճաշացանկը տեսնել։' },
        ],
      },
      B2: {
        es: '¡Buenas noches! Antes de sentaros, te aviso de que hoy tardamos un poco en cocina y se han acabado las croquetas. ¿Os importa esperar o preferís otro plato?',
        hy: 'Բարի երեկո։ Նստելուց առաջ զգուշացնեմ, որ այսօր խոհանոցում մի քիչ ուշանում ենք և կրոկետները վերջացել են։ Դեմ չե՞ք սպասել, թե՞ այլ ուտեստ կնախընտրեք։',
        hintHy: 'Արձագանքիր սպասելուն և փոփոխությանը։',
        options: [
          { es: 'No pasa nada, podemos esperar. ¿Qué platos rápidos me recomienda?', hy: 'Ոչինչ, կարող ենք սպասել։ Ի՞նչ արագ ուտեստներ խորհուրդ կտաք։' },
          { es: '¡Qué pena lo de las croquetas! Entonces probamos la especialidad de la casa.', hy: 'Ափսոս կրոկետների համար։ Այդ դեպքում փորձենք ֆիրմային ուտեստը։' },
          { es: 'No tenemos prisa. ¿Hay menú del día esta noche?', hy: 'Մենք չենք շտապում։ Այս երեկո համալիր ճաշացանկ կա՞։' },
        ],
      },
    },
  },
  {
    role: 'Dependiente',
    name: 'Álvaro',
    locationId: 'compras',
    locationHy: 'Հագուստի խանութ',
    openings: {
      A2: {
        es: '¡Hola! ¿Qué ropa o zapatillas estás buscando hoy?',
        hy: 'Բարև։ Այսօր ի՞նչ հագուստ կամ մարզակոշիկ ես փնտրում։',
        hintHy: 'Ընտրիր, թե ինչ հագուստ ես ուզում տեսնել։',
        options: [
          { es: 'Estoy buscando una sudadera verde en la talla M.', hy: 'Փնտրում եմ կանաչ հուդի՝ M չափսի։' },
          { es: 'Quiero ver unas zapatillas deportivas del número 40.', hy: 'Ուզում եմ տեսնել 40 համարի մարզակոշիկներ։' },
          { es: 'Solo estoy mirando camisetas de verano, gracias.', hy: 'Պարզապես ամառային շապիկներ եմ նայում, շնորհակալություն։' },
        ],
      },
      B1: {
        es: '¡Bienvenido! Tenemos nueva colección urbana. ¿Buscas algo para ti o para hacer un regalo?',
        hy: 'Բարի գալուստ։ Նոր քաղաքային հավաքածու ունենք։ Քե՞զ համար ես փնտրում, թե՞ նվերի համար։',
        hintHy: 'Ընտրիր՝ քեզ համար է, թե նվեր, և նշիր գույն կամ բյուջե։',
        options: [
          { es: 'Es para mí, busco una sudadera cómoda por menos de 35 euros.', hy: 'Ինձ համար է, փնտրում եմ հարմարավետ հուդի՝ 35 եվրոյից էժան։' },
          { es: 'Es para hacer un regalo a un amigo, ¿qué me recomienda?', hy: 'Ընկերոջս նվեր անելու համար է, ի՞նչ խորհուրդ կտաք։' },
          { es: 'Busco unos vaqueros oscuros en mi talla habitual.', hy: 'Փնտրում եմ մուգ ջինսեր՝ իմ սովորական չափսով։' },
        ],
      },
      B2: {
        es: '¡Hola! Hoy tenemos rebajas, pero muchas tallas están agotadas y no aceptamos devoluciones en artículos sin ticket. ¿Qué prenda buscas exactamente?',
        hy: 'Բարև։ Այսօր զեղչեր են, բայց շատ չափսեր վերջացել են և առանց կտրոնի վերադարձ չենք ընդունում։ Կոնկրետ ի՞նչ հագուստ ես փնտրում։',
        hintHy: 'Ճշտիր չափսը կամ փոխանակման պայմանները։',
        options: [
          { es: 'Busco una chaqueta ligera en talla M, pero ¿se puede cambiar con ticket?', hy: 'Փնտրում եմ թեթև բաճկոն M չափսի, բայց կտրոնով կարելի՞ է փոխել։' },
          { es: 'Quería unas zapatillas rebajadas, ¿qué números quedan disponibles?', hy: 'Զեղչված մարզակոշիկ էի ուզում, ի՞նչ չափսեր են մնացել։' },
          { es: 'De acuerdo, guardo el ticket. ¿Tienen sudaderas de la nueva colección?', hy: 'Լավ, կտրոնը կպահեմ։ Նոր հավաքածուից հուդիներ ունե՞ք։' },
        ],
      },
    },
  },
  {
    role: 'Cajero',
    name: 'Lucía',
    locationId: 'supermercado',
    locationHy: 'Սուպերմարկետ',
    openings: {
      A2: {
        es: '¡Hola! ¿Has encontrado todos los productos de tu lista?',
        hy: 'Բարև։ Գտա՞ր քո ցուցակի բոլոր ապրանքները։',
        hintHy: 'Պատասխանիր՝ գտե՞լ ես ամեն ինչ, թե՞ հարց ունես։',
        options: [
          { es: 'Sí, gracias, ya lo tengo todo en la cesta.', hy: 'Այո, շնորհակալություն, արդեն ամեն ինչ զամբյուղում է։' },
          { es: 'Casi todo, pero no encuentro el aceite de oliva.', hy: 'Գրեթե ամեն ինչ, բայց ձիթապտղի յուղը չեմ գտնում։' },
          { es: '¿Cuánto cuesta el kilo de tomates hoy?', hy: 'Այսօր ի՞նչ արժե մեկ կիլոգրամ լոլիկը։' },
        ],
      },
      B1: {
        es: '¡Buenas! Antes de pasar tus cosas, ¿necesitas bolsa y tienes nuestra tarjeta de cliente?',
        hy: 'Բարև ձեզ։ Ապրանքներդ անցկացնելուց առաջ՝ տոպրակ պե՞տք է և մեր հաճախորդի քարտը ունե՞ս։',
        hintHy: 'Պատասխանիր տոպրակի և քարտի մասին։',
        options: [
          { es: 'No necesito bolsa y tampoco tengo tarjeta de cliente.', hy: 'Տոպրակ պետք չէ և հաճախորդի քարտ էլ չունեմ։' },
          { es: 'Sí, dame una bolsa por favor, pero no tengo la tarjeta.', hy: 'Այո, խնդրում եմ մեկ տոպրակ տվեք, բայց քարտը չունեմ։' },
          { es: 'Traigo mi propia bolsa y aquí tienes mi tarjeta en el móvil.', hy: 'Իմ պայուսակն ունեմ, իսկ քարտը՝ ահա հեռախոսի մեջ։' },
        ],
      },
      B2: {
        es: '¡Hola! Mira, el yogur que cogiste no entra en la oferta del tres por dos porque es de otra marca. ¿Quieres cambiarlo o te lo cobro normal?',
        hy: 'Բարև։ Տես, քո վերցրած յոգուրտը չի մտնում 3x2 ակցիայի մեջ, քանի որ այլ ապրանքանիշից է։ Ուզո՞ւմ ես փոխել, թե՞ սովորական գնով հաշվեմ։',
        hintHy: 'Ընտրիր՝ փոխել, թե հաշվել սովորական գնով։',
        options: [
          { es: '¿Cuál es la diferencia de precio? Si es poca, me lo llevo igual.', hy: 'Գնի տարբերությունը որքա՞ն է։ Եթե քիչ է, միևնույն է վերցնում եմ։' },
          { es: 'Entonces voy un segundo a cambiarlo por la marca de la oferta.', hy: 'Այդ դեպքում մեկ վայրկյանում գնամ փոխեմ ակցիայի ապրանքանիշով։' },
          { es: 'Mejor cóbralo normal, por favor, tengo prisa.', hy: 'Ավելի լավ է սովորական գնով հաշվեք, խնդրեմ, շտապում եմ։' },
        ],
      },
    },
  },
  {
    role: 'Recepcionista',
    name: 'Carmen',
    locationId: 'hotel',
    locationHy: 'Հյուրանոց',
    openings: {
      A2: {
        es: '¡Buenos días! Bienvenido al Hotel El Sol. ¿Tienes una reserva?',
        hy: 'Բարի լույս։ Բարի գալուստ «Էլ Սոլ» հյուրանոց։ Ամրագրում ունե՞ս։',
        hintHy: 'Ընտրիր պատասխան ամրագրման մասին։',
        options: [
          { es: 'Sí, tengo una reserva a nombre de Aram para dos noches.', hy: 'Այո, ամրագրում ունեմ Արամի անունով՝ երկու գիշերով։' },
          { es: 'No tengo reserva, ¿tienen una habitación libre para hoy?', hy: 'Ամրագրում չունեմ, այսօրվա համար ազատ սենյակ ունե՞ք։' },
          { es: 'Sí, reservé una habitación con desayuno incluido.', hy: 'Այո, սենյակ եմ ամրագրել՝ նախաճաշը ներառված։' },
        ],
      },
      B1: {
        es: '¡Buenas tardes! ¿En qué puedo ayudarte hoy: check-in, información del desayuno o algún problema con tu habitación?',
        hy: 'Բարի երեկո։ Այսօր ինչո՞վ կարող եմ օգնել՝ գրանցու՞մ, նախաճաշի տեղեկությու՞ն, թե՞ սենյակի հետ կապված խնդիր։',
        hintHy: 'Ընտրիր, թե ինչ հարցով ես դիմում։',
        options: [
          { es: 'Quería hacer el check-in, tengo reserva a nombre de Aram.', hy: 'Ուզում էի գրանցվել, Արամի անունով ամրագրում ունեմ։' },
          { es: '¿A qué hora se sirve el desayuno y dónde está el comedor?', hy: 'Ժամը քանիսի՞ն է մատուցվում նախաճաշը և որտե՞ղ է ճաշասրահը։' },
          { es: 'Hay un problema con el aire acondicionado de mi habitación.', hy: 'Սենյակիս օդորակիչի հետ խնդիր կա։' },
        ],
      },
      B2: {
        es: '¡Hola! Veo tu reserva, pero ha habido un problema con la limpieza de tu habitación y estará lista en 30 minutos. ¿Cómo prefieres organizarte?',
        hy: 'Բարև։ Տեսնում եմ ամրագրումդ, բայց սենյակի մաքրման հետ կապված խնդիր կա և պատրաստ կլինի 30 րոպեից։ Ինչպե՞ս կնախընտրես կազմակերպվել։',
        hintHy: 'Ընտրիր՝ թողնել ճամպրուկը, թե խնդրել այլ սենյակ։',
        options: [
          { es: 'No pasa nada, ¿puedo dejar la maleta en consigna mientras doy un paseo?', hy: 'Ոչինչ, կարո՞ղ եմ թողնել ճամպրուկը պահախցիկում, մինչ մի քիչ զբոսնեմ։' },
          { es: '¿Tienen otra habitación parecida que ya esté disponible ahora?', hy: 'Ունե՞ք մեկ այլ նման սենյակ, որը հենց հիմա պատրաստ է։' },
          { es: 'Perfecto, espero media hora en la cafetería del hotel.', hy: 'Հիանալի է, կես ժամ կսպասեմ հյուրանոցի սրճարանում։' },
        ],
      },
    },
  },
  {
    role: 'Empleado del aeropuerto',
    name: 'Sofía',
    locationId: 'aeropuerto',
    locationHy: 'Օդանավակայան',
    openings: {
      A2: {
        es: '¡Buenos días! ¿A dónde viajas hoy y cuántas maletas llevas?',
        hy: 'Բարի լույս։ Այսօր ու՞ր ես ճամփորդում և քանի՞ ճամպրուկ ունես։',
        hintHy: 'Նշիր ուղղությունը և ճամպրուկների քանակը։',
        options: [
          { es: 'Viajo a Madrid y llevo una maleta para facturar.', hy: 'Ճամփորդում եմ Մադրիդ և մեկ ճամպրուկ ունեմ հանձնելու համար։' },
          { es: 'Voy a Valencia y solo llevo esta mochila de mano.', hy: 'Գնում եմ Վալենսիա և միայն այս ձեռքի ուսապարկն ունեմ։' },
          { es: 'Vuelo a Barcelona con dos maletas pequeñas.', hy: 'Թռչում եմ Բարսելոնա՝ երկու փոքր ճամպրուկով։' },
        ],
      },
      B1: {
        es: '¡Hola! Tu vuelo tiene un pequeño cambio de puerta de embarque. ¿Necesitas facturar equipaje o vas directo al control?',
        hy: 'Բարև։ Քո թռիչքի նստեցման դարպասը փոքր-ինչ փոխվել է։ Պե՞տք է ուղեբեռ հանձնես, թե՞ անմիջապես անցնում ես ստուգումը։',
        hintHy: 'Հարցրու նոր դարպասի մասին կամ հանձնիր ուղեբեռը։',
        options: [
          { es: 'Necesito facturar esta maleta. ¿Cuál es la nueva puerta?', hy: 'Պետք է հանձնեմ այս ճամպրուկը։ Ո՞րն է նոր դարպասը։' },
          { es: 'Voy directo al control de seguridad, ¿a qué puerta tengo que ir?', hy: 'Անմիջապես գնում եմ անվտանգության ստուգման, ո՞ր դարպաս պետք է գնամ։' },
          { es: '¿A qué hora empieza el embarque con este cambio?', hy: 'Այս փոփոխությամբ ժամը քանիսի՞ն է սկսվում նստեցումը։' },
        ],
      },
      B2: {
        es: '¡Atención! Tu maleta pesa 26 kilos, el vuelo lleva una hora de retraso y la puerta cambió a la C38. ¿Qué te preocupa más resolver primero?',
        hy: 'Ուշադրություն։ Ճամպրուկդ կշռում է 26 կգ, թռիչքը մեկ ժամ ուշանում է, իսկ դարպասը փոխվել է C38։ Առաջինը ի՞նչն ես ուզում լուծել։',
        hintHy: 'Ընտրիր առաջնահերթ լուծումը։',
        options: [
          { es: 'Primero saco tres kilos de la maleta para no pagar exceso.', hy: 'Նախ ճամպրուկից երեք կիլոգրամ հանեմ, որ հավելավճար չտամ։' },
          { es: 'Quiero saber si llegaré a tiempo a mi conexión con este retraso.', hy: 'Ուզում եմ իմանալ՝ այս ուշացումով կհասցնե՞մ իմ հաջորդ թռիչքին։' },
          { es: '¿Me indica cómo llegar a la puerta C38 después de facturar?', hy: 'Կասե՞ք՝ հաշվառումից հետո ինչպես հասնել C38 դարպաս։' },
        ],
      },
    },
  },
];

interface ChatMsg {
  id: string;
  sender: 'ai' | 'user';
  es: string;
  hy?: string;
  correctionEs?: string;
  correctionHy?: string;
}

interface FreeChatViewProps {
  activeLevel: CefrLevel;
  onChangeLevel: (lvl: CefrLevel) => void;
  onRevealPhrase: (phraseEs: string) => void;
  onRecordIndependentAnswer: (locId: LocationId) => void;
}

export const FreeChatView: React.FC<FreeChatViewProps> = ({
  activeLevel,
  onChangeLevel,
  onRevealPhrase,
  onRecordIndependentAnswer,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterOption>(CHARACTERS[0]);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentHintHy, setCurrentHintHy] = useState<string>('');
  const [replyOptions, setReplyOptions] = useState<ReplyOption[]>([]);
  const [revealedOptions, setRevealedOptions] = useState<Record<number, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedFallbackLast, setUsedFallbackLast] = useState(false);

  useEffect(() => {
    checkAiHealth().then(setAiAvailable);
  }, []);

  const resetChat = (char: CharacterOption, lvl: CefrLevel) => {
    const opening = char.openings[lvl];
    setMessages([
      {
        id: `open-${Date.now()}`,
        sender: 'ai',
        es: opening.es,
        hy: opening.hy,
      },
    ]);
    setCurrentHintHy(opening.hintHy);
    setReplyOptions(opening.options);
    setRevealedOptions({});
    setShowHelp(false);
  };

  useEffect(() => {
    resetChat(selectedChar, activeLevel);
  }, [selectedChar, activeLevel]);

  const handleSelectOption = async (option: ReplyOption) => {
    if (loading) return;
    const text = option.es;
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      es: text,
      hy: option.hy,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);
    setShowHelp(false);
    setRevealedOptions({});
    speakSpanish(text);

    try {
      const reply = await sendFreeChatTurn({
        role: selectedChar.role,
        level: activeLevel,
        history: messages.map((m) => ({ sender: m.sender, text: m.es })),
        userMessage: text,
      });

      setUsedFallbackLast(Boolean(reply.usedFallback));
      setCurrentHintHy(reply.hintHy);
      setReplyOptions(reply.suggestedOptions.length > 0 ? reply.suggestedOptions : selectedChar.openings[activeLevel].options);
      onRecordIndependentAnswer(selectedChar.locationId);

      const aiMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        es: reply.replyEs,
        hy: reply.replyHy,
        correctionEs: reply.correctionEs,
        correctionHy: reply.correctionHy,
      };
      setMessages([...nextHistory, aiMsg]);
      setTimeout(() => speakSpanish(reply.replyEs), 700);
    } catch {
      const errMsg: ChatMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        es: 'Perdona, ¿puedes repetir eso otra vez, por favor?',
        hy: 'Ներիր, կարո՞ղ ես կրկին ասել, խնդրեմ։',
      };
      setMessages([...nextHistory, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Character Selector */}
      <div className="rounded-3xl bg-white border border-[#E6DCD5] shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#EA580C] flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>
                Conversación libre ·{' '}
                {aiAvailable === false || usedFallbackLast
                  ? 'Modo autónomo por escenarios'
                  : 'Conversación adaptativa'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1417] mt-1">
              Habla con personajes reales · Ընտրիր քո պատասխանը
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-[#F5EFEA] p-1 rounded-xl border border-[#E2D5CC]">
            {(['A2', 'B1', 'B2'] as CefrLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChangeLevel(lvl)}
                className={`min-h-10 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeLevel === lvl
                    ? 'bg-[#FACC15] text-[#1E1417]'
                    : 'text-[#4A3B3F] hover:text-[#1E1417]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CHARACTERS.map((char) => (
            <button
              key={char.role}
              type="button"
              onClick={() => setSelectedChar(char)}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedChar.role === char.role
                  ? 'bg-[#7C1D36] text-white border-[#7C1D36]'
                  : 'bg-[#FAF7F2] text-[#1E1417] border-[#E2D5CC] hover:border-[#EA580C]'
              }`}
            >
              <div className="text-xs font-bold truncate">{char.role}</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  selectedChar.role === char.role ? 'text-[#FDE68A] font-medium' : 'text-[#6E5B60]'
                }`}
              >
                {char.name} · {char.locationHy}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Stage */}
      <div className="rounded-2xl bg-white border border-[#E6DCD5] shadow-xs p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EFE5DE]">
          <div className="text-sm font-extrabold text-[#1E1417]">
            {selectedChar.name} ({selectedChar.role}) · Nivel {activeLevel}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp((s) => !s)}
              className="min-h-9 px-3.5 py-1.5 rounded-lg bg-[#FEFCE8] border border-[#FDE047] text-[#854D0E] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ayuda · Օգնություն</span>
            </button>
            <button
              type="button"
              onClick={() => resetChat(selectedChar, activeLevel)}
              className="min-h-9 px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E2D5CC] text-[#1E1417] hover:border-[#7C1D36] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="rounded-xl bg-[#FEFCE8] border border-[#FDE68A] p-4 text-sm text-[#1E1417]">
            Հուշում պատասխանի համար՝ {currentHintHy}
          </div>
        )}

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl w-full sm:w-[85%] rounded-2xl p-4 border ${
                  msg.sender === 'user'
                    ? 'bg-[#FDF2F4] border-[#F2CDD6]'
                    : 'bg-[#FAF7F2] border-[#E2D5CC]'
                }`}
              >
                <div className={`text-xs font-extrabold mb-1 ${msg.sender === 'user' ? 'text-[#7C1D36]' : 'text-[#EA580C]'}`}>
                  {msg.sender === 'user' ? 'Tú' : `${selectedChar.name} (${selectedChar.role})`}
                </div>
                {msg.hy ? (
                  <PhraseText
                    es={msg.es}
                    hy={msg.hy}
                    onRevealTranslation={onRevealPhrase}
                    showSlowButton={msg.sender === 'ai'}
                  />
                ) : (
                  <p className="text-[15px] text-[#1E1417] leading-relaxed">{msg.es}</p>
                )}

                {(msg.correctionEs || msg.correctionHy) && (
                  <div className="mt-3 pt-2 border-t border-[#E2D5CC] text-xs text-[#4A3B3F] space-y-1">
                    {msg.correctionEs && (
                      <div className="text-[#7C1D36] font-bold">
                        Forma más natural: {msg.correctionEs}
                      </div>
                    )}
                    {msg.correctionHy && <div>{msg.correctionHy}</div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selectable Answer Options (instead of manual typing) */}
        <div className="rounded-2xl bg-[#FAF7F2] border border-[#E2D5CC] p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-[#7C1D36]">
              Elige tu respuesta · Ընտրիր քո պատասխանը ({loading ? 'պատրաստվում է պատասխանը...' : 'սեղմիր տարբերակի վրա'})
            </div>
            <span className="text-[11px] text-[#6E5B60]">
              Սեղմիր բարձրախոսի վրա՝ լսելու, կամ թարգմանության վրա՝ հայերենը տեսնելու համար
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {replyOptions.map((opt, idx) => {
              const isTranslated = Boolean(revealedOptions[idx]);
              return (
                <div
                  key={`${opt.es}-${idx}`}
                  className="rounded-xl bg-white border border-[#D9C8BE] hover:border-[#EA580C] transition-colors flex items-stretch gap-2 p-2.5"
                >
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectOption(opt)}
                    className="flex-1 text-left px-2 py-1 flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <div className="space-y-1">
                      <div className="text-[15px] font-semibold text-[#1E1417] leading-snug">
                        {opt.es}
                      </div>
                      {isTranslated && (
                        <div className="text-xs font-medium text-[#7C1D36]">
                          {opt.hy}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#EA580C] shrink-0" />
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 border-l border-[#EFE5DE] pl-2">
                    <button
                      type="button"
                      onClick={() => speakSpanish(opt.es)}
                      className="min-h-9 min-w-9 rounded-lg bg-[#FDF2F4] text-[#7C1D36] hover:bg-[#F9DDE3] flex items-center justify-center cursor-pointer"
                      title="Լսել իսպաներեն"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRevealedOptions((prev) => ({ ...prev, [idx]: !prev[idx] }));
                        onRevealPhrase(opt.es);
                      }}
                      className={`min-h-9 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        isTranslated
                          ? 'bg-[#FACC15] border-[#EAB308] text-[#1E1417]'
                          : 'bg-[#FAF7F2] border-[#E2D5CC] text-[#4A3B3F] hover:border-[#7C1D36]'
                      }`}
                      title="Հայերեն թարգմանություն"
                    >
                      <Languages className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
