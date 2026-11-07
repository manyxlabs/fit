import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'இன்று', food: 'உணவு', train: 'பயிற்சி', progress: 'முன்னேற்றம்', more: 'மேலும்' },
  nav: 'ஆப்',
  today: 'இன்று',
  previousDay: 'முந்தைய நாள்',
  nextDay: 'அடுத்த நாள்',
};

export default shell;
