import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'ഇന്ന്', food: 'ഭക്ഷണം', train: 'ട്രെയിൻ', progress: 'പുരോഗതി', more: 'കൂടുതൽ' },
  nav: 'ആപ്പ്',
  today: 'ഇന്ന്',
  previousDay: 'മുമ്പത്തെ ദിവസം',
  nextDay: 'അടുത്ത ദിവസം',
};

export default shell;
