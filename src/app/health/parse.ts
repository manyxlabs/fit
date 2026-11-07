// Turns health-app exports into one value per day per kind. Runs in a worker; nothing leaves the device.
//
// Times are kept as wall-clock milliseconds (local time read as if it were UTC), so a day is the
// calendar day the person lived, whatever zone the phone was in.

export const KINDS = ['weight', 'bodyFat', 'steps', 'sleep', 'restingHr'] as const;
export type Kind = (typeof KINDS)[number];
export type Result = { sources: string[]; series: Record<Kind, [date: string, value: number][]> };

const HOUR = 3_600_000;
const dateOf = (wall: number) => new Date(wall).toISOString().slice(0, 10);
/** "2026-10-05 07:10:00" and longer, as written, ignoring any zone that follows. */
const wall = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), +s.slice(11, 13), +s.slice(14, 16), +s.slice(17, 19));
/**
 * Sleep counts towards the day it ends on, so "last night" on the Today tab is the sleep woken
 * from; sleep ending after 6 pm counts towards the next day.
 */
const nightOf = (end: number) => dateOf(end + 6 * HOUR);

export class Collector {
  sources = new Set<string>();
  private first = { weight: new Map<string, [number, number]>(), bodyFat: new Map<string, [number, number]>() };
  private steps = new Map<string, number>();
  /** Steps per source per hour, for exports where several devices count the same walk. */
  private hourly = new Map<string, Map<number, number>>();
  /** Asleep intervals per source. */
  private asleep = new Map<string, [number, number][]>();
  private hr = new Map<string, number[]>();

  /** The day's first reading, since the app asks for a morning weigh-in. */
  reading(kind: 'weight' | 'bodyFat', at: number, value: number) {
    if (!(value > 0)) return;
    const d = dateOf(at);
    const x = this.first[kind].get(d);
    if (!x || at < x[0]) this.first[kind].set(d, [at, value]);
  }
  daySteps(date: string, n: number) {
    this.steps.set(date, Math.max(n, this.steps.get(date) ?? 0));
  }
  /** Spread over the hours the record spans, in proportion to time. */
  stepsBetween(source: string, start: number, end: number, n: number) {
    const hours = this.hourly.get(source) ?? this.hourly.set(source, new Map()).get(source)!;
    const span = Math.max(end - start, 1);
    for (let t = start; t < Math.max(end, start + 1); t = (Math.floor(t / HOUR) + 1) * HOUR) {
      const h = Math.floor(t / HOUR);
      hours.set(h, (hours.get(h) ?? 0) + (n * (Math.min(end, (h + 1) * HOUR) - t || span)) / span);
    }
  }
  sleep(source: string, start: number, end: number) {
    if (end > start) (this.asleep.get(source) ?? this.asleep.set(source, []).get(source)!).push([start, end]);
  }
  restingHr(at: number, bpm: number) {
    if (bpm > 0) (this.hr.get(dateOf(at)) ?? this.hr.set(dateOf(at), []).get(dateOf(at))!).push(bpm);
  }

  /**
   * Steps: each hour takes the source that counted most. When a watch and a phone both count a
   * walk, that keeps one of them, as Health's own source priority does; when the watch is off
   * charging, the phone still fills the gap, which a per-day maximum would lose.
   * Sleep: each night takes the source with the most sleep, for the same reason.
   */
  result(): Result {
    const steps = new Map(this.steps);
    const best = new Map<number, number>();
    for (const hours of this.hourly.values()) for (const [h, n] of hours) best.set(h, Math.max(n, best.get(h) ?? 0));
    const perDay = new Map<string, number>();
    for (const [h, n] of best) perDay.set(dateOf(h * HOUR), (perDay.get(dateOf(h * HOUR)) ?? 0) + n);
    for (const [d, n] of perDay) steps.set(d, Math.max(n, steps.get(d) ?? 0));

    const sleep = new Map<string, number>();
    for (const intervals of this.asleep.values()) {
      const nights = new Map<string, number>();
      let [s, e] = [0, 0];
      const close = () => e > s && nights.set(nightOf(e), (nights.get(nightOf(e)) ?? 0) + (e - s) / HOUR);
      for (const [a, b] of intervals.sort((x, y) => x[0] - y[0])) {
        if (a > e) (close(), (s = a));
        e = Math.max(e, b);
      }
      close();
      for (const [d, h] of nights) sleep.set(d, Math.max(h, sleep.get(d) ?? 0));
    }

    const list = (m: Map<string, number>, digits: number) => [...m].map(([d, v]): [string, number] => [d, +v.toFixed(digits)]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const firsts = (m: Map<string, [number, number]>) => new Map([...m].map(([d, [, v]]) => [d, v]));
    return {
      sources: [...this.sources],
      series: {
        weight: list(firsts(this.first.weight), 2),
        bodyFat: list(firsts(this.first.bodyFat), 1),
        steps: list(steps, 0),
        sleep: list(sleep, 1),
        restingHr: list(new Map([...this.hr].map(([d, xs]) => [d, xs.reduce((a, b) => a + b) / xs.length])), 0),
      },
    };
  }
}

const APPLE_ASLEEP = new Set(['Asleep', 'AsleepUnspecified', 'AsleepCore', 'AsleepDeep', 'AsleepREM'].map((v) => `HKCategoryValueSleepAnalysis${v}`));
const KG: Record<string, number> = { kg: 1, g: 0.001, lb: 0.45359237, st: 6.35029318 };

/**
 * Apple Health's export.xml, streamed: it can be gigabytes, so it is never held whole.
 * Only the self-describing <Record> tags are read. "<" cannot appear inside an attribute value,
 * so everything before the last "<" in the buffer is made of complete tags.
 */
export async function apple(text: ReadableStream<string>, c: Collector) {
  c.sources.add('Apple Health');
  const tag = /<Record\s((?:[^>"]|"[^"]*")*)>/g;
  const attr = /(\w+)="([^"]*)"/g;
  let buf = '';
  const scan = (chunk: string) => {
    for (const [, attrs] of chunk.matchAll(tag)) {
      const type = /type="HK\w+Identifier(\w+)"/.exec(attrs)?.[1];
      if (!type || !['BodyMass', 'StepCount', 'SleepAnalysis', 'RestingHeartRate', 'BodyFatPercentage'].includes(type)) continue;
      const a: Record<string, string> = {};
      for (const [, k, v] of attrs.matchAll(attr)) a[k] = v;
      const [start, end] = [wall(a.startDate), wall(a.endDate)];
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const value = Number(a.value);
      if (type === 'BodyMass' && KG[a.unit]) c.reading('weight', start, value * KG[a.unit]);
      else if (type === 'BodyFatPercentage') c.reading('bodyFat', start, value <= 1 ? value * 100 : value);
      else if (type === 'StepCount') c.stepsBetween(a.sourceName, start, end, value);
      else if (type === 'RestingHeartRate') c.restingHr(start, value);
      else if (type === 'SleepAnalysis' && APPLE_ASLEEP.has(a.value)) c.sleep(a.sourceName, start, end);
    }
  };
  for await (const chunk of text) {
    buf += chunk;
    const cut = buf.lastIndexOf('<');
    scan(buf.slice(0, cut));
    buf = buf.slice(cut);
  }
  scan(buf);
}

/** RFC 4180: quoted fields may hold commas, quotes and line breaks. */
export function csv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') (field += '"'), i++;
      else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows;
}

/** Rows as objects, by column name: exports change their column order between versions. */
function table(rows: string[][], header: number, rename = (h: string) => h) {
  const names = rows[header]?.map(rename) ?? [];
  return rows.slice(header + 1).map((r) => Object.fromEntries(names.map((n, i) => [n, r[i] ?? ''])));
}

/** "UTC+0530", Samsung's offset of local time from the UTC its times are written in. */
const offset = (s: string) => {
  const m = /([+-])(\d\d)(\d\d)/.exec(s);
  return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * HOUR + +m[3] * 60_000) : 0;
};

/**
 * Samsung Health's "Download personal data": one CSV per kind, named like
 * com.samsung.shealth.step_daily_trend.20261020091343.csv. Line 1 names the kind, line 2 has the
 * columns, some prefixed with the kind (com.samsung.health.weight.weight), which is dropped.
 * Samsung has no resting heart rate in the export, so none is taken from it.
 */
export function samsung(files: { name: string; text: string }[], c: Collector) {
  const kind = (f: { text: string }) => /^﻿?([\w.]+),/.exec(f.text)?.[1];
  const rowsOf = (k: string) => files.filter((f) => kind(f) === k).flatMap((f) => table(csv(f.text.replace(/^﻿/, '')), 1, (h) => h.replace(/^com\.samsung\.[a-z0-9_.]*\./, '')));
  const local = (r: Record<string, string>, col: string) => wall(r[col]) + offset(r.time_offset);
  if (!files.some((f) => kind(f)?.startsWith('com.samsung.'))) return false;
  c.sources.add('Samsung Health');

  for (const r of rowsOf('com.samsung.health.weight')) {
    c.reading('weight', local(r, 'start_time'), Number(r.weight));
    c.reading('bodyFat', local(r, 'start_time'), Number(r.body_fat));
  }
  // source_type -2 is Samsung's own merge of every device's count for the day.
  const latest = new Map<string, Record<string, string>>();
  for (const r of rowsOf('com.samsung.shealth.step_daily_trend')) {
    if (r.source_type !== '-2' || !r.day_time) continue;
    const d = dateOf(Number(r.day_time));
    if (!latest.has(d) || r.update_time > latest.get(d)!.update_time) latest.set(d, r);
  }
  for (const [d, r] of latest) c.daySteps(d, Number(r.count));

  // Stages where the watch recorded them (40001 is awake), else the whole session.
  const staged = new Set<string>();
  for (const r of rowsOf('com.samsung.health.sleep_stage')) {
    staged.add(r.sleep_id);
    if (r.stage !== '40001') c.sleep('samsung', local(r, 'start_time'), local(r, 'end_time'));
  }
  for (const r of rowsOf('com.samsung.shealth.sleep')) if (!staged.has(r.datauuid)) c.sleep('samsung', local(r, 'start_time'), local(r, 'end_time'));
  return true;
}

/** Google Fit's Takeout, "Daily activity metrics.csv": one already-merged row per local day. */
export function googleFit(text: string, c: Collector) {
  const rows = table(csv(text.replace(/^﻿/, '')), 0);
  if (!rows.length || !('Date' in rows[0]) || !('Step count' in rows[0])) return false;
  c.sources.add('Google Fit');
  for (const r of rows) {
    if (!/^\d{4}-\d\d-\d\d$/.test(r.Date)) continue;
    if (r['Step count']) c.daySteps(r.Date, Number(r['Step count']));
    if (r['Average weight (kg)']) c.reading('weight', Date.parse(r.Date), Number(r['Average weight (kg)']));
  }
  return true;
}
