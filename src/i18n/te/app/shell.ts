import type en from '../../en/app/shell';
import type { Widen } from '../../shape';

const shell: Widen<typeof en> = {
  tabs: { today: 'ఈరోజు', food: 'ఆహారం', train: 'ట్రైనింగ్', progress: 'ప్రోగ్రెస్', more: 'మరిన్ని' },
  nav: 'యాప్',
  today: 'ఈరోజు',
  previousDay: 'ముందు రోజు',
  nextDay: 'తర్వాతి రోజు',
};

export default shell;
