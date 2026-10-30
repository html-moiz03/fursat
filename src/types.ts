/** All times are minutes since midnight (0-1439). Dates are 'YYYY-MM-DD' strings. */

export type AnchorKind = 'work' | 'meal' | 'prayer' | 'commute' | 'class' | 'other';

export type Anchor = {
  id: string;
  title: string;
  startMin: number;
  /** If endMin < startMin the anchor crosses midnight. endMin === startMin is ignored (zero length). */
  endMin: number;
  /** 0 = Sunday ... 6 = Saturday. Empty array means a one-off anchor that uses `date`. */
  repeatDays: number[];
  /** Only for one-off anchors. */
  date?: string;
  kind: AnchorKind;
  source: 'manual' | 'prayer-api';
  color: string;
};

export type Task = {
  id: string;
  title: string;
  durationMin: number;
  status: 'inbox' | 'planned' | 'done';
  /** Set when planned. */
  date?: string;
  startMin?: number;
  createdAt: number;
};

export type Gap = {
  startMin: number;
  endMin: number;
  lengthMin: number;
  date: string;
};

/** A busy stretch of one day, in minutes since midnight. */
export type Interval = [startMin: number, endMin: number];

export type PrayerSettings = {
  enabled: boolean;
  city: string;
  country: string;
  /** Aladhan calculation method id, e.g. 1 = University of Islamic Sciences, Karachi. */
  method: number;
  /** Asr calculation: 0 = Shafi/Maliki/Hanbali, 1 = Hanafi. */
  school: 0 | 1;
  /** How long each prayer blocks off, in minutes. */
  durationMin: number;
};

export type Settings = {
  /** e.g. 360 = 06:00 */
  dayStartMin: number;
  /** e.g. 1380 = 23:00 */
  dayEndMin: number;
  /** Gaps shorter than this are hidden, e.g. 10. */
  minGapMin: number;
  /** Prayer-time anchors from the Aladhan API. Absent until the user sets it up. */
  prayer?: PrayerSettings;
  theme: 'light' | 'dark' | 'system';
};

export type GapSettings = Pick<Settings, 'dayStartMin' | 'dayEndMin' | 'minGapMin'>;
