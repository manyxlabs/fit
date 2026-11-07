import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'আজ', food: 'খাবার', train: 'ট্রেনিং', progress: 'প্রোগ্রেস', more: 'আরও' },
  nav: 'অ্যাপ',
  today: 'আজ',
  previousDay: 'আগের দিন',
  nextDay: 'পরের দিন',
};

export default shell;
