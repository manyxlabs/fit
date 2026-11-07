// The app's copy, and the shape every other language's app.ts must match key for key. Each area of
// the app keeps its part in app/<area>.ts; health advice is in health.ts, which waits for review.
// {name} is filled in by fill(); plurals are { one, other } with # for the number (see ../intl.ts);
// <tag>...</tag> marks words drawn as an element (see ../rich.tsx).
import shell from './app/shell';
import today from './app/today';
import food from './app/food';
import train from './app/train';
import progress from './app/progress';
import more from './app/more';
import sync from './app/sync';
import reminders from './app/reminders';
import type { Widen } from '../shape';

const app = { shell, today, food, train, progress, more: { ...more, sync, reminders } };

export default app;
export type App = Widen<typeof app>;
