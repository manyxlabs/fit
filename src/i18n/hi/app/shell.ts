import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'आज', food: 'खाना', train: 'ट्रेनिंग', progress: 'प्रोग्रेस', more: 'और' },
  nav: 'ऐप',
  today: 'आज',
  previousDay: 'पिछला दिन',
  nextDay: 'अगला दिन',
};

export default shell;
