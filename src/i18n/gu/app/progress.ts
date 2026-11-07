import type en from '../../en/app/progress';
import type { Widen } from '../../shape';

const progress: Widen<typeof en> = {
  title: 'પ્રોગ્રેસ',
  save: 'સેવ કરો',
  cancel: 'રદ કરો',

  weight: {
    title: 'વજન',
    empty: 'દરરોજ સવારે આજે ટૅબ પર તમારું વજન લૉગ કરો. બે વાર વજન નોંધ્યા પછી ચાર્ટ અને ટ્રેન્ડ દેખાશે.',
    trend: 'આ અઠવાડિયાનો ટ્રેન્ડ: <b>{change}</b><m> (ગોલ {goal})</m>',
    steady: 'સ્થિર',
    chart: '{from} થી {to} kg સુધીનું વજન',
    chartNote: 'ટપકાં વજનની નોંધ છે, લાઇન ટ્રેન્ડ છે. ઉપર {top} kg, નીચે {bottom} kg.',
  },

  maintenance: {
    title: 'મેન્ટેનન્સ કેલરી',
    formula: 'ફોર્મ્યુલા પરથી: <b>{kcal} kcal</b>',
    measured: 'તમારા લૉગ પરથી માપેલી: <b>{kcal} kcal</b>. તમારા ટાર્ગેટ આ જ વાપરે છે.',
    unmeasured: '2-4 અઠવાડિયાં ખોરાક અને વજન લૉગ કરો, એટલે એપ તમારી સાચી મેન્ટેનન્સ માપી લેશે, જે મોટા ભાગના લોકો માટે ફોર્મ્યુલા 5-10% ચૂકી જાય છે.',
  },

  week: {
    title: 'આ અઠવાડિયું',
    kcal: 'સરેરાશ કેલરી',
    protein: 'સરેરાશ પ્રોટીન',
    workouts: 'વર્કઆઉટ',
    sleep: 'સરેરાશ ઊંઘ',
    steps: 'સરેરાશ પગલાં',
  },

  body: {
    title: 'શરીરની રચના',
    bmi: 'BMI',
    bmiValue: '{bmi}, {band}',
    healthyWeight: 'તમારી ઊંચાઈ માટે સ્વસ્થ વજન',
    waistToHeight: 'કમર અને ઊંચાઈનો રેશિયો (0.5 થી ઓછો રાખો)',
    tapeFat: 'બોડી ફેટ (ટેપથી અંદાજ)',
    scaleFat: 'બોડી ફેટ (સ્કેલ, {date})',
    ffmi: 'ફેટ-ફ્રી માસ ઇન્ડેક્સ',
    bmiNote: 'BMI મસલ અને ફેટ વચ્ચે ફરક કરી શકતો નથી; ઓછા ફેટવાળો લિફ્ટર પણ વધુ વજનવાળો દેખાઈ શકે છે. કમર અને બોડી ફેટ વધુ સાચું કહે છે.',
  },

  measurements: {
    add: 'માપ ઉમેરો',
    waistMale: 'નાભિ પાસે કમર (cm)',
    waistFemale: 'સૌથી પાતળી જગ્યાએ કમર (cm)',
    neck: 'ગરદન, હૈડિયાની નીચે (cm)',
    hip: 'સૌથી પહોળી જગ્યાએ હિપ્સ (cm)',
    chest: 'છાતી (cm)',
    arm: 'બાવડું, વાળેલું (cm)',
    thigh: 'સાથળ (cm)',
    how: 'સવારે, શરીર ઢીલું રાખીને માપો, ટેપ ચોંટેલી રાખો પણ દબાવો નહીં. દર 2-4 અઠવાડિયે માપવું પૂરતું છે.',
  },

  strength: {
    title: 'સ્ટ્રેન્થ',
    lift: '{last} kg <m>(બેસ્ટ {best}, શરૂઆત {first})</m>',
    note: 'તમારા સેટ પરથી અંદાજિત વન-રેપ મેક્સ, બાકી રાખેલા રેપ્સ ગણીને.',
    empty: 'અહીં તમારા અંદાજિત વન-રેપ મેક્સ જોવા માટે વજનવાળી લિફ્ટ સાથે વર્કઆઉટ પૂરો કરો.',
  },

  photos: {
    title: 'પ્રોગ્રેસ ફોટા',
    about: 'દર 2-4 અઠવાડિયે આગળથી, બાજુથી અને પાછળથી, એ જ જગ્યાએ, એ જ પ્રકાશ અને કપડાંમાં. તે આ ડિવાઇસ પર જ રહે છે: ક્યાંય અપલોડ થતા નથી.',
    date: 'તારીખ',
    poses: { front: 'આગળ', side: 'બાજુ', back: 'પાછળ' },
    posesInline: { front: 'આગળનો', side: 'બાજુનો', back: 'પાછળનો' },
    take: '{pose} ફોટો લો',
    choose: '{pose} ફોટો પસંદ કરો',
    delete: '{pose} ફોટો ડિલીટ કરો',
    alt: '{pose} ફોટો, {date}',
    confirmDelete: '{date} નો {pose} ફોટો ડિલીટ કરવો છે?',
    unreadable: 'આ ઇમેજ વાંચી શકાઈ નહીં. JPEG કે PNG અજમાવો.',
    dates: 'ફોટાવાળી તારીખો',
    deleteDate: 'આ તારીખ ડિલીટ કરો',
    confirmDeleteDate: { one: '{date} નો # ફોટો ડિલીટ કરવો છે?', other: '{date} ના બધા # ફોટા ડિલીટ કરવા છે?' },
  },

  storage: {
    title: 'ફોટો સ્ટોરેજ',
    used: { one: '# ફોટો આ બ્રાઉઝરનું <b>{size}</b> સ્ટોરેજ વાપરે છે.', other: '# ફોટા આ બ્રાઉઝરનું <b>{size}</b> સ્ટોરેજ વાપરે છે.' },
    deleteAll: 'બધા ફોટા ડિલીટ કરો',
    confirmDeleteAll: { one: '# પ્રોગ્રેસ ફોટો ડિલીટ કરવો છે? આ પાછું નહીં લાવી શકાય.', other: 'બધા # પ્રોગ્રેસ ફોટા ડિલીટ કરવા છે? આ પાછું નહીં લાવી શકાય.' },
    persisted: 'ડિવાઇસમાં જગ્યા ઓછી થાય ત્યારે Fit નો ડેટા ક્લિયર ન કરવા આ બ્રાઉઝર સંમત થયું છે. તો પણ આ ડિવાઇસની બહાર એકમાત્ર કૉપી વધુ માંનો બેકઅપ જ છે.',
    persistAbout:
      'ફોનમાં જગ્યા ઓછી થાય ત્યારે બ્રાઉઝર કોઈ સાઇટનો ડેટા, ફોટા સહિત, ડિલીટ કરી શકે છે. તમે તેને Fit નો ડેટા રાખવા કહી શકો છો. Chrome જાતે નક્કી કરે છે અને તમે વારંવાર વાપરો કે હોમ સ્ક્રીન પર ઉમેરો તેવી સાઇટ માટે સામાન્ય રીતે સંમત થાય છે; Firefox તમને પૂછે છે.',
    refused: 'આ વખતે બ્રાઉઝર સંમત ન થયું. Fit ને હોમ સ્ક્રીન પર ઉમેરવાથી સામાન્ય રીતે મદદ મળે છે; ગમે તે હોય, બેકઅપ રાખો.',
    persist: 'Fit નો ડેટા રાખો',
  },

  compare: {
    title: 'ફોટા સરખાવો',
    before: 'પહેલાં',
    after: 'પછી',
    beforeAlt: 'પહેલાં, {date}',
    afterAlt: 'પછી, {date}',
    needTwo: 'સરખાવવા માટે બે તારીખે {pose} ફોટો ઉમેરો.',
    sideBySide: 'બાજુ-બાજુમાં',
    slider: 'સ્લાઇડર',
    sliderLabel: 'પહેલાં કે પછી',
    sliderNote: 'ડાબે: {before}. જમણે: {after}.',
  },

  import: {
    title: 'હેલ્થ એપમાંથી ઇમ્પોર્ટ કરો',
    about: 'વજન, પગલાં, ઊંઘ, બોડી ફેટ અને આરામ વખતનો હાર્ટ રેટ લાવો. ફાઇલો અહીં બ્રાઉઝરમાં જ વંચાય છે અને ક્યારેય અપલોડ થતી નથી.',
    howTo: 'તમારો ડેટા કેવી રીતે એક્સપોર્ટ કરવો',
    apple: '<b>iPhone (Apple Health)</b>: Health ખોલો, તમારા ફોટા પર ટૅપ કરો, પછી Export All Health Data. export.zip ને Files માં સેવ કરો અને અહીં પસંદ કરો.',
    samsung:
      '<b>Samsung Health</b>: Samsung Health માં Settings ખોલો, પછી Download personal data. તે Download/Samsung Health માં જે ફોલ્ડર સેવ કરે તેમાંથી બધી CSV ફાઇલો પસંદ કરો, અથવા તે ફોલ્ડરની zip.',
    googleFit: '<b>Google Fit</b>: takeout.google.com પર ફક્ત Fit પસંદ કરો, અને તે જે zip આપે તે પસંદ કરો.',
    healthConnect: '<b>Health Connect</b>: તેનું પોતાનું એક્સપોર્ટ એક ડેટાબેઝ છે જે આ પેજ હજી વાંચી શકતું નથી, તેથી તેમાં ડેટા લખતી એપ, જેમ કે Samsung Health કે Google Fit, માંથી એક્સપોર્ટ કરો.',
    reading: 'એક્સપોર્ટ વાંચી રહ્યા છીએ',
    preview: 'ઇમ્પોર્ટનું પ્રીવ્યૂ',
    from: '{sources} માંથી:',
    and: '{a} અને {b}',
    kinds: { weight: 'વજન', bodyFat: 'બોડી ફેટ', steps: 'પગલાં', sleep: 'ઊંઘ', restingHr: 'આરામ વખતનો હાર્ટ રેટ' },
    days: { one: '# દિવસ', other: '# દિવસ' },
    oneDay: '<b>{kind}</b>: {days}, <d>{from}</d>',
    range: '<b>{kind}</b>: {days}, <d>{from}</d> થી <d>{to}</d>',
    alreadyLogged: '({n} પહેલેથી લૉગ થયેલા)',
    existing: 'તમે પહેલેથી લૉગ કરેલા દિવસો',
    keepMine: 'મારું રાખો',
    useImported: 'ઇમ્પોર્ટ કરેલું વાપરો',
    import: 'ઇમ્પોર્ટ કરો',
    done: { one: '{sources} માંથી # એન્ટ્રી ઇમ્પોર્ટ થઈ.', other: '{sources} માંથી # એન્ટ્રી ઇમ્પોર્ટ થઈ.' },
    choose: 'એક્સપોર્ટ ફાઇલો પસંદ કરો',
    accepts: 'export.zip, Takeout zip કે Samsung Health ની CSV ફાઇલો',
    errors: {
      empty: 'આ ફાઇલોમાં ઇમ્પોર્ટ કરવા માટે વજન, પગલાં, ઊંઘ, બોડી ફેટ કે આરામ વખતનો હાર્ટ રેટ નથી.',
      unreadable: 'આ બ્રાઉઝર ફાઇલો વાંચી શક્યું નહીં.',
      noData: 'કોઈ હેલ્થ ડેટા મળ્યો નહીં. Apple Health નું export.zip, Samsung Health ની CSV ફાઇલો કે Google Fit નું Takeout પસંદ કરો.',
      notZip: 'આ zip ફાઇલ નથી.',
      damaged: 'આ zip ફાઇલ ખરાબ થઈ ગઈ છે.',
      password: 'આ zip ફાઇલ પાસવર્ડથી સુરક્ષિત છે.',
      method: '{file} એવી રીતે કમ્પ્રેસ થયેલી છે જે આ બ્રાઉઝર વાંચી શકતું નથી.',
    },
  },
};

export default progress;
