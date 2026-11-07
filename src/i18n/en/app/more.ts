// The more area's copy (src/app/More.tsx, ProfileForm.tsx, Onboarding.tsx); see ../app.ts.
export default {
  title: 'More',
  /** Label of the menu that switches the app's language. */
  language: 'Language',
  supplements: {
    title: 'Supplements for you',
    others: 'Others, and when they help',
    waste: 'Usually a waste of money',
  },
  details: {
    title: 'Your details',
    save: 'Save changes',
    /** The save button for two seconds after saving. */
    saved: 'Saved',
  },
  data: {
    title: 'Your data',
    local: 'Everything lives only in this browser. Download a backup now and then, and restore it on a new phone or after clearing the browser.',
    synced: 'Everything lives in this browser and your synced devices. Download a backup now and then, to keep a copy of your own.',
    /** {size} is a file size such as "12.5 MB". */
    withPhotos: 'Include progress photos (about {size}, as base64)',
    download: 'Download backup',
    restore: 'Restore a backup',
    restoreConfirm: 'Replace everything here with this backup?',
    restoreConfirmSynced: 'Replace everything here and on your synced devices with this backup?',
    notBackup: 'That file is not a backup.',
    badBackup: { notFit: 'This is not a Fit backup.', photo: 'This backup has a damaged photo.' },
    deleteAll: 'Delete everything',
    deleteConfirm: 'Delete all your data from this browser? This cannot be undone.',
    deleteConfirmSynced: 'Delete all your data from this browser and your synced devices? This cannot be undone.',
  },
  learn: {
    title: 'Learn',
    guides: 'Guides: training, nutrition, supplements, sleep, special cases',
    calculators: 'Calculators: BMI, TDEE, macros, body fat, one-rep max, heart-rate zones',
  },
  onboarding: {
    title: 'Set up your plan',
    private: 'Everything stays in this browser. Nothing is sent anywhere, and there is no account.',
    submit: 'Build my plan',
  },
  profile: {
    sex: 'Sex',
    birthYear: 'Birth year',
    height: 'Height (cm)',
    weight: 'Weight (kg)',
    activity: 'Activity, counting your whole day',
    /** An activity level and what it means, e.g. "Moderate: on your feet a lot". */
    activityOption: '{label}: {detail}',
    goal: 'Goal',
    pace: 'Pace',
    /** How fast to lose or gain weight; {percent} is a number such as 0.5. */
    paceOption: '{percent}% of body weight a week',
    /** The same with the weight it comes to, {kg} such as 0.35. */
    paceOptionKg: '{percent}% of body weight a week ({kg} kg)',
    /** {pace} is one of the two above. */
    paceRecommended: '{pace}, recommended',
    diet: 'Diet',
    setup: 'Where you train',
    days: 'Training days a week',
    bar: 'I have a pull-up bar or dip station',
    program: 'Program',
    /** The first program choice, the one picked for you; {name} is a program name. */
    recommended: 'Recommended: {name}',
    /** A program choice: {name} the program, # its days a week, {level} such as "beginner". */
    programOption: { one: '{name} (# day, {level})', other: '{name} (# days, {level})' },
    fasting: 'Fasting',
    fastingModes: { none: 'None', if: 'Intermittent fasting', ramadan: 'Ramadan', navratri: 'Navratri (vrat food only)' },
    window: 'Eating window',
    /** {name} is a fasting pattern such as "16:8", # the hours of eating. */
    windowOption: { one: '{name}: eat within # hour', other: '{name}: eat within # hours' },
    firstMeal: 'First meal at',
    prayerTimes: 'Prayer times',
    city: 'Choose your city',
    manual: 'Enter times myself',
    fajr: 'Fajr (suhoor ends)',
    maghrib: 'Maghrib (iftar)',
    asian: 'Use the Asian BMI cut-offs, which flag health risk at a lower BMI for South Asians',
  },
};
