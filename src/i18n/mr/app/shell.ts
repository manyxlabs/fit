import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'आज', food: 'जेवण', train: 'ट्रेनिंग', progress: 'प्रगती', more: 'अधिक' },
  nav: 'ॲप',
  today: 'आज',
  previousDay: 'मागचा दिवस',
  nextDay: 'पुढचा दिवस',
};

export default shell;
