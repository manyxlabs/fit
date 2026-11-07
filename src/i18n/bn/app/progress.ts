import type en from '../../en/app/progress';
import type { Widen } from '../../shape';

const progress: Widen<typeof en> = {
  title: 'প্রোগ্রেস',
  save: 'সেভ করুন',
  cancel: 'বাতিল',

  weight: {
    title: 'ওজন',
    empty: 'প্রতিদিন সকালে আজ ট্যাবে ওজন লগ করুন। দুবার ওজন লগ করার পর চার্ট আর ট্রেন্ড দেখা যাবে।',
    trend: 'এই সপ্তাহের ট্রেন্ড: <b>{change}</b><m> (লক্ষ্য {goal})</m>',
    steady: 'স্থির',
    chart: '{from} থেকে {to} kg পর্যন্ত ওজন',
    chartNote: 'বিন্দুগুলো ওজন মাপা, রেখাটি ট্রেন্ড। ওপরে {top} kg, নিচে {bottom} kg।',
  },

  maintenance: {
    title: 'মেইনটেন্যান্স ক্যালোরি',
    formula: 'ফর্মুলা থেকে: <b>{kcal} kcal</b>',
    measured: 'আপনার লগ থেকে মাপা: <b>{kcal} kcal</b>। আপনার টার্গেট এটাই ব্যবহার করে।',
    unmeasured: '2-4 সপ্তাহ খাবার আর ওজন লগ করুন, তাহলে অ্যাপ আপনার আসল মেইনটেন্যান্স মাপবে, যা বেশিরভাগ মানুষের ক্ষেত্রে ফর্মুলা 5-10% ভুল করে।',
  },

  week: {
    title: 'এই সপ্তাহ',
    kcal: 'গড় ক্যালোরি',
    protein: 'গড় প্রোটিন',
    workouts: 'ওয়ার্কআউট',
    sleep: 'গড় ঘুম',
    steps: 'গড় স্টেপ',
  },

  body: {
    title: 'বডি কম্পোজিশন',
    bmi: 'BMI',
    bmiValue: '{bmi}, {band}',
    healthyWeight: 'আপনার উচ্চতায় স্বাস্থ্যকর ওজন',
    waistToHeight: 'কোমর ও উচ্চতার অনুপাত (0.5-এর নিচে রাখুন)',
    tapeFat: 'বডি ফ্যাট (ফিতে দিয়ে আন্দাজ)',
    scaleFat: 'বডি ফ্যাট (স্কেল, {date})',
    ffmi: 'ফ্যাট-ফ্রি মাস ইনডেক্স',
    bmiNote: 'BMI পেশি আর ফ্যাটের তফাত বোঝে না; কম ফ্যাটের পেশিবহুল একজন লিফটারকেও বেশি ওজনের দেখাতে পারে। কোমর আর বডি ফ্যাট বেশি কিছু বলে।',
  },

  measurements: {
    add: 'মাপ যোগ করুন',
    waistMale: 'নাভির কাছে কোমর (cm)',
    waistFemale: 'কোমরের সবচেয়ে সরু জায়গা (cm)',
    neck: 'গলা, কণ্ঠমণির নিচে (cm)',
    hip: 'হিপের সবচেয়ে চওড়া জায়গা (cm)',
    chest: 'বুক (cm)',
    arm: 'ওপরের হাত, পেশি ফুলিয়ে (cm)',
    thigh: 'উরু (cm)',
    how: 'সকালে, রিল্যাক্স অবস্থায় মাপুন, ফিতে গায়ে লেগে থাকবে কিন্তু চাপ দেবে না। প্রতি 2-4 সপ্তাহে একবারই যথেষ্ট।',
  },

  strength: {
    title: 'শক্তি',
    lift: '{last} kg <m>(সেরা {best}, শুরু {first})</m>',
    note: 'আপনার সেট থেকে আনুমানিক ওয়ান-রেপ ম্যাক্স, হাতে রাখা রেপ ধরে।',
    empty: 'ওজন নিয়ে লিফট সহ একটি ওয়ার্কআউট শেষ করুন, তাহলে এখানে আপনার আনুমানিক ওয়ান-রেপ ম্যাক্স দেখাবে।',
  },

  photos: {
    title: 'প্রোগ্রেস ফটো',
    about: 'প্রতি 2-4 সপ্তাহে সামনে, পাশ আর পেছন থেকে, একই জায়গায়, একই আলো আর একই পোশাকে। ছবিগুলো এই ডিভাইসেই থাকে: কোথাও আপলোড হয় না।',
    date: 'তারিখ',
    poses: { front: 'সামনে', side: 'পাশ', back: 'পেছন' },
    posesInline: { front: 'সামনের', side: 'পাশের', back: 'পেছনের' },
    take: '{pose} ছবি তুলুন',
    choose: '{pose} ছবি বাছুন',
    delete: '{pose} ছবি মুছুন',
    alt: '{date}-এর {pose} ছবি',
    confirmDelete: '{date}-এর {pose} ছবিটি মুছবেন?',
    unreadable: 'ছবিটি পড়া গেল না। JPEG বা PNG চেষ্টা করুন।',
    dates: 'যে তারিখে ছবি আছে',
    deleteDate: 'এই তারিখ মুছুন',
    confirmDeleteDate: { one: '{date}-এর #টি ছবি মুছবেন?', other: '{date}-এর সব #টি ছবি মুছবেন?' },
  },

  storage: {
    title: 'ছবির স্টোরেজ',
    used: { one: '#টি ছবি এই ব্রাউজারের স্টোরেজের <b>{size}</b> নিচ্ছে।', other: '#টি ছবি এই ব্রাউজারের স্টোরেজের <b>{size}</b> নিচ্ছে।' },
    deleteAll: 'সব ছবি মুছুন',
    confirmDeleteAll: { one: '#টি প্রোগ্রেস ফটো মুছবেন? এটা আর ফেরানো যাবে না।', other: 'সব #টি প্রোগ্রেস ফটো মুছবেন? এটা আর ফেরানো যাবে না।' },
    persisted: 'ডিভাইসে জায়গা কমে গেলেও এই ব্রাউজার Fit-এর ডেটা না মোছার কথা দিয়েছে। তবু আরও-তে নেওয়া ব্যাকআপই এই ডিভাইসের বাইরে একমাত্র কপি।',
    persistAbout:
      'ফোনে জায়গা কমে গেলে ব্রাউজার কোনো সাইটের ডেটা, ছবি সহ, মুছে দিতে পারে। আপনি Fit-এর ডেটা রেখে দিতে বলতে পারেন। Chrome নিজেই ঠিক করে, আর যে সাইট আপনি প্রায়ই ব্যবহার করেন বা হোম স্ক্রিনে যোগ করেছেন তার জন্য সাধারণত রাজি হয়; Firefox আপনাকে জিজ্ঞেস করে।',
    refused: 'এবার ব্রাউজার রাজি হয়নি। Fit হোম স্ক্রিনে যোগ করলে সাধারণত কাজ হয়; যাই হোক, একটা ব্যাকআপ রাখুন।',
    persist: 'Fit-এর ডেটা রেখে দিন',
  },

  compare: {
    title: 'ছবি মিলিয়ে দেখুন',
    before: 'আগে',
    after: 'পরে',
    beforeAlt: 'আগে, {date}',
    afterAlt: 'পরে, {date}',
    needTwo: 'মিলিয়ে দেখতে দুটি তারিখে {pose} ছবি যোগ করুন।',
    sideBySide: 'পাশাপাশি',
    slider: 'স্লাইডার',
    sliderLabel: 'আগে না পরে',
    sliderNote: 'বাঁ দিকে: {before}। ডান দিকে: {after}।',
  },

  import: {
    title: 'হেলথ অ্যাপ থেকে ইমপোর্ট',
    about: 'ওজন, স্টেপ, ঘুম, বডি ফ্যাট আর রেস্টিং হার্ট রেট নিয়ে আসুন। ফাইলগুলো এখানে ব্রাউজারেই পড়া হয়, কখনো আপলোড হয় না।',
    howTo: 'কীভাবে আপনার ডেটা এক্সপোর্ট করবেন',
    apple: '<b>iPhone (Apple Health)</b>: Health খুলুন, আপনার ছবিতে ট্যাপ করুন, তারপর Export All Health Data। export.zip ফাইলটি Files-এ সেভ করে এখানে বাছুন।',
    samsung:
      '<b>Samsung Health</b>: Samsung Health-এর Settings খুলুন, তারপর Download personal data। Download/Samsung Health-এ যে ফোল্ডারে সেভ হয় সেখান থেকে সব CSV ফাইল বাছুন, বা সেই ফোল্ডারের একটি zip।',
    googleFit: '<b>Google Fit</b>: takeout.google.com-এ শুধু Fit সিলেক্ট করুন, আর যে zip পাবেন সেটি বাছুন।',
    healthConnect: '<b>Health Connect</b>: এর নিজের এক্সপোর্ট একটি ডেটাবেস, যা এই পেজ এখনো পড়তে পারে না, তাই যে অ্যাপ এতে ডেটা লেখে সেখান থেকে এক্সপোর্ট করুন, যেমন Samsung Health বা Google Fit।',
    reading: 'এক্সপোর্ট পড়া হচ্ছে',
    preview: 'ইমপোর্টের প্রিভিউ',
    from: '{sources} থেকে:',
    and: '{a} ও {b}',
    kinds: { weight: 'ওজন', bodyFat: 'বডি ফ্যাট', steps: 'স্টেপ', sleep: 'ঘুম', restingHr: 'রেস্টিং হার্ট রেট' },
    days: { one: '# দিন', other: '# দিন' },
    oneDay: '<b>{kind}</b>: {days}, <d>{from}</d>',
    range: '<b>{kind}</b>: {days}, <d>{from}</d> থেকে <d>{to}</d>',
    alreadyLogged: '({n}টি আগেই লগ করা)',
    existing: 'যে দিনগুলো আপনি আগেই লগ করেছেন',
    keepMine: 'আমারটা রাখুন',
    useImported: 'ইমপোর্ট করাটা নিন',
    import: 'ইমপোর্ট করুন',
    done: { one: '{sources} থেকে #টি এন্ট্রি ইমপোর্ট হয়েছে।', other: '{sources} থেকে #টি এন্ট্রি ইমপোর্ট হয়েছে।' },
    choose: 'এক্সপোর্ট ফাইল বাছুন',
    accepts: 'export.zip, Takeout zip বা Samsung Health-এর CSV',
    errors: {
      empty: 'এই ফাইলগুলোতে ইমপোর্ট করার মতো ওজন, স্টেপ, ঘুম, বডি ফ্যাট বা রেস্টিং হার্ট রেট নেই।',
      unreadable: 'এই ব্রাউজার ফাইলগুলো পড়তে পারেনি।',
      noData: 'কোনো হেলথ ডেটা পাওয়া যায়নি। Apple Health-এর export.zip, Samsung Health-এর CSV ফাইল বা Google Fit-এর Takeout বাছুন।',
      notZip: 'এটি zip ফাইল নয়।',
      damaged: 'এই zip ফাইলটি নষ্ট।',
      password: 'এই zip ফাইলটি পাসওয়ার্ড দিয়ে সুরক্ষিত।',
      method: '{file} এমনভাবে কম্প্রেস করা যা এই ব্রাউজার পড়তে পারে না।',
    },
  },
};

export default progress;
