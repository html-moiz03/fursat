import { formatDate } from './time';

/** 42 dates (six weeks, Monday first) covering `monthIndex` (0 = January) of `year`. */
export function monthGrid(year: number, monthIndex: number): string[] {
  const first = new Date(year, monthIndex, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  return Array.from({ length: 42 }, (_, i) => formatDate(new Date(year, monthIndex, 1 - offset + i)));
}

/** 'YYYY-MM' moved by `delta` months. */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
