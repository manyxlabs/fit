import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'ಕ್ಯಾಲೊರಿ',
    logFood: 'ಆಹಾರ ಲಾಗ್ ಮಾಡಿ',
    left: '{n} <s>kcal ಉಳಿದಿದೆ</s>',
    over: '{n} <s>kcal ಹೆಚ್ಚಾಗಿದೆ</s>',
    eaten: 'ತಿಂದದ್ದು',
  },
  checkIn: {
    title: 'ಇಂದು ಹೇಗಿದ್ದೀರಿ?',
    sleep: 'ನಿನ್ನೆ ರಾತ್ರಿಯ ನಿದ್ದೆ (ಗಂ)',
    energy: 'ಶಕ್ತಿ',
    energyLevels: ['1 ಸುಸ್ತಾಗಿದೆ', '2 ಕಡಿಮೆ', '3 ಪರವಾಗಿಲ್ಲ', '4 ಚೆನ್ನಾಗಿದೆ', '5 ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ'],
    soreness: 'ಸ್ನಾಯು ನೋವು',
    sorenessLevels: ['1 ಇಲ್ಲ', '2 ಸ್ವಲ್ಪ', '3 ಸ್ವಲ್ಪ ಹೆಚ್ಚು', '4 ಜಾಸ್ತಿ', '5 ತುಂಬಾ ಜಾಸ್ತಿ'],
    unwell: 'ಹುಷಾರಿಲ್ಲವೇ?',
    sick: { none: 'ಇಲ್ಲ', aboveNeck: 'ಕುತ್ತಿಗೆಯ ಮೇಲೆ ಮಾತ್ರ: ಮೂಗು ಸೋರುವುದು, ಸ್ವಲ್ಪ ಗಂಟಲು ನೋವು', belowNeck: 'ಜ್ವರ, ಮೈಕೈ ನೋವು, ಎದೆ ಅಥವಾ ಹೊಟ್ಟೆಯ ಲಕ್ಷಣಗಳು' },
  },
  training: {
    title: 'ಟ್ರೈನಿಂಗ್',
    view: 'ನೋಡಿ',
    start: 'ಶುರು ಮಾಡಿ',
    next: 'ಮುಂದಿನದು: <b>{name}</b>',
  },
  water: {
    title: 'ನೀರು',
    amount: '{n} <s>/ {target} ಲೀಟರ್</s>',
  },
  body: {
    title: 'ದೇಹ',
    weight: 'ತೂಕ (kg)',
    steps: 'ಹೆಜ್ಜೆಗಳು',
  },
  supplements: {
    title: 'ಸಪ್ಲಿಮೆಂಟ್ಸ್',
    guide: 'ಗೈಡ್',
  },
  fasting: {
    title: 'ಉಪವಾಸ',
    ramadan: 'ರಂಜಾನ್',
    navratri: 'ನವರಾತ್ರಿ',
    state: {
      ifEating: '<b>ತಿನ್ನುವ ಅವಧಿ ತೆರೆದಿದೆ</b>, {time} ಕ್ಕೆ ಮುಗಿಯುತ್ತದೆ',
      ifFasting: '<b>ಉಪವಾಸ</b>, ತಿನ್ನುವ ಅವಧಿ {time} ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ',
      ramadanEating: '<b>ತಿನ್ನುವ ಅವಧಿ ತೆರೆದಿದೆ</b>, ಸೆಹ್ರಿ {time} ಕ್ಕೆ ಮುಗಿಯುತ್ತದೆ',
      ramadanFasting: '<b>ಉಪವಾಸ</b>, ಇಫ್ತಾರ್ {time} ಕ್ಕೆ',
    },
    times: 'ಸೆಹ್ರಿ ಮುಕ್ತಾಯ <b>{fajr}</b> · ಇಫ್ತಾರ್ <b>{maghrib}</b>',
    timesTomorrow: 'ನಾಳೆ: ಸೆಹ್ರಿ ಮುಕ್ತಾಯ <b>{fajr}</b> · ಇಫ್ತಾರ್ <b>{maghrib}</b>',
    cityHint: 'ಸೂರ್ಯನ ಸ್ಥಾನದಿಂದ {city} ಗಾಗಿ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ (ಫಜ್ರ್ 18 ಡಿಗ್ರಿಯಲ್ಲಿ); ನಿಮ್ಮ ಮಸೀದಿಯ ವೇಳಾಪಟ್ಟಿ ಕೆಲವು ನಿಮಿಷ ಬೇರೆ ಇರಬಹುದು.',
    vrat: 'ಇಂದು ವ್ರತ (ಏಕಾದಶಿ ಅಥವಾ ಬೇರೆ ಉಪವಾಸದ ದಿನ)',
    navratriHint: 'ನವರಾತ್ರಿಯ ಎಲ್ಲಾ ದಿನಗಳು ಆನ್ ಇರುತ್ತದೆ. ಇನ್ನಷ್ಟು ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಬದಲಿಸಿ.',
    vratHint: 'ಆಹಾರ ಹುಡುಕಾಟ ಮತ್ತು ಮೀಲ್ ಪ್ಲ್ಯಾನ್ ವ್ರತದ ಆಹಾರಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸುತ್ತವೆ. <a>ದಿನದ ಪ್ಲ್ಯಾನ್ ಮಾಡಿ</a>',
  },
};

export default today;
