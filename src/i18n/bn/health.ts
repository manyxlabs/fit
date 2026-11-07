import type { Health } from '../en/health';
import calc from './health/calc';
import today from './health/today';
import food from './health/food';
import train from './health/train';
import progress from './health/progress';
import more from './health/more';

const health: Health = { calc, today, food, train, progress, more };

export default health;
