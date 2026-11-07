/** Fasting modes, eating windows and Ramadan times. Calorie and protein targets never change here. */
import { addDays, today, type Day } from '../app/db';

export type Fasting =
  /** `start` is "HH:MM" local time; the window lasts `hours`. */
  | { mode: 'if'; start: string; hours: number }
  | { mode: 'ramadan'; city: CityId }
  /** Times the person reads off their local mosque or calendar, "HH:MM". */
  | { mode: 'ramadan'; fajr: string; maghrib: string }
  | { mode: 'navratri' };

/** Eating hours in a day, as the usual "16:8" style names. */
export const IF_WINDOWS = [12, 10, 8, 6] as const;
export const ifName = (hours: number) => `${24 - hours}:${hours}`;

/** City centres; Fajr and Maghrib move by about a minute per 15 km, which is close enough for a guide. */
export const CITIES = {
  agra: ['Agra', 27.18, 78.01],
  ahmedabad: ['Ahmedabad', 23.02, 72.57],
  aligarh: ['Aligarh', 27.88, 78.08],
  bengaluru: ['Bengaluru', 12.97, 77.59],
  bhopal: ['Bhopal', 23.26, 77.41],
  bhubaneswar: ['Bhubaneswar', 20.3, 85.82],
  chandigarh: ['Chandigarh', 30.73, 76.78],
  chennai: ['Chennai', 13.08, 80.27],
  coimbatore: ['Coimbatore', 11.02, 76.96],
  delhi: ['Delhi', 28.61, 77.21],
  guwahati: ['Guwahati', 26.14, 91.74],
  hyderabad: ['Hyderabad', 17.39, 78.49],
  indore: ['Indore', 22.72, 75.86],
  jaipur: ['Jaipur', 26.91, 75.79],
  jammu: ['Jammu', 32.73, 74.86],
  kochi: ['Kochi', 9.93, 76.27],
  kolkata: ['Kolkata', 22.57, 88.36],
  kozhikode: ['Kozhikode', 11.26, 75.78],
  lucknow: ['Lucknow', 26.85, 80.95],
  malappuram: ['Malappuram', 11.07, 76.07],
  mangaluru: ['Mangaluru', 12.91, 74.86],
  mumbai: ['Mumbai', 19.08, 72.88],
  nagpur: ['Nagpur', 21.15, 79.09],
  patna: ['Patna', 25.59, 85.14],
  pune: ['Pune', 18.52, 73.86],
  ranchi: ['Ranchi', 23.34, 85.31],
  srinagar: ['Srinagar', 34.08, 74.8],
  surat: ['Surat', 21.17, 72.83],
  thiruvananthapuram: ['Thiruvananthapuram', 8.52, 76.94],
  varanasi: ['Varanasi', 25.32, 82.97],
  visakhapatnam: ['Visakhapatnam', 17.69, 83.22],
} as const satisfies Record<string, readonly [string, number, number]>;
export type CityId = keyof typeof CITIES;

const rad = Math.PI / 180;

/**
 * Fajr (sun 18 degrees below the horizon, the University of Islamic Sciences, Karachi convention used across India)
 * and Maghrib (sunset, centre 0.833 degrees below the horizon for refraction and the sun's radius) on a calendar date,
 * from NOAA's general solar position equations (gml.noaa.gov/grad/solcalc/solareqns.PDF).
 */
export function prayerTimes(date: string, lat: number, lon: number) {
  const [y, m, d] = date.split('-').map(Number);
  const dayOfYear = (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5;
  const g = ((2 * Math.PI) / (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 366 : 365)) * (dayOfYear - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  /** Minutes from solar noon until the sun is `depression` degrees below the horizon. */
  const offset = (depression: number) =>
    4 * (Math.acos((Math.sin(-depression * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl))) / rad);
  const noon = 720 - 4 * lon - eqTime;
  const at = (minutes: number) => new Date(Date.UTC(y, m - 1, d) + Math.round(minutes) * 6e4);
  return { fajr: at(noon - offset(18)), maghrib: at(noon + offset(0.833)) };
}

/** A local "HH:MM" on a calendar date. */
function clock(date: string, hhmm: string) {
  return new Date(`${date}T${hhmm}:00`);
}

/** When the fast starts and ends on a calendar date, as local Dates. */
export function ramadanTimes(f: Extract<Fasting, { mode: 'ramadan' }>, date: string) {
  if ('city' in f) {
    const [, lat, lon] = CITIES[f.city];
    return prayerTimes(date, lat, lon);
  }
  return { fajr: clock(date, f.fajr), maghrib: clock(date, f.maghrib) };
}

export type WindowState = { eating: boolean; until: Date };

/** Whether `now` is inside the eating window, and when that changes. Undefined when the mode has no window. */
export function windowState(f: Fasting | undefined, now: Date): WindowState | undefined {
  const date = today(now);
  if (f?.mode === 'if') {
    const open = clock(date, f.start);
    if (open > now) open.setDate(open.getDate() - 1);
    const close = new Date(open.getTime() + f.hours * 36e5);
    if (now < close) return { eating: true, until: close };
    open.setDate(open.getDate() + 1);
    return { eating: false, until: open };
  }
  if (f?.mode === 'ramadan') {
    const { fajr, maghrib } = ramadanTimes(f, date);
    if (now < fajr) return { eating: true, until: fajr };
    if (now < maghrib) return { eating: false, until: maghrib };
    return { eating: true, until: ramadanTimes(f, addDays(date, 1)).fajr };
  }
  return undefined;
}

/** Vrat food only: all of Navratri, or a single fast day ticked on Today. */
export const vratDay = (f: Fasting | undefined, day: Day | undefined) => f?.mode === 'navratri' || !!day?.vrat;
