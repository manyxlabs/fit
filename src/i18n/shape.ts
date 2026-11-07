// The types make every language have every key; this makes each string keep English's {placeholders}
// and <tags>, and each list English's length, so a slip in a translation fails the build, not a page.
// A tag may appear twice where a language needs words on both sides of a field ('from X until Y').
const marks = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}|<(\w+)>/g)].map((m) => m[0]))].sort().join();

export function sameShape(en: unknown, other: unknown, at: string) {
  if (typeof en === 'string') {
    if (typeof other !== 'string') throw new Error(`${at} is not text`);
    if (marks(en) !== marks(other)) throw new Error(`${at} has ${marks(other) || 'no marks'} where English has ${marks(en) || 'none'}`);
    // A plural form stands for its number with #, which every form must keep.
    if (en.includes('#') !== other.includes('#')) throw new Error(`${at} must keep # for the number`);
  } else if (Array.isArray(en)) {
    if (!Array.isArray(other) || en.length !== other.length) throw new Error(`${at} has ${Array.isArray(other) ? other.length : 'no'} items where English has ${en.length}`);
    en.forEach((x, i) => sameShape(x, other[i], `${at}[${i}]`));
  } else if (en && typeof en === 'object') {
    if (!other || typeof other !== 'object') throw new Error(`${at} is missing`);
    for (const [k, v] of Object.entries(en)) sameShape(v, (other as Record<string, unknown>)[k], `${at}.${k}`);
  }
}

/** A catalogue's type with every string widened, so a translation is held to its keys, not to its English words. */
export type Widen<T> = T extends string ? string : T extends readonly [unknown, ...unknown[]] ? { [K in keyof T]: Widen<T[K]> } : T extends readonly (infer U)[] ? Widen<U>[] : T extends object ? { -readonly [K in keyof T]: Widen<T[K]> } : T;
