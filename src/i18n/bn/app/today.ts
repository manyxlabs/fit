import type en from '../../en/app/today';
import type { Widen } from '../../shape';

const today: Widen<typeof en> = {
  calories: {
    title: 'ক্যালোরি',
    logFood: 'খাবার লগ করুন',
    left: '{n} <s>kcal বাকি</s>',
    over: '{n} <s>kcal বেশি</s>',
    eaten: 'খাওয়া হয়েছে',
  },
  checkIn: {
    title: 'আজ কেমন আছেন?',
    sleep: 'কাল রাতের ঘুম (ঘণ্টা)',
    energy: 'এনার্জি',
    energyLevels: ['1 একদম ক্লান্ত', '2 কম', '3 চলনসই', '4 ভালো', '5 দারুণ'],
    soreness: 'পেশিতে ব্যথা',
    sorenessLevels: ['1 নেই', '2 হালকা', '3 কিছুটা', '4 বেশি', '5 খুব বেশি'],
    unwell: 'শরীর খারাপ লাগছে?',
    sick: { none: 'না', aboveNeck: 'শুধু গলার ওপরে: সর্দি, গলায় হালকা ব্যথা', belowNeck: 'জ্বর, গা-হাত-পা ব্যথা, বুকে বা পেটে সমস্যা' },
  },
  training: {
    title: 'ট্রেনিং',
    view: 'দেখুন',
    start: 'শুরু করুন',
    next: 'এরপর: <b>{name}</b>',
  },
  water: {
    title: 'জল',
    amount: '{n} <s>/ {target} লিটার</s>',
  },
  body: {
    title: 'শরীর',
    weight: 'ওজন (kg)',
    steps: 'স্টেপ',
  },
  supplements: {
    title: 'সাপ্লিমেন্ট',
    guide: 'গাইড',
  },
  fasting: {
    title: 'উপবাস',
    ramadan: 'রমজান',
    navratri: 'নবরাত্রি',
    state: {
      ifEating: '<b>খাওয়ার সময় চলছে</b>, শেষ হবে {time}-এ',
      ifFasting: '<b>উপবাস চলছে</b>, খাওয়ার সময় শুরু {time}-এ',
      ramadanEating: '<b>খাওয়ার সময় চলছে</b>, সেহরি শেষ {time}-এ',
      ramadanFasting: '<b>রোজা চলছে</b>, ইফতার {time}-এ',
    },
    times: 'সেহরি শেষ <b>{fajr}</b> · ইফতার <b>{maghrib}</b>',
    timesTomorrow: 'কাল: সেহরি শেষ <b>{fajr}</b> · ইফতার <b>{maghrib}</b>',
    cityHint: 'সূর্যের অবস্থান থেকে {city}-এর জন্য হিসাব করা (ফজর 18 ডিগ্রিতে); আপনার মসজিদের সময়সূচির সঙ্গে কয়েক মিনিট তফাত হতে পারে।',
    vrat: 'আজ ব্রত (একাদশী বা অন্য কোনো ব্রতের দিন)',
    navratriHint: 'পুরো নবরাত্রি জুড়ে চালু। আরও-তে গিয়ে বদলান।',
    vratHint: 'খাবার সার্চ আর মিল প্ল্যানে শুধু ব্রতের খাবার দেখায়। <a>দিনের প্ল্যান করুন</a>',
  },
};

export default today;
