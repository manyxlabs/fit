import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'ಇಂದು', food: 'ಆಹಾರ', train: 'ಟ್ರೈನ್', progress: 'ಪ್ರಗತಿ', more: 'ಇನ್ನಷ್ಟು' },
  nav: 'ಆ್ಯಪ್',
  today: 'ಇಂದು',
  previousDay: 'ಹಿಂದಿನ ದಿನ',
  nextDay: 'ಮುಂದಿನ ದಿನ',
};

export default shell;
