import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'कॅलरी',
    logFood: 'जेवण नोंदवा',
    left: '{n} <s>kcal उरल्या</s>',
    over: '{n} <s>kcal जास्त</s>',
    eaten: 'खाल्ले',
  },
  checkIn: {
    title: 'आज तुम्हाला कसे वाटते?',
    sleep: 'काल रात्रीची झोप (तास)',
    energy: 'एनर्जी',
    energyLevels: ['1 पूर्ण थकवा', '2 कमी', '3 ठीक', '4 चांगली', '5 भरपूर'],
    soreness: 'अंगदुखी',
    sorenessLevels: ['1 नाही', '2 थोडी', '3 काही', '4 जास्त', '5 खूप जास्त'],
    unwell: 'बरे वाटत नाही?',
    sick: { none: 'नाही', aboveNeck: 'फक्त मानेच्या वर: नाक वाहणे, घशात थोडी खवखव', belowNeck: 'ताप, अंगदुखी, छातीत किंवा पोटात त्रास' },
  },
  training: {
    title: 'ट्रेनिंग',
    view: 'पाहा',
    start: 'सुरू करा',
    next: 'पुढचे: <b>{name}</b>',
  },
  water: {
    title: 'पाणी',
    amount: '{n} <s>/ {target} लिटर</s>',
  },
  body: {
    title: 'शरीर',
    weight: 'वजन (kg)',
    steps: 'पावले',
  },
  supplements: {
    title: 'सप्लिमेंट्स',
    guide: 'गाइड',
  },
  fasting: {
    title: 'उपवास',
    ramadan: 'रमजान',
    navratri: 'नवरात्र',
    state: {
      ifEating: '<b>खाण्याची वेळ चालू</b>, {time} ला संपते',
      ifFasting: '<b>उपवास चालू</b>, खाण्याची वेळ {time} ला सुरू होते',
      ramadanEating: '<b>खाण्याची वेळ चालू</b>, सहरी {time} ला संपते',
      ramadanFasting: '<b>रोजा चालू</b>, इफ्तार {time} ला',
    },
    times: 'सहरी संपते <b>{fajr}</b> · इफ्तार <b>{maghrib}</b>',
    timesTomorrow: 'उद्या: सहरी संपते <b>{fajr}</b> · इफ्तार <b>{maghrib}</b>',
    cityHint: '{city} साठी सूर्याच्या स्थितीवरून काढले (फज्र 18 अंशांवर); तुमच्या मशिदीच्या वेळापत्रकात काही मिनिटांचा फरक असू शकतो.',
    vrat: 'आज उपवास (एकादशी किंवा इतर उपवासाचा दिवस)',
    navratriHint: 'संपूर्ण नवरात्रभर चालू. "अधिक" मध्ये बदला.',
    vratHint: 'फूड सर्च आणि मील प्लॅनमध्ये फक्त उपवासाचे पदार्थ दिसतात. <a>दिवसाचा प्लॅन करा</a>',
  },
};

export default today;
