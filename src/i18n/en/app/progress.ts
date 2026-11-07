// The progress area's copy; see ../app.ts. Progress.tsx, Photos.tsx, and HealthImport.tsx (shown in More).
export default {
  title: 'Progress',
  save: 'Save',
  cancel: 'Cancel',

  weight: {
    title: 'Weight',
    empty: 'Log your weight on the Today tab each morning. The chart and the trend appear after two weigh-ins.',
    /** {change} and {goal} are signed amounts like "+0.25 kg"; {goal} can also be `steady`. */
    trend: 'Trend this week: <b>{change}</b><m> (goal {goal})</m>',
    /** The goal when a person wants to keep their weight where it is. */
    steady: 'steady',
    chart: 'Weight from {from} to {to} kg',
    chartNote: 'Dots are weigh-ins, the line is the trend. {top} kg top, {bottom} kg bottom.',
  },

  maintenance: {
    title: 'Maintenance calories',
    formula: 'From the formula: <b>{kcal} kcal</b>',
    measured: 'Measured from your logs: <b>{kcal} kcal</b>. Your targets use this one.',
    unmeasured: 'Log food and weight for 2-4 weeks and the app measures your real maintenance, which formulas miss by 5-10% for most people.',
  },

  week: {
    title: 'This week',
    kcal: 'Average calories',
    protein: 'Average protein',
    workouts: 'Workouts',
    sleep: 'Average sleep',
    steps: 'Average steps',
  },

  body: {
    title: 'Body composition',
    bmi: 'BMI',
    /** {band} is Healthy, Overweight and so on. */
    bmiValue: '{bmi}, {band}',
    healthyWeight: 'Healthy weight for your height',
    waistToHeight: 'Waist to height (aim under 0.5)',
    tapeFat: 'Body fat (tape estimate)',
    /** {date} is the day the smart scale measured it, like "5 Oct". */
    scaleFat: 'Body fat (scale, {date})',
    ffmi: 'Fat-free mass index',
    bmiNote: 'BMI cannot tell muscle from fat; a lean lifter can read as overweight. Waist and body fat say more.',
  },

  measurements: {
    add: 'Add measurements',
    waistMale: 'Waist at the navel (cm)',
    waistFemale: 'Waist at the narrowest (cm)',
    neck: 'Neck, below the Adam’s apple (cm)',
    hip: 'Hips at the widest (cm)',
    chest: 'Chest (cm)',
    arm: 'Upper arm, flexed (cm)',
    thigh: 'Thigh (cm)',
    how: 'Measure in the morning, relaxed, with the tape snug but not pressing. Every 2-4 weeks is enough.',
  },

  strength: {
    title: 'Strength',
    /** Estimated one-rep maxes in kg: the latest, the best and the first. */
    lift: '{last} kg <m>(best {best}, from {first})</m>',
    note: 'Estimated one-rep max from your sets, counting reps in reserve.',
    empty: 'Finish a workout with loaded lifts to see your estimated one-rep maxes here.',
  },

  photos: {
    title: 'Progress photos',
    about: 'Front, side and back every 2-4 weeks, in the same spot, light and clothes. They stay on this device: they are not uploaded anywhere.',
    date: 'Date',
    /** A pose as a label on its own. */
    poses: { front: 'Front', side: 'Side', back: 'Back' },
    /** The same poses as {pose} inside the sentences below. */
    posesInline: { front: 'front', side: 'side', back: 'back' },
    take: 'Take {pose} photo',
    choose: 'Choose {pose} photo',
    delete: 'Delete {pose} photo',
    /** Alt text of a photo: the pose and the date it was taken. */
    alt: '{pose} on {date}',
    confirmDelete: 'Delete the {pose} photo from {date}?',
    unreadable: 'That image could not be read. Try a JPEG or PNG.',
    dates: 'Dates with photos',
    deleteDate: 'Delete this date',
    confirmDeleteDate: { one: 'Delete the # photo from {date}?', other: 'Delete all # photos from {date}?' },
  },

  storage: {
    title: 'Photo storage',
    /** {size} is like "4.2 MB". */
    used: { one: '# photo uses <b>{size}</b> of this browser’s storage.', other: '# photos use <b>{size}</b> of this browser’s storage.' },
    deleteAll: 'Delete all photos',
    confirmDeleteAll: { one: 'Delete the # progress photo? This cannot be undone.', other: 'Delete all # progress photos? This cannot be undone.' },
    persisted: 'This browser has agreed not to clear Fit’s data when the device runs low on space. A backup in More is still the only copy off this device.',
    persistAbout:
      'When a phone runs low on space, the browser may delete a site’s data, photos included. You can ask it to keep Fit’s data. Chrome decides by itself and usually agrees for sites you use often or add to the home screen; Firefox asks you.',
    refused: 'The browser did not agree this time. Adding Fit to the home screen usually helps; either way, keep a backup.',
    persist: 'Keep Fit’s data',
  },

  compare: {
    title: 'Compare photos',
    before: 'Before',
    after: 'After',
    /** Alt text of a photo being compared, like "Before, 5 Oct 2026". */
    beforeAlt: 'Before, {date}',
    afterAlt: 'After, {date}',
    needTwo: 'Add a {pose} photo on two dates to compare them.',
    sideBySide: 'Side by side',
    /** One photo laid over the other, with a slider that moves the line between them. */
    slider: 'Slider',
    sliderLabel: 'Before or after',
    sliderNote: 'Left: {before}. Right: {after}.',
  },

  import: {
    title: 'Import from a health app',
    about: 'Bring in weight, steps, sleep, body fat and resting heart rate. The files are read here in the browser and never uploaded.',
    howTo: 'How to export your data',
    apple: '<b>iPhone (Apple Health)</b>: open Health, tap your picture, then Export All Health Data. Save export.zip to Files and choose it here.',
    samsung:
      '<b>Samsung Health</b>: open Settings in Samsung Health, then Download personal data. Choose all the CSV files from the folder it saves in Download/Samsung Health, or a zip of that folder.',
    googleFit: '<b>Google Fit</b>: at takeout.google.com, select only Fit, and choose the zip it gives you.',
    healthConnect: '<b>Health Connect</b>: its own export is a database this page cannot read yet, so export from the app that writes to it, such as Samsung Health or Google Fit.',
    reading: 'Reading the export',
    preview: 'Import preview',
    /** {sources} is one or more app names, like "Apple Health" or "Samsung Health and Google Fit". */
    from: 'From {sources}:',
    /** Joins two app names in {sources}. */
    and: '{a} and {b}',
    kinds: { weight: 'Weight', bodyFat: 'Body fat', steps: 'Steps', sleep: 'Sleep', restingHr: 'Resting heart rate' },
    days: { one: '# day', other: '# days' },
    /** What an export holds of one kind: {days} is like "3 days", <d> marks a date. */
    oneDay: '<b>{kind}</b>: {days}, <d>{from}</d>',
    range: '<b>{kind}</b>: {days}, <d>{from}</d> to <d>{to}</d>',
    alreadyLogged: '({n} already logged)',
    existing: 'Days you already logged',
    keepMine: 'Keep mine',
    useImported: 'Use imported',
    import: 'Import',
    done: { one: 'Imported # entry from {sources}.', other: 'Imported # entries from {sources}.' },
    choose: 'Choose export files',
    accepts: 'export.zip, Takeout zip or Samsung Health CSVs',
    errors: {
      empty: 'These files have no weight, steps, sleep, body fat or resting heart rate to import.',
      unreadable: 'This browser could not read the files.',
      noData: 'No health data found. Choose Apple Health’s export.zip, Samsung Health’s CSV files or Google Fit’s Takeout.',
      notZip: 'This is not a zip file.',
      damaged: 'This zip file is damaged.',
      password: 'This zip file is password-protected.',
      /** {file} is the name of a file inside the zip. */
      method: '{file} is compressed in a way this browser cannot read.',
    },
  },
};
