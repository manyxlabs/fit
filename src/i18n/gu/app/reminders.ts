import type en from '../../en/app/reminders';
import type { Widen } from '../../shape';

const reminders: Widen<typeof en> = {
  title: 'રિમાઇન્ડર',
  about:
    'તમે પસંદ કરો તે સમયે નોટિફિકેશન. સર્વર ફક્ત આ બ્રાઉઝરનું પુશ એડ્રેસ, તમારો ટાઇમ ઝોન, એપની ભાષા અને આ સમય રાખે છે, તમે લૉગ કરો તેમાંનું કંઈ જ નહીં, અને રિમાઇન્ડરમાં "લંચ લૉગ કરવાનો સમય" થી વધુ કશું લખેલું હોતું નથી.',
  ios: 'iPhone અને iPad પર, રિમાઇન્ડર માટે iOS 16.4 કે પછીનું વર્ઝન અને તમારી હોમ સ્ક્રીન પર Fit જોઈએ: Share પર ટૅપ કરો, પછી Add to Home Screen, અને Fit ત્યાંથી ખોલો.',
  weighIn: 'સવારે વજન',
  weighInTime: 'વજન કરવાનો સમય',
  logMeal: { breakfast: 'બ્રેકફાસ્ટ લૉગ કરો', lunch: 'લંચ લૉગ કરો', snacks: 'સ્નૅક્સ લૉગ કરો', dinner: 'ડિનર લૉગ કરો' },
  mealTime: '{meal} નો સમય',
  water: 'પાણી',
  waterEvery: 'પાણી કેટલી વારે',
  everyHours: 'દર {hours} કલાકે',
  waterHours: '<from></from> <to>થી</to> <until></until>',
  waterFrom: 'પાણી ક્યારથી',
  waterUntil: 'પાણી ક્યાં સુધી',
  waterOrder: 'પાણીના રિમાઇન્ડર પૂરા થાય તે પહેલાં શરૂ થવા જોઈએ.',
  workoutDays: 'વર્કઆઉટના દિવસો',
  workoutTime: 'વર્કઆઉટનો સમય',
  bedtime: 'સૂવાનો સમય',
  bedtimeTime: 'સૂવાનો સમય',
  turnOn: 'રિમાઇન્ડર ચાલુ કરો',
  save: 'રિમાઇન્ડર સેવ કરો',
  turnOff: 'રિમાઇન્ડર બંધ કરો',
  on: 'રિમાઇન્ડર ચાલુ છે.',
  off: 'રિમાઇન્ડર બંધ છે.',
  unsupported: 'આ બ્રાઉઝર રિમાઇન્ડર બતાવી શકતું નથી.',
  blocked: 'આ સાઇટ માટે નોટિફિકેશન બ્લૉક છે. તમારા બ્રાઉઝરના સાઇટ સેટિંગ્સમાં મંજૂરી આપો, પછી ફરી પ્રયાસ કરો.',
  unavailable: 'રિમાઇન્ડર અત્યારે ઉપલબ્ધ નથી. પછીથી ફરી પ્રયાસ કરો.',
  saveFailed: 'તમારા રિમાઇન્ડર સેવ થઈ શક્યા નહીં. ફરી પ્રયાસ કરો.',
  turnOffFailed: 'રિમાઇન્ડર બંધ થઈ શક્યા નહીં. ફરી પ્રયાસ કરો.',
};

export default reminders;
