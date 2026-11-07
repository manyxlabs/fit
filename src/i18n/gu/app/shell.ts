import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'આજે', food: 'ખોરાક', train: 'ટ્રેનિંગ', progress: 'પ્રોગ્રેસ', more: 'વધુ' },
  nav: 'એપ',
  today: 'આજે',
  previousDay: 'આગલો દિવસ',
  nextDay: 'પછીનો દિવસ',
};

export default shell;
