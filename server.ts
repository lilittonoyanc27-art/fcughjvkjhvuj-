import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function localEvaluateResponse(params: {
  userResponse: string;
  promptEs: string;
  sampleAnswerEs: string;
  expectedKeywords?: string[];
  level: string;
  contextHy?: string;
}) {
  const clean = normalizeText(params.userResponse);
  const words = clean.split(' ').filter(Boolean);

  if (words.length === 0) {
    return {
      accepted: false,
      quality: 'incorrecto',
      naturalVersion: params.sampleAnswerEs,
      feedbackEs: 'Escribe o di una respuesta completa en español.',
      feedbackHy: 'Գրիր կամ ասա ամբողջական պատասխան իսպաներենով։',
      usedFallback: true,
    };
  }

  const politeMarkers = ['por favor', 'me gustaria', 'podria', 'puede', 'quisiera', 'disculpa', 'perdone', 'perdona', 'gracias', 'lo siento'];
  const hasPolite = politeMarkers.some((m) => clean.includes(m));
  const keywords = (params.expectedKeywords ?? []).map(normalizeText).filter(Boolean);
  const matchedKeywords = keywords.filter((kw) => clean.includes(kw));

  const sampleWords = normalizeText(params.sampleAnswerEs)
    .split(' ')
    .filter((w) => w.length > 3);
  const overlap = sampleWords.filter((w) => clean.includes(w));

  const isVeryShort = words.length <= 2;
  const hasIntent = matchedKeywords.length > 0 || overlap.length > 0 || words.length >= 4;

  if (!hasIntent && isVeryShort) {
    return {
      accepted: false,
      quality: 'incorrecto',
      naturalVersion: params.sampleAnswerEs,
      feedbackEs: 'Tu respuesta es demasiado corta o no responde a la situación.',
      feedbackHy: 'Քո պատասխանը շատ կարճ է կամ չի համապատասխանում իրավիճակին։ Փորձիր կազմել ամբողջական նախադասություն։',
      usedFallback: true,
    };
  }

  if (isVeryShort || !hasPolite || words.length < 4) {
    return {
      accepted: true,
      quality: 'mejorable',
      naturalVersion: params.sampleAnswerEs,
      feedbackEs: 'Se entiende la idea, pero puedes expresarlo de forma más natural y educada.',
      feedbackHy: 'Միտքը հասկանալի է, բայց կարող ես ասել ավելի բնական և քաղաքավարի ձևով (օրինակ՝ օգտագործելով «por favor» կամ «me gustaría»)։',
      usedFallback: true,
    };
  }

  if (matchedKeywords.length >= 1 || overlap.length >= 2) {
    return {
      accepted: true,
      quality: 'excelente',
      naturalVersion: params.sampleAnswerEs,
      feedbackEs: '¡Muy bien! Respuesta natural, clara y adecuada para la situación.',
      feedbackHy: 'Հիանալի է։ Պատասխանդ բնական է, քաղաքավարի և ամբողջությամբ համապատասխանում է իրավիճակին։',
      usedFallback: true,
    };
  }

  return {
    accepted: true,
    quality: 'bueno',
    naturalVersion: params.sampleAnswerEs,
    feedbackEs: 'Buena respuesta comunicativa. Fíjate también en esta forma muy natural en España.',
    feedbackHy: 'Լավ պատասխան է։ Հաղորդակցական խնդիրը լուծված է, կարող ես նաև համեմատել առաջարկվող բնական տարբերակի հետ։',
    usedFallback: true,
  };
}

function localCharacterReply(params: {
  role: string;
  level: string;
  history: Array<{ sender: string; text: string }>;
  userMessage: string;
}) {
  const turn = Math.floor(params.history.filter((h) => h.sender === 'user').length);
  const msg = normalizeText(params.userMessage);

  const scripts: Record<
    string,
    Array<{
      es: string;
      hy: string;
      hintHy: string;
      options: Array<{ es: string; hy: string }>;
    }>
  > = {
    Camarero: [
      {
        es: '¡Perfecto! De primer plato tenemos gazpacho, ensalada mixta o croquetas caseras. ¿Qué te apetece?',
        hy: 'Հիանալի է։ Առաջին ուտեստներից ունենք գասպաչո, խառը աղցան կամ տնական կրոկետներ։ Ի՞նչ կցանկանաս։',
        hintHy: 'Ընտրիր ուտեստ կամ հարցրու բաղադրիչների մասին։',
        options: [
          { es: 'Para mí, unas croquetas caseras, por favor.', hy: 'Ինձ համար՝ տնական կրոկետներ, խնդրեմ։' },
          { es: '¿La ensalada mixta lleva atún o huevo?', hy: 'Խառը աղցանը թունա կամ ձու պարունակո՞ւմ է։' },
          { es: 'Prefiero un gazpacho bien frío.', hy: 'Նախընտրում եմ շատ սառը գասպաչո։' },
        ],
      },
      {
        es: 'Muy buena elección. ¿Y para beber prefieres agua, zumo de naranja o algún refresco?',
        hy: 'Շատ լավ ընտրություն է։ Իսկ խմելու համար նախընտրո՞ւմ ես ջուր, նարնջի հյութ, թե՞ որևէ զովացուցիչ ըմպելիք։',
        hintHy: 'Ընտրիր խմիչք կամ հարցրու հյութի մասին։',
        options: [
          { es: 'Un zumo de naranja natural, por favor.', hy: 'Մեկ բնական նարնջի հյութ, խնդրեմ։' },
          { es: 'Para beber, solo una botella de agua sin gas.', hy: 'Խմելու համար՝ միայն մեկ շիշ չգազավորված ջուր։' },
          { es: '¿Qué refrescos tienen hoy?', hy: 'Այսօր ի՞նչ զովացուցիչ ըմպելիքներ ունեք։' },
        ],
      },
      {
        es: 'Lo siento mucho, ahora mismo no nos queda zumo de naranja natural. ¿Te gustaría probar limonada casera o agua con gas?',
        hy: 'Շատ ներողություն, հենց հիմա թարմ նարնջի հյութ չունենք։ Կցանկանա՞ս փորձել տնական լիմոնադ կամ գազավորված ջուր։',
        hintHy: 'Արձագանքիր փոփոխությանը և ընտրիր այլ ըմպելիք։',
        options: [
          { es: 'No pasa nada, entonces prefiero limonada casera.', hy: 'Ոչինչ, այդ դեպքում նախընտրում եմ տնական լիմոնադ։' },
          { es: 'Mejor agua con gas y una rodaja de limón.', hy: 'Ավելի լավ է՝ գազավորված ջուր՝ կիտրոնի շերտով։' },
          { es: 'Vale, pues tráigame agua normal, gracias.', hy: 'Լավ, ուրեմն սովորական ջուր բերեք ինձ, շնորհակալություն։' },
        ],
      },
      {
        es: 'Aquí tienes. ¿Todo está a tu gusto o necesitas algo más? Cuando quieras te traigo la cuenta.',
        hy: 'Ահա, խնդրեմ։ Ամեն ինչ քո սրտով է, թե՞ էլի ինչ-որ բան է պետք։ Երբ ցանկանաս, կբերեմ հաշիվը։',
        hintHy: 'Շնորհակալություն հայտնիր կամ խնդրիր հաշիվը։',
        options: [
          { es: 'Todo está riquísimo. La cuenta, cuando pueda.', hy: 'Ամեն ինչ շատ համեղ է։ Հաշիվը, երբ կարողանաք։' },
          { es: '¿Nos trae algo de postre antes de la cuenta?', hy: 'Հաշվից առաջ մի աղանդեր կբերե՞ք մեզ։' },
          { es: 'Sí, todo perfecto. ¿Puedo pagar con tarjeta?', hy: 'Այո, ամեն ինչ հիանալի է։ Կարո՞ղ եմ քարտով վճարել։' },
        ],
      },
    ],
    Dependiente: [
      {
        es: '¡Claro! ¿Qué talla sueles usar normalmente y qué color te gusta más?',
        hy: 'Իհարկե։ Սովորաբար ի՞նչ չափս ես հագնում և ո՞ր գույնն ես ավելի շատ սիրում։',
        hintHy: 'Նշիր քո չափսը և նախընտրած գույնը։',
        options: [
          { es: 'Uso la talla M y me gusta el color verde o negro.', hy: 'M չափս եմ հագնում և սիրում եմ կանաչ կամ սև գույնը։' },
          { es: 'Normalmente llevo la talla S en tonos claros.', hy: 'Սովորաբար S չափս եմ հագնում՝ բաց գույներով։' },
          { es: 'Busco una talla L, si es posible en azul marino.', hy: 'L չափս եմ փնտրում, եթե հնարավոր է՝ մուգ կապույտ։' },
        ],
      },
      {
        es: 'Tenemos este modelo, aunque en azul se nos ha agotado. ¿Te gustaría probarte el verde o el negro en los probadores?',
        hy: 'Ունենք այս մոդելը, բայց կապույտը վերջացել է։ Կցանկանա՞ս փորձել կանաչը կամ սևը հանդերձարանում։',
        hintHy: 'Ընտրիր գույնը և հարցրու հանդերձարանի մասին։',
        options: [
          { es: 'Sí, me pruebo el verde. ¿Dónde están los probadores?', hy: 'Այո, կփորձեմ կանաչը։ Որտե՞ղ են հանդերձարանները։' },
          { es: 'Prefiero probarme el negro, por favor.', hy: 'Նախընտրում եմ փորձել սևը, խնդրեմ։' },
          { es: '¿Tienen algún otro modelo parecido en azul?', hy: 'Կապույտ գույնով նման այլ մոդել ունե՞ք։' },
        ],
      },
      {
        es: 'Los probadores están al fondo a la derecha. ¿Cómo te queda? ¿Necesitas una talla más grande o más pequeña?',
        hy: 'Հանդերձարանները վերջում՝ աջ կողմում են։ Ինչպե՞ս է նստում քեզ վրա։ Ավելի մե՞ծ, թե՞ փոքր չափս է պետք։',
        hintHy: 'Ասա՝ ինչպես է նստում հագուստը քեզ վրա։',
        options: [
          { es: 'Me queda un poco pequeño, ¿tiene una talla más?', hy: 'Մի քիչ փոքր է ինձ վրա, մեկ չափս մեծ ունե՞ք։' },
          { es: 'Me queda perfecto. ¿Cuánto cuesta al final?', hy: 'Հիանալի է նստում։ Վերջնական որքա՞ն արժե։' },
          { es: 'Me queda algo grande, quiero probar una talla menos.', hy: 'Մի քիչ մեծ է, ուզում եմ մեկ չափս փոքրը փորձել։' },
        ],
      },
      {
        es: 'Cuesta 29 euros y hoy tiene un 20 % de descuento. ¿Te la llevas o quieres ver algo más?',
        hy: 'Արժե 29 եվրո և այսօր ունի 20% զեղչ։ Վերցնո՞ւմ ես, թե՞ ուզում ես էլի ինչ-որ բան տեսնել։',
        hintHy: 'Որոշիր՝ գնո՞ւմ ես, թե՞ հարցնում ես փոխանակման մասին։',
        options: [
          { es: 'Me la llevo, está muy bien de precio con el descuento.', hy: 'Վերցնում եմ, զեղչով գինը շատ լավ է։' },
          { es: '¿Puedo cambiarla si no me convence en casa?', hy: 'Կարո՞ղ եմ փոխել, եթե տանը դուր չգա։' },
          { es: 'De momento lo pienso, muchas gracias por su ayuda.', hy: 'Առայժմ կմտածեմ, շատ շնորհակալ եմ օգնության համար։' },
        ],
      },
    ],
    Cajero: [
      {
        es: '¡Hola! ¿Has encontrado todo lo que buscabas hoy en el supermercado?',
        hy: 'Բարև։ Այսօր սուպերմարկետում գտա՞ր այն ամենը, ինչ փնտրում էիր։',
        hintHy: 'Պատասխանիր՝ գտե՞լ ես ամեն ինչ, թե՞ օգնություն է պետք։',
        options: [
          { es: 'Sí, lo he encontrado todo muy rápido, gracias.', hy: 'Այո, ամեն ինչ շատ արագ գտա, շնորհակալություն։' },
          { es: 'Casi todo, pero no encontré el aceite de oliva.', hy: 'Գրեթե ամեն ինչ, բայց ձիթապտղի յուղը չգտա։' },
          { es: 'Sí, aunque tengo una duda con la oferta de este yogur.', hy: 'Այո, բայց այս յոգուրտի զեղչի հետ կապված հարց ունեմ։' },
        ],
      },
      {
        es: 'Perfecto. ¿Necesitas una bolsa para llevar la compra? Son diez céntimos.',
        hy: 'Հրաշալի է։ Գնումները տանելու համար տոպրակ պե՞տք է։ Այն արժե տասը ցենտ։',
        hintHy: 'Ասա՝ տոպրակ պե՞տք է, թե՞ ոչ։',
        options: [
          { es: 'No hace falta, traigo mi propia bolsa.', hy: 'Կարիք չկա, իմ պայուսակն ունեմ։' },
          { es: 'Sí, por favor, dame una bolsa grande.', hy: 'Այո, խնդրում եմ, մեկ մեծ տոպրակ տվեք։' },
          { es: 'Solo necesito una bolsa pequeña, gracias.', hy: 'Միայն մեկ փոքր տոպրակ է պետք, շնորհակալություն։' },
        ],
      },
      {
        es: '¿Tienes la tarjeta de cliente para acumular puntos y aplicar el descuento de hoy?',
        hy: 'Ունե՞ս հաճախորդի քարտ՝ միավորներ կուտակելու և այսօրվա զեղչից օգտվելու համար։',
        hintHy: 'Պատասխանիր քարտի մասին։',
        options: [
          { es: 'No, no la tengo todavía.', hy: 'Ոչ, դեռ չունեմ։' },
          { es: 'Sí, aquí tienes la tarjeta en el móvil.', hy: 'Այո, ահա քարտը հեռախոսի մեջ։' },
          { es: '¿Cómo puedo hacerme la tarjeta de cliente?', hy: 'Ինչպե՞ս կարող եմ հաճախորդի քարտ հանել։' },
        ],
      },
      {
        es: 'En total son 18,40 euros. ¿Vas a pagar en efectivo o con tarjeta?',
        hy: 'Ընդամենը 18,40 եվրո է։ Վճարելու ես կանխի՞կ, թե՞ քարտով։',
        hintHy: 'Ընտրիր վճարման եղանակը։',
        options: [
          { es: 'Con tarjeta, por favor. ¿Me da el ticket?', hy: 'Քարտով, խնդրեմ։ Կտրոնը կտա՞ք։' },
          { es: 'Voy a pagar en efectivo, aquí tiene veinte euros.', hy: 'Կանխիկ եմ վճարելու, ահա քսան եվրո։' },
          { es: '¿Aceptan pago sin contacto con el móvil?', hy: 'Հեռախոսով անհպում վճարում ընդունո՞ւմ եք։' },
        ],
      },
    ],
    Recepcionista: [
      {
        es: '¡Bienvenido al Hotel El Sol! ¿Tienes una reserva a tu nombre o buscas habitación para hoy?',
        hy: 'Բարի գալուստ «Էլ Սոլ» հյուրանոց։ Ամրագրում ունե՞ս քո անունով, թե՞ սենյակ ես փնտրում այսօրվա համար։',
        hintHy: 'Նշիր ամրագրման մասին։',
        options: [
          { es: 'Sí, tengo una reserva a nombre de Aram para tres noches.', hy: 'Այո, ամրագրում ունեմ Արամի անունով՝ երեք գիշերով։' },
          { es: 'Busco una habitación individual para hoy.', hy: 'Այսօրվա համար մեկտեղանոց սենյակ եմ փնտրում։' },
          { es: 'Sí, ya reservé por internet hace una semana.', hy: 'Այո, արդեն ամրագրել եմ համացանցով մեկ շաբաթ առաջ։' },
        ],
      },
      {
        es: 'Aquí está tu tarjeta de la habitación 204. El desayuno se sirve de 7:30 a 10:30. ¿Necesitas información sobre el wifi o algo en la habitación?',
        hy: 'Ահա քո 204 սենյակի քարտը։ Նախաճաշը մատուցվում է 7:30-ից 10:30։ Վայ-ֆայ-ի կամ սենյակի մասին տեղեկություն պե՞տք է։',
        hintHy: 'Հարցրու վայ-ֆայ-ի կամ սենյակի մասին։',
        options: [
          { es: '¿Cuál es la contraseña del wifi, por favor?', hy: 'Ո՞րն է վայ-ֆայ-ի գաղտնաբառը, խնդրեմ։' },
          { es: '¿El desayuno está incluido en el precio?', hy: 'Նախաճաշը ներառվա՞ծ է գնի մեջ։' },
          { es: 'Todo claro, pero hay un problema en mi habitación.', hy: 'Ամեն ինչ պարզ է, բայց սենյակումս մի խնդիր կա։' },
        ],
      },
      {
        es: '¡Vaya, cuánto lo siento! Si hay algún problema con el aire acondicionado o te faltan toallas, envío ahora mismo al técnico. ¿Qué ocurre exactamente?',
        hy: 'Օ՜, շատ ցավում եմ։ Եթե օդորակիչի հետ խնդիր կա կամ սրբիչներ են պակասում, հենց հիմա մասնագետ ուղարկեմ։ Կոնկրետ ի՞նչ է պատահել։',
        hintHy: 'Բացատրիր սենյակի խնդիրը։',
        options: [
          { es: 'El aire acondicionado no funciona y hace mucho calor.', hy: 'Օդորակիչը չի աշխատում և շատ շոգ է։' },
          { es: 'Faltan toallas limpias en el baño.', hy: 'Լոգարանում մաքուր սրբիչներ են պակասում։' },
          { es: 'La tarjeta de la puerta no abre bien la habitación.', hy: 'Դռան քարտը լավ չի բացում սենյակը։' },
        ],
      },
      {
        es: 'Ya queda todo solucionado. Además, si haces el check-out mañana, podemos guardar tu maleta en consigna sin coste. ¿A qué hora sales?',
        hy: 'Ամեն ինչ արդեն կարգավորված է։ Բացի այդ, եթե վաղը դուրս գաս, կարող ենք պահել ճամպրուկդ պահախցիկում՝ անվճար։ Ժամը քանիսի՞ն ես մեկնում։',
        hintHy: 'Ասա մեկնելու ժամը և շնորհակալություն հայտնիր։',
        options: [
          { es: 'Mi vuelo sale a las seis de la tarde, muchas gracias.', hy: 'Թռիչքս երեկոյան ժամը վեցին է, շատ շնորհակալ եմ։' },
          { es: '¡Genial! Recogeré la maleta sobre las cuatro.', hy: 'Հիանալի է։ Ճամպրուկը կվերցնեմ ժամը չորսի կողմերը։' },
          { es: 'Muchas gracias por su ayuda, hasta mañana.', hy: 'Շատ շնորհակալ եմ օգնության համար, մինչ վաղը։' },
        ],
      },
    ],
    'Empleado del aeropuerto': [
      {
        es: '¡Buenos días! ¿A dónde viajas hoy y tienes ya tu tarjeta de embarque o necesitas facturar equipaje?',
        hy: 'Բարի լույս։ Այսօր ու՞ր ես ճամփորդում և արդեն ունե՞ս նստեցման կտրոն, թե՞ պետք է ուղեբեռ հանձնես։',
        hintHy: 'Պատասխանիր ուղղության և ուղեբեռի մասին։',
        options: [
          { es: 'Viajo a Madrid y necesito facturar esta maleta.', hy: 'Ճամփորդում եմ Մադրիդ և պետք է հանձնեմ այս ճամպրուկը։' },
          { es: 'Voy a Barcelona y ya tengo la tarjeta en el móvil.', hy: 'Գնում եմ Բարսելոնա և արդեն ունեմ կտրոնը հեռախոսիս մեջ։' },
          { es: 'Solo llevo mochila de mano, no tengo que facturar.', hy: 'Միայն ձեռքի ուսապարկ ունեմ, ուղեբեռ չեմ հանձնում։' },
        ],
      },
      {
        es: 'Pon la maleta en la báscula, por favor. Uy, pesa 25 kilos y el máximo permitido es 23. ¿Qué prefieres hacer?',
        hy: 'Դիր ճամպրուկը կշեռքին, խնդրեմ։ Օյ, կշռում է 25 կգ, իսկ թույլատրելի առավելագույնը 23 է։ Ի՞նչ կնախընտրես անել։',
        hintHy: 'Ընտրիր՝ իրեր հանել, թե հարցնել հավելավճարի մասին։',
        options: [
          { es: 'Saco un par de libros y los meto en mi mochila.', hy: 'Մի քանի գիրք կհանեմ և կդնեմ ուսապարկիս մեջ։' },
          { es: '¿Cuánto cuesta pagar por los dos kilos de exceso?', hy: 'Որքա՞ն արժե երկու ավելորդ կիլոգրամի համար վճարելը։' },
          { es: 'Un momento, paso mi chaqueta al equipaje de mano.', hy: 'Մի րոպե, բաճկոնս տեղափոխեմ ձեռքի ուղեբեռի մեջ։' },
        ],
      },
      {
        es: 'De acuerdo, así está perfecto. Atención: tu puerta de embarque ha cambiado de la B12 a la C38 por un pequeño retraso de 20 minutos.',
        hy: 'Լավ, այսպես հիանալի է։ Ուշադրություն՝ քո նստեցման դարպասը փոխվել է B12-ից C38՝ 20 րոպե փոքր ուշացման պատճառով։',
        hintHy: 'Հարցրու C38 դարպասի ճանապարհը կամ ժամանակը։',
        options: [
          { es: '¿Cómo puedo llegar rápido a la puerta C38?', hy: 'Ինչպե՞ս կարող եմ արագ հասնել C38 դարպաս։' },
          { es: '¿Cuánto tiempo se tarda desde el control de seguridad?', hy: 'Որքա՞ն ժամանակ է պահանջվում անվտանգության ստուգումից հետո։' },
          { es: 'Entendido, ¿y sigue saliendo el vuelo a la misma hora?', hy: 'Հասկացա, իսկ թռիչքը նույն ժամի՞ն է մեկնում։' },
        ],
      },
      {
        es: 'Sigue recto pasando el control de seguridad y gira a la izquierda. ¡Buen vuelo!',
        hy: 'Գնա ուղիղ՝ անցնելով անվտանգության ստուգումը, և թեքվիր ձախ։ Բարի թռիչք։',
        hintHy: 'Շնորհակալություն հայտնիր և հրաժեշտ տուր։',
        options: [
          { es: 'Muchas gracias por toda su ayuda, ¡hasta luego!', hy: 'Շատ շնորհակալ եմ Ձեր ամբողջ օգնության համար, ցտեսություն։' },
          { es: '¡Perfecto, voy corriendo hacia la puerta C38!', hy: 'Հիանալի է, վազում եմ դեպի C38 դարպաս։' },
          { es: '¡Gracias! Que tenga un buen día.', hy: 'Շնորհակալություն։ Բարի օր Ձեզ։' },
        ],
      },
    ],
  };

  const roleScript = scripts[params.role] ?? scripts.Camarero;
  const step = roleScript[Math.min(turn, roleScript.length - 1)];

  let correctionHy = '';
  if (msg.split(' ').length < 3) {
    correctionHy = 'Փորձիր ընտրել ամբողջական նախադասություն՝ ավելի բնական խոսելու համար։';
  }

  return {
    replyEs: step.es,
    replyHy: step.hy,
    hintHy: step.hintHy,
    suggestedOptions: step.options,
    correctionEs: '',
    correctionHy,
    usedFallback: true,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const ai = createAiClient();
    res.json({ ok: true, aiAvailable: Boolean(ai) });
  });

  app.post('/api/evaluate', async (req, res) => {
    const {
      userResponse = '',
      promptEs = '',
      sampleAnswerEs = '',
      expectedKeywords = [],
      level = 'B1',
      contextHy = '',
    } = req.body ?? {};

    const ai = createAiClient();
    if (!ai) {
      res.json(
        localEvaluateResponse({
          userResponse,
          promptEs,
          sampleAnswerEs,
          expectedKeywords,
          level,
          contextHy,
        })
      );
      return;
    }

    try {
      const systemInstruction = `Eres un profesor cercano y exigente de español de España (es-ES) para un estudiante de 15 años de habla armenia (nivel ${level}).
Evalúa la respuesta del alumno a una situación conversacional real.
REGLAS ESTRICTAS:
1. Acepta cualquier respuesta natural, comprensible y comunicativamente válida en español de España (NO exijas coincidencia exacta con la respuesta modelo).
2. Si la respuesta es demasiado breve (ej. "quiero pizza") o poco educada/natural, acéptala como "mejorable" y sugiere una versión más natural y educada ("Me gustaría pedir una pizza, por favor").
3. Si la respuesta no tiene sentido en la situación o no está en español, márcala como accepted=false y quality="incorrecto".
4. Toda la explicación pedagógica ("feedbackHy") DEBE estar escrita en ARMENIO natural y claro (նախատեսված 15 տարեկան աշակերտի համար), SIN USAR NUNCA RUSO NI INGLÉS.`;

      const prompt = `Situación o pregunta del interlocutor: "${promptEs}"
Contexto en armenio: "${contextHy}"
Ejemplo de respuesta natural: "${sampleAnswerEs}"
Respuesta del alumno: "${userResponse}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accepted: { type: Type.BOOLEAN },
              quality: { type: Type.STRING, description: 'One of: excelente, bueno, mejorable, incorrecto' },
              naturalVersion: { type: Type.STRING, description: 'Natural Spain Spanish version suitable for the student' },
              feedbackEs: { type: Type.STRING, description: 'Short encouraging comment in Spanish' },
              feedbackHy: { type: Type.STRING, description: 'Helpful explanation and improvement tip in Armenian ONLY' },
            },
            required: ['accepted', 'quality', 'naturalVersion', 'feedbackEs', 'feedbackHy'],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? '{}');
      res.json({
        accepted: Boolean(parsed.accepted),
        quality: parsed.quality || 'bueno',
        naturalVersion: parsed.naturalVersion || sampleAnswerEs,
        feedbackEs: parsed.feedbackEs || '¡Buen trabajo!',
        feedbackHy: parsed.feedbackHy || 'Լավ պատասխան է։',
        usedFallback: false,
      });
    } catch (err) {
      console.error('Gemini evaluate error, using local evaluator:', err);
      res.json(
        localEvaluateResponse({
          userResponse,
          promptEs,
          sampleAnswerEs,
          expectedKeywords,
          level,
          contextHy,
        })
      );
    }
  });

  app.post('/api/chat', async (req, res) => {
    const {
      role = 'Camarero',
      level = 'B1',
      history = [],
      userMessage = '',
    } = req.body ?? {};

    const ai = createAiClient();
    if (!ai) {
      res.json(localCharacterReply({ role, level, history, userMessage }));
      return;
    }

    try {
      const levelGuide =
        level === 'A2'
          ? 'Usa frases cortas, vocabulario claro y preguntas directas (nivel A2).'
          : level === 'B2'
            ? 'Introduce un pequeño imprevisto, matices, objeciones educadas o petición de argumentos (nivel B2).'
            : 'Usa español cotidiano de España con preguntas de seguimiento que animen al alumno a explicar sus preferencias (nivel B1).';

      const systemInstruction = `Interpretas el papel de "${role}" en España en una conversación realista con un estudiante de 15 años.
${levelGuide}
REGLAS:
1. Responde siempre en español natural de España (tuteo o trato cercano adecuado al contexto).
2. Ten en cuenta todo lo que el alumno ha dicho antes en el historial.
3. Deja "correctionEs" y "correctionHy" vacíos "" si la frase del alumno es correcta.
4. Proporciona SIEMPRE la traducción exacta al armenio de tu réplica en "replyHy", y una pista útil en armenio en "hintHy".
5. Proporciona SIEMPRE exactamente 3 posibles respuestas naturales y variadas en español de España ("suggestedOptions") para que el alumno elija cómo continuar el diálogo, cada una con su traducción al armenio ("es", "hy").
6. PROHIBIDO usar ruso o inglés en las explicaciones o traducciones.`;

      const transcript = history
        .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Alumno' : role}: ${m.text}`)
        .join('\n');

      const prompt = `Historial previo:\n${transcript}\nAlumno: ${userMessage}\n\nResponde como ${role} siguiendo el diálogo y ofrece 3 opciones de respuesta para el alumno.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyEs: { type: Type.STRING },
              replyHy: { type: Type.STRING },
              hintHy: { type: Type.STRING },
              correctionEs: { type: Type.STRING },
              correctionHy: { type: Type.STRING },
              suggestedOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    es: { type: Type.STRING },
                    hy: { type: Type.STRING },
                  },
                  required: ['es', 'hy'],
                },
              },
            },
            required: ['replyEs', 'replyHy', 'hintHy', 'correctionEs', 'correctionHy', 'suggestedOptions'],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? '{}');
      const fallback = localCharacterReply({ role, level, history, userMessage });
      const suggestedOptions =
        Array.isArray(parsed.suggestedOptions) && parsed.suggestedOptions.length >= 2
          ? parsed.suggestedOptions.slice(0, 4)
          : fallback.suggestedOptions;

      res.json({
        replyEs: parsed.replyEs || fallback.replyEs,
        replyHy: parsed.replyHy || fallback.replyHy,
        hintHy: parsed.hintHy || fallback.hintHy,
        suggestedOptions,
        correctionEs: parsed.correctionEs || '',
        correctionHy: parsed.correctionHy || '',
        usedFallback: false,
      });
    } catch (err) {
      console.error('Gemini chat error, using branching offline script:', err);
      res.json(localCharacterReply({ role, level, history, userMessage }));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Habla Español server running on http://localhost:${PORT}`);
  });
}

startServer();
