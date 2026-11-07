import shell from './app/shell';
import today from './app/today';
import food from './app/food';
import train from './app/train';
import progress from './app/progress';
import more from './app/more';
import sync from './app/sync';
import reminders from './app/reminders';
import type { App } from '../en/app';

const app: App = { shell, today, food, train, progress, more: { ...more, sync, reminders } };

export default app;
