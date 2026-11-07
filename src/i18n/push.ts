import type { Locale } from './locales';
import en from './en/push';
import hi from './hi/push';
import bn from './bn/push';
import mr from './mr/push';
import te from './te/push';
import ta from './ta/push';
import gu from './gu/push';
import kn from './kn/push';
import ml from './ml/push';

// Every language's reminder texts, imported statically: the Worker sends in each person's language,
// and has no bundler glob to load them with.
export type Push = typeof en;
export const PUSH: Record<Locale, Push> = { en, hi, bn, mr, te, ta, gu, kn, ml };
