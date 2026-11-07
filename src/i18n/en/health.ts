// Health advice: shown in a language only once a native speaker has checked it (see ../review.ts).
// Each area keeps its part in health/<area>.ts.
import calc from './health/calc';
import today from './health/today';
import food from './health/food';
import train from './health/train';
import progress from './health/progress';
import more from './health/more';
import type { Widen } from '../shape';

const health = { calc, today, food, train, progress, more };

export default health;
export type Health = Widen<typeof health>;
