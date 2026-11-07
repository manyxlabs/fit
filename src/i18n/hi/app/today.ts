import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'कैलोरी',
    logFood: 'खाना लॉग करें',
    left: '{n} <s>kcal बाकी</s>',
    over: '{n} <s>kcal ज़्यादा</s>',
    eaten: 'खाया',
  },
  checkIn: {
    title: 'आज आप कैसा महसूस कर रहे हैं?',
    sleep: 'कल रात की नींद (घंटे)',
    energy: 'एनर्जी',
    energyLevels: ['1 बिल्कुल थका', '2 कम', '3 ठीक-ठाक', '4 अच्छी', '5 बहुत बढ़िया'],
    soreness: 'मसल में दर्द',
    sorenessLevels: ['1 बिल्कुल नहीं', '2 हल्का', '3 थोड़ा', '4 ज़्यादा', '5 बहुत ज़्यादा'],
    unwell: 'तबीयत ठीक नहीं?',
    sick: { none: 'नहीं', aboveNeck: 'सिर्फ गर्दन से ऊपर: नाक बहना, गले में हल्की खराश', belowNeck: 'बुखार, बदन दर्द, छाती या पेट की तकलीफ' },
  },
  training: {
    title: 'ट्रेनिंग',
    view: 'देखें',
    start: 'शुरू करें',
    next: 'अगला: <b>{name}</b>',
  },
  water: {
    title: 'पानी',
    amount: '{n} <s>/ {target} लीटर</s>',
  },
  body: {
    title: 'शरीर',
    weight: 'वज़न (kg)',
    steps: 'कदम',
  },
  supplements: {
    title: 'सप्लीमेंट',
    guide: 'गाइड',
  },
  fasting: {
    title: 'उपवास',
    ramadan: 'रमज़ान',
    navratri: 'नवरात्रि',
    state: {
      ifEating: '<b>खाने का समय चालू</b>, {time} पर बंद होगा',
      ifFasting: '<b>उपवास</b>, खाने का समय {time} पर शुरू होगा',
      ramadanEating: '<b>खाने का समय चालू</b>, सहरी {time} पर खत्म',
      ramadanFasting: '<b>रोज़ा</b>, इफ्तार {time} पर',
    },
    times: 'सहरी खत्म <b>{fajr}</b> · इफ्तार <b>{maghrib}</b>',
    timesTomorrow: 'कल: सहरी खत्म <b>{fajr}</b> · इफ्तार <b>{maghrib}</b>',
    cityHint: '{city} के लिए सूरज की स्थिति से निकाला गया (फज्र 18 डिग्री पर); आपकी मस्जिद के टाइमटेबल से कुछ मिनट का फर्क हो सकता है।',
    vrat: 'आज व्रत है (एकादशी या कोई और व्रत का दिन)',
    navratriHint: 'पूरी नवरात्रि चालू रहेगा। इसे "और" में बदलें।',
    vratHint: 'खाना खोजने और मील प्लान में सिर्फ व्रत का खाना दिखेगा। <a>दिन का प्लान बनाएं</a>',
  },
};

export default today;
