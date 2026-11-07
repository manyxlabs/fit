import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'કેલરી',
    logFood: 'ખોરાક લૉગ કરો',
    left: '{n} <s>kcal બાકી</s>',
    over: '{n} <s>kcal વધારે</s>',
    eaten: 'ખાધેલું',
  },
  checkIn: {
    title: 'આજે તમને કેવું લાગે છે?',
    sleep: 'ગઈ રાતની ઊંઘ (કલાક)',
    energy: 'એનર્જી',
    energyLevels: ['1 થાકેલા', '2 ઓછી', '3 ઠીક', '4 સારી', '5 ખૂબ સારી'],
    soreness: 'દુખાવો',
    sorenessLevels: ['1 બિલકુલ નહીં', '2 હળવો', '3 થોડો', '4 વધુ', '5 ખૂબ વધુ'],
    unwell: 'તબિયત બરાબર નથી?',
    sick: { none: 'ના', aboveNeck: 'ફક્ત ગળાની ઉપર: વહેતું નાક, ગળામાં હળવી ખરાશ', belowNeck: 'તાવ, શરીર દુખવું, છાતી કે પેટની તકલીફ' },
  },
  training: {
    title: 'ટ્રેનિંગ',
    view: 'જુઓ',
    start: 'શરૂ કરો',
    next: 'હવે પછી: <b>{name}</b>',
  },
  water: {
    title: 'પાણી',
    amount: '{n} <s>/ {target} લિટર</s>',
  },
  body: {
    title: 'શરીર',
    weight: 'વજન (kg)',
    steps: 'પગલાં',
  },
  supplements: {
    title: 'સપ્લિમેન્ટ્સ',
    guide: 'ગાઇડ',
  },
  fasting: {
    title: 'ઉપવાસ',
    ramadan: 'રમઝાન',
    navratri: 'નવરાત્રી',
    state: {
      ifEating: '<b>ખાવાનો સમય ચાલુ</b>, {time} વાગ્યે બંધ થશે',
      ifFasting: '<b>ઉપવાસ ચાલુ</b>, ખાવાનો સમય {time} વાગ્યે શરૂ થશે',
      ramadanEating: '<b>ખાવાનો સમય ચાલુ</b>, સેહરી {time} વાગ્યે પૂરી',
      ramadanFasting: '<b>રોઝો ચાલુ</b>, ઇફ્તાર {time} વાગ્યે',
    },
    times: 'સેહરી પૂરી <b>{fajr}</b> · ઇફ્તાર <b>{maghrib}</b>',
    timesTomorrow: 'આવતીકાલે: સેહરી પૂરી <b>{fajr}</b> · ઇફ્તાર <b>{maghrib}</b>',
    cityHint: '{city} માટે સૂર્યની સ્થિતિ પરથી ગણેલું (ફજર 18 ડિગ્રી પર); તમારી મસ્જિદનું ટાઇમટેબલ થોડી મિનિટ જુદું હોઈ શકે.',
    vrat: 'આજે વ્રત (એકાદશી કે બીજો ઉપવાસનો દિવસ)',
    navratriHint: 'આખી નવરાત્રી ચાલુ. વધુ માં બદલો.',
    vratHint: 'ખોરાક સર્ચ અને મીલ પ્લાનમાં ફક્ત ફરાળી ખોરાક દેખાય છે. <a>દિવસનો પ્લાન બનાવો</a>',
  },
};

export default today;
