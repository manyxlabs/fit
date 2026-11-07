import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'క్యాలరీలు',
    logFood: 'ఆహారం లాగ్ చేయండి',
    left: '{n} <s>kcal మిగిలాయి</s>',
    over: '{n} <s>kcal ఎక్కువ</s>',
    eaten: 'తిన్నది',
  },
  checkIn: {
    title: 'ఈరోజు ఎలా ఉన్నారు?',
    sleep: 'నిన్న రాత్రి నిద్ర (h)',
    energy: 'ఎనర్జీ',
    energyLevels: ['1 పూర్తిగా అలసట', '2 తక్కువ', '3 పర్వాలేదు', '4 బాగుంది', '5 చాలా బాగుంది'],
    soreness: 'కండరాల నొప్పి',
    sorenessLevels: ['1 లేదు', '2 కొంచెం', '3 కొంత', '4 ఎక్కువ', '5 చాలా ఎక్కువ'],
    unwell: 'ఒంట్లో బాగోలేదా?',
    sick: { none: 'లేదు', aboveNeck: 'మెడ పైన మాత్రమే: ముక్కు కారడం, కొంచెం గొంతు నొప్పి', belowNeck: 'జ్వరం, ఒళ్లు నొప్పులు, ఛాతీ లేదా కడుపు సమస్యలు' },
  },
  training: {
    title: 'ట్రైనింగ్',
    view: 'చూడండి',
    start: 'మొదలుపెట్టండి',
    next: 'తర్వాత: <b>{name}</b>',
  },
  water: {
    title: 'నీళ్లు',
    amount: '{n} <s>/ {target} లీటర్లు</s>',
  },
  body: {
    title: 'శరీరం',
    weight: 'బరువు (kg)',
    steps: 'స్టెప్స్',
  },
  supplements: {
    title: 'సప్లిమెంట్లు',
    guide: 'గైడ్',
  },
  fasting: {
    title: 'ఉపవాసం',
    ramadan: 'రంజాన్',
    navratri: 'నవరాత్రి',
    state: {
      ifEating: '<b>తినే సమయం నడుస్తోంది</b>, {time}కు ముగుస్తుంది',
      ifFasting: '<b>ఉపవాసం</b>, తినే సమయం {time}కు మొదలవుతుంది',
      ramadanEating: '<b>తినే సమయం నడుస్తోంది</b>, సహరీ {time}కు ముగుస్తుంది',
      ramadanFasting: '<b>ఉపవాసం</b>, ఇఫ్తార్ {time}కు',
    },
    times: 'సహరీ ముగింపు <b>{fajr}</b> · ఇఫ్తార్ <b>{maghrib}</b>',
    timesTomorrow: 'రేపు: సహరీ ముగింపు <b>{fajr}</b> · ఇఫ్తార్ <b>{maghrib}</b>',
    cityHint: '{city}కు సూర్యుని స్థానం నుంచి లెక్కించాం (ఫజ్ర్ 18 డిగ్రీల వద్ద); మీ మసీదు టైమ్‌టేబుల్ కొన్ని నిమిషాలు తేడా ఉండవచ్చు.',
    vrat: 'ఈరోజు వ్రతం (ఏకాదశి లేదా ఇంకో ఉపవాస రోజు)',
    navratriHint: 'నవరాత్రి మొత్తం ఆన్‌లో ఉంటుంది. మరిన్ని ట్యాబ్‌లో మార్చుకోండి.',
    vratHint: 'ఆహారం సెర్చ్, మీల్ ప్లాన్ వ్రతం ఆహారాలను మాత్రమే చూపిస్తాయి. <a>రోజును ప్లాన్ చేయండి</a>',
  },
};

export default today;
