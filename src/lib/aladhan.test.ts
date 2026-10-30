import { describe, expect, it } from 'vitest';
import { fetchMonth, monthUrl, parseMonth, parseTime, prayerAnchors } from './aladhan';

// The documented shape: times carry a zone label and the date sits under date.gregorian.
const classicDay = (dd: string, fajr = '05:12 (PKT)') => ({
  timings: {
    Fajr: fajr,
    Sunrise: '06:32 (PKT)',
    Dhuhr: '11:55 (PKT)',
    Asr: '15:20 (PKT)',
    Sunset: '17:19 (PKT)',
    Maghrib: '17:19 (PKT)',
    Isha: '18:40 (PKT)',
  },
  date: { readable: `${dd} Nov 2026`, timestamp: '1', gregorian: { date: `${dd}-11-2026`, format: 'DD-MM-YYYY' } },
});

// The newer docs describe plain HH:MM and a DD-MM-YYYY `readable`, with no gregorian block.
const plainDay = (dd: string) => ({
  timings: { Fajr: '05:12', Dhuhr: '11:55', Asr: '15:20', Maghrib: '17:19', Isha: '18:40' },
  date: { readable: `${dd}-11-2026` },
});

describe('monthUrl', () => {
  it('builds the calendarByCity URL', () => {
    expect(monthUrl({ year: 2026, month: 11, city: ' Rawalpindi ', country: 'Pakistan', method: 1, school: 1 })).toBe(
      'https://api.aladhan.com/v1/calendarByCity/2026/11?city=Rawalpindi&country=Pakistan&method=1&school=1',
    );
  });

  it('encodes spaces in names', () => {
    expect(monthUrl({ year: 2026, month: 1, city: 'New York', country: 'United States', method: 2, school: 0 })).toContain(
      'city=New+York&country=United+States',
    );
  });
});

describe('parseTime', () => {
  it('reads plain and zone-labelled times', () => {
    expect(parseTime('05:12')).toBe(312);
    expect(parseTime('05:12 (PKT)')).toBe(312);
    expect(parseTime('23:59 (+05)')).toBe(1439);
  });

  it('rejects anything else', () => {
    expect(parseTime('soon')).toBeNull();
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime(undefined)).toBeNull();
  });
});

describe('parseMonth', () => {
  it('reads the documented shape, keyed by date, five prayers only', () => {
    const days = parseMonth({ code: 200, status: 'OK', data: [classicDay('01'), classicDay('02', '05:13 (PKT)')] }, 2026, 11);
    expect(Object.keys(days)).toEqual(['2026-11-01', '2026-11-02']);
    expect(days['2026-11-02']).toEqual({ Fajr: 313, Dhuhr: 715, Asr: 920, Maghrib: 1039, Isha: 1120 });
  });

  it('reads plain times with a DD-MM-YYYY readable date', () => {
    const days = parseMonth({ code: 200, data: [plainDay('03')] }, 2026, 11);
    expect(days['2026-11-03'].Fajr).toBe(312);
  });

  it('falls back to the position in the month when a date is unreadable', () => {
    const noDate = { timings: classicDay('01').timings };
    const days = parseMonth({ code: 200, data: [noDate, noDate, noDate] }, 2026, 11);
    expect(Object.keys(days)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
  });

  it('skips a day with a missing prayer but keeps the rest', () => {
    const broken = { timings: { Fajr: '05:12' }, date: { readable: '01-11-2026' } };
    const days = parseMonth({ code: 200, data: [broken, plainDay('02')] }, 2026, 11);
    expect(Object.keys(days)).toEqual(['2026-11-02']);
  });

  it('uses the service message for an error response', () => {
    expect(() => parseMonth({ code: 400, status: 'BAD_REQUEST', data: 'Unable to find that city.' }, 2026, 11)).toThrow(
      'Unable to find that city.',
    );
  });

  it('throws on junk and on an empty month', () => {
    expect(() => parseMonth(null, 2026, 11)).toThrow();
    expect(() => parseMonth({ code: 200, data: [] }, 2026, 11)).toThrow('no prayer times');
    expect(() => parseMonth({ code: 200, data: 'nope' }, 2026, 11)).toThrow();
  });
});

describe('fetchMonth', () => {
  const request = { year: 2026, month: 11, city: 'Rawalpindi', country: 'Pakistan', method: 1, school: 1 as const };
  const reply = (body: unknown, status = 200) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it('returns parsed days and asks for the right URL', async () => {
    let asked = '';
    const spy = (async (url: string) => {
      asked = url;
      return new Response(JSON.stringify({ code: 200, data: [classicDay('01')] }));
    }) as unknown as typeof fetch;
    const days = await fetchMonth(request, spy);
    expect(asked).toBe(monthUrl(request));
    expect(days['2026-11-01'].Isha).toBe(1120);
  });

  it('passes on the service message for a bad city', async () => {
    await expect(fetchMonth(request, reply({ code: 400, status: 'BAD_REQUEST', data: 'Unable to find that city.' }, 400))).rejects.toThrow(
      'Unable to find that city.',
    );
  });

  it('reports a network failure plainly', async () => {
    const down = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(fetchMonth(request, down)).rejects.toThrow("Couldn't reach");
  });

  it('reports an error status without a message', async () => {
    await expect(fetchMonth(request, reply({}, 503))).rejects.toThrow('503');
  });
});

describe('prayerAnchors', () => {
  it('makes one one-off anchor per prayer per day', () => {
    const days = parseMonth({ code: 200, data: [plainDay('02')] }, 2026, 11);
    const anchors = prayerAnchors(days, 20);
    expect(anchors).toHaveLength(5);
    const fajr = anchors.find((a) => a.title === 'Fajr')!;
    expect(fajr).toMatchObject({
      id: 'prayer-2026-11-02-fajr',
      startMin: 312,
      endMin: 332,
      repeatDays: [],
      date: '2026-11-02',
      kind: 'prayer',
      source: 'prayer-api',
    });
  });

  it('never runs past midnight', () => {
    const late = { '2026-11-02': { Fajr: 300, Dhuhr: 700, Asr: 900, Maghrib: 1000, Isha: 1430 } };
    expect(prayerAnchors(late, 30).find((a) => a.title === 'Isha')!.endMin).toBe(1439);
  });
});
