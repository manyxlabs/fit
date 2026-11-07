import type en from '../../en/app/progress';
import type { Widen } from '../../shape';

const progress: Widen<typeof en> = {
  title: 'प्रोग्रेस',
  save: 'सेव करें',
  cancel: 'रद्द करें',

  weight: {
    title: 'वज़न',
    empty: 'हर सुबह "आज" टैब पर अपना वज़न लॉग करें। दो बार वज़न लेने के बाद चार्ट और ट्रेंड दिखेंगे।',
    trend: 'इस हफ्ते का ट्रेंड: <b>{change}</b><m> (गोल {goal})</m>',
    steady: 'स्थिर',
    chart: '{from} से {to} kg तक वज़न',
    chartNote: 'बिंदु वज़न की एंट्री हैं, लाइन ट्रेंड है। ऊपर {top} kg, नीचे {bottom} kg।',
  },

  maintenance: {
    title: 'मेंटेनेंस कैलोरी',
    formula: 'फॉर्मूले से: <b>{kcal} kcal</b>',
    measured: 'आपके लॉग से मापी गई: <b>{kcal} kcal</b>। आपके टारगेट इसी पर आधारित हैं।',
    unmeasured: '2-4 हफ्ते खाना और वज़न लॉग करें, तो ऐप आपकी असली मेंटेनेंस माप लेगा, जिसमें ज़्यादातर लोगों के लिए फॉर्मूले 5-10% तक चूक जाते हैं।',
  },

  week: {
    title: 'यह हफ्ता',
    kcal: 'औसत कैलोरी',
    protein: 'औसत प्रोटीन',
    workouts: 'वर्कआउट',
    sleep: 'औसत नींद',
    steps: 'औसत कदम',
  },

  body: {
    title: 'बॉडी कंपोज़िशन',
    bmi: 'BMI',
    bmiValue: '{bmi}, {band}',
    healthyWeight: 'आपकी लंबाई के लिए हेल्दी वज़न',
    waistToHeight: 'कमर और लंबाई का अनुपात (0.5 से कम रखें)',
    tapeFat: 'बॉडी फैट (टेप से अनुमान)',
    scaleFat: 'बॉडी फैट (स्केल, {date})',
    ffmi: 'फैट-फ्री मास इंडेक्स',
    bmiNote: 'BMI मसल और फैट में फर्क नहीं कर पाता; कम फैट वाला लिफ्टर भी ओवरवेट दिख सकता है। कमर और बॉडी फैट ज़्यादा बताते हैं।',
  },

  measurements: {
    add: 'मेज़रमेंट जोड़ें',
    waistMale: 'नाभि पर कमर (cm)',
    waistFemale: 'सबसे पतली जगह पर कमर (cm)',
    neck: 'गर्दन, गले की गांठ के नीचे (cm)',
    hip: 'सबसे चौड़ी जगह पर हिप्स (cm)',
    chest: 'छाती (cm)',
    arm: 'ऊपरी बाह, मोड़कर (cm)',
    thigh: 'जांघ (cm)',
    how: 'सुबह, शरीर ढीला छोड़कर मापें, टेप कसा हो पर दबाए नहीं। हर 2-4 हफ्ते काफी है।',
  },

  strength: {
    title: 'स्ट्रेंथ',
    lift: '{last} kg <m>(सबसे अच्छा {best}, शुरुआत {first})</m>',
    note: 'आपके सेट से अनुमानित वन-रेप मैक्स, रिज़र्व में बचे रेप्स गिनकर।',
    empty: 'अपने अनुमानित वन-रेप मैक्स यहां देखने के लिए वज़न वाली लिफ्ट के साथ एक वर्कआउट पूरा करें।',
  },

  photos: {
    title: 'प्रोग्रेस फोटो',
    about: 'हर 2-4 हफ्ते में आगे, साइड और पीछे से, एक ही जगह, रोशनी और कपड़ों में। ये इसी डिवाइस पर रहती हैं: कहीं अपलोड नहीं होतीं।',
    date: 'तारीख',
    poses: { front: 'आगे', side: 'साइड', back: 'पीछे' },
    posesInline: { front: 'आगे की', side: 'साइड की', back: 'पीछे की' },
    take: '{pose} फोटो लें',
    choose: '{pose} फोटो चुनें',
    delete: '{pose} फोटो डिलीट करें',
    alt: '{date} की {pose} फोटो',
    confirmDelete: '{date} की {pose} फोटो डिलीट करें?',
    unreadable: 'यह इमेज पढ़ी नहीं जा सकी। JPEG या PNG आज़माएं।',
    dates: 'फोटो वाली तारीखें',
    deleteDate: 'यह तारीख डिलीट करें',
    confirmDeleteDate: { one: '{date} की # फोटो डिलीट करें?', other: '{date} की सभी # फोटो डिलीट करें?' },
  },

  storage: {
    title: 'फोटो स्टोरेज',
    used: { one: '# फोटो इस ब्राउज़र की <b>{size}</b> स्टोरेज ले रही है।', other: '# फोटो इस ब्राउज़र की <b>{size}</b> स्टोरेज ले रही हैं।' },
    deleteAll: 'सभी फोटो डिलीट करें',
    confirmDeleteAll: { one: '# प्रोग्रेस फोटो डिलीट करें? इसे वापस नहीं लाया जा सकता।', other: 'सभी # प्रोग्रेस फोटो डिलीट करें? इन्हें वापस नहीं लाया जा सकता।' },
    persisted: 'इस ब्राउज़र ने डिवाइस में जगह कम होने पर Fit का डेटा न मिटाने की मंज़ूरी दी है। फिर भी इस डिवाइस के बाहर इकलौती कॉपी "और" में लिया गया बैकअप ही है।',
    persistAbout:
      'फोन में जगह कम होने पर ब्राउज़र किसी साइट का डेटा, फोटो समेत, मिटा सकता है। आप उससे Fit का डेटा रखने को कह सकते हैं। Chrome खुद तय करता है और आमतौर पर उन साइट के लिए मान जाता है जिन्हें आप अक्सर इस्तेमाल करते हैं या होम स्क्रीन पर जोड़ते हैं; Firefox आपसे पूछता है।',
    refused: 'इस बार ब्राउज़र नहीं माना। Fit को होम स्क्रीन पर जोड़ने से आमतौर पर मदद मिलती है; दोनों ही हालत में बैकअप रखें।',
    persist: 'Fit का डेटा रखें',
  },

  compare: {
    title: 'फोटो की तुलना करें',
    before: 'पहले',
    after: 'बाद में',
    beforeAlt: 'पहले, {date}',
    afterAlt: 'बाद में, {date}',
    needTwo: 'तुलना के लिए दो तारीखों पर {pose} फोटो जोड़ें।',
    sideBySide: 'साथ-साथ',
    slider: 'स्लाइडर',
    sliderLabel: 'पहले या बाद में',
    sliderNote: 'बाएं: {before}। दाएं: {after}।',
  },

  import: {
    title: 'हेल्थ ऐप से इम्पोर्ट करें',
    about: 'वज़न, कदम, नींद, बॉडी फैट और रेस्टिंग हार्ट रेट लाएं। फाइलें यहीं ब्राउज़र में पढ़ी जाती हैं और कभी अपलोड नहीं होतीं।',
    howTo: 'अपना डेटा एक्सपोर्ट कैसे करें',
    apple: '<b>iPhone (Apple Health)</b>: Health खोलें, अपनी फोटो पर टैप करें, फिर Export All Health Data। export.zip को Files में सेव करें और उसे यहां चुनें।',
    samsung:
      '<b>Samsung Health</b>: Samsung Health में Settings खोलें, फिर Download personal data। Download/Samsung Health में सेव हुए फोल्डर की सभी CSV फाइलें चुनें, या उस फोल्डर की zip।',
    googleFit: '<b>Google Fit</b>: takeout.google.com पर सिर्फ Fit चुनें, और जो zip मिले उसे चुनें।',
    healthConnect: '<b>Health Connect</b>: इसका अपना एक्सपोर्ट एक डेटाबेस है जिसे यह पेज अभी नहीं पढ़ सकता, इसलिए उस ऐप से एक्सपोर्ट करें जो इसमें डेटा लिखता है, जैसे Samsung Health या Google Fit।',
    reading: 'एक्सपोर्ट पढ़ा जा रहा है',
    preview: 'इम्पोर्ट प्रीव्यू',
    from: '{sources} से:',
    and: '{a} और {b}',
    kinds: { weight: 'वज़न', bodyFat: 'बॉडी फैट', steps: 'कदम', sleep: 'नींद', restingHr: 'रेस्टिंग हार्ट रेट' },
    days: { one: '# दिन', other: '# दिन' },
    oneDay: '<b>{kind}</b>: {days}, <d>{from}</d>',
    range: '<b>{kind}</b>: {days}, <d>{from}</d> से <d>{to}</d> तक',
    alreadyLogged: '({n} पहले से लॉग)',
    existing: 'जिन दिनों आप पहले ही लॉग कर चुके हैं',
    keepMine: 'मेरा रखें',
    useImported: 'इम्पोर्ट वाला लें',
    import: 'इम्पोर्ट करें',
    done: { one: '{sources} से # एंट्री इम्पोर्ट हुई।', other: '{sources} से # एंट्री इम्पोर्ट हुईं।' },
    choose: 'एक्सपोर्ट फाइलें चुनें',
    accepts: 'export.zip, Takeout zip या Samsung Health CSV',
    errors: {
      empty: 'इन फाइलों में इम्पोर्ट करने के लिए वज़न, कदम, नींद, बॉडी फैट या रेस्टिंग हार्ट रेट नहीं है।',
      unreadable: 'यह ब्राउज़र फाइलें नहीं पढ़ सका।',
      noData: 'कोई हेल्थ डेटा नहीं मिला। Apple Health का export.zip, Samsung Health की CSV फाइलें या Google Fit का Takeout चुनें।',
      notZip: 'यह zip फाइल नहीं है।',
      damaged: 'यह zip फाइल खराब है।',
      password: 'यह zip फाइल पासवर्ड से सुरक्षित है।',
      method: '{file} ऐसे तरीके से कंप्रेस है जिसे यह ब्राउज़र नहीं पढ़ सकता।',
    },
  },
};

export default progress;
