import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'கலோரி',
    logFood: 'உணவைப் பதிவு செய்',
    left: '{n} <s>kcal மீதம்</s>',
    over: '{n} <s>kcal அதிகம்</s>',
    eaten: 'சாப்பிட்டது',
  },
  checkIn: {
    title: 'இன்று எப்படி இருக்கிறீர்கள்?',
    sleep: 'நேற்றிரவு தூக்கம் (h)',
    energy: 'எனர்ஜி',
    energyLevels: ['1 சோர்ந்துவிட்டேன்', '2 குறைவு', '3 பரவாயில்லை', '4 நன்று', '5 அருமை'],
    soreness: 'தசை வலி',
    sorenessLevels: ['1 இல்லை', '2 லேசாக', '3 ஓரளவு', '4 அதிகம்', '5 மிக அதிகம்'],
    unwell: 'உடல்நலமில்லையா?',
    sick: { none: 'இல்லை', aboveNeck: 'கழுத்துக்கு மேலே மட்டும்: மூக்கு ஒழுகுதல், லேசான தொண்டை வலி', belowNeck: 'காய்ச்சல், உடல் வலி, நெஞ்சு அல்லது வயிற்று அறிகுறிகள்' },
  },
  training: {
    title: 'பயிற்சி',
    view: 'பார்',
    start: 'தொடங்கு',
    next: 'அடுத்து: <b>{name}</b>',
  },
  water: {
    title: 'தண்ணீர்',
    amount: '{n} <s>/ {target} லிட்டர்</s>',
  },
  body: {
    title: 'உடல்',
    weight: 'எடை (kg)',
    steps: 'அடிகள்',
  },
  supplements: {
    title: 'சப்ளிமென்ட்கள்',
    guide: 'வழிகாட்டி',
  },
  fasting: {
    title: 'விரதம்',
    ramadan: 'ரமலான்',
    navratri: 'நவராத்திரி',
    state: {
      ifEating: '<b>சாப்பிடும் நேரம்</b>, {time}-க்கு முடியும்',
      ifFasting: '<b>விரதம்</b>, சாப்பிடும் நேரம் {time}-க்குத் தொடங்கும்',
      ramadanEating: '<b>சாப்பிடும் நேரம்</b>, ஸஹர் {time}-க்கு முடியும்',
      ramadanFasting: '<b>நோன்பு</b>, இஃப்தார் {time}-க்கு',
    },
    times: 'ஸஹர் முடிவு <b>{fajr}</b> · இஃப்தார் <b>{maghrib}</b>',
    timesTomorrow: 'நாளை: ஸஹர் முடிவு <b>{fajr}</b> · இஃப்தார் <b>{maghrib}</b>',
    cityHint: 'சூரியனின் நிலையை வைத்து {city}-க்குக் கணக்கிடப்பட்டது (ஃபஜ்ர் 18 டிகிரியில்); உங்கள் பள்ளிவாசலின் நேர அட்டவணை சில நிமிடங்கள் வேறுபடலாம்.',
    vrat: 'இன்று விரதம் (ஏகாதசி அல்லது வேறு விரத நாள்)',
    navratriHint: 'நவராத்திரி முழுவதும் ஆனில் இருக்கும். மேலும் டேபில் மாற்றலாம்.',
    vratHint: 'உணவுத் தேடலும் உணவுத் திட்டமும் விரத உணவுகளை மட்டுமே காட்டும். <a>நாளைத் திட்டமிடு</a>',
  },
};

export default today;
