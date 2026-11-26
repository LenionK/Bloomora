import { Activity } from '../src/calendar/activities';
import { parseIcs, withoutDuplicates } from '../src/calendar/ics';

// Thursday 26 November 2026.
const today = new Date(2026, 10, 26, 8, 0);
const color = '#B5305E';

function calendar(...events: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    ...events.map((event) => `BEGIN:VEVENT\r\n${event}\r\nEND:VEVENT`),
    'END:VCALENDAR',
  ].join('\r\n');
}

test('imports a one-time event with its title and description', () => {
  // Escaped commas and new lines are read back, and a folded line is joined.
  const { activities } = parseIcs(
    calendar(
      [
        'SUMMARY:Dentist\\, Dr Rossi',
        'DESCRIPTION:Bring the X-rays\\nand the card. A long note that the fil',
        ' e folds on the next line',
        'DTSTART:20261127T163000',
        'DTEND:20261127T171500',
      ].join('\r\n'),
    ),
    today,
    color,
  );

  expect(activities).toEqual([
    {
      title: 'Dentist, Dr Rossi',
      description:
        'Bring the X-rays\nand the card. A long note that the file folds on the next line',
      start: new Date(2026, 10, 27, 16, 30),
      end: new Date(2026, 10, 27, 17, 15),
      color,
      repeatDays: [],
      skippedDates: [],
    },
  ]);
});

test('leaves out events over before today, and counts them', () => {
  // Today's events are kept, even when their time is over.
  const result = parseIcs(
    calendar(
      'SUMMARY:Old\r\nDTSTART:20261120T100000\r\nDTEND:20261120T110000',
      'SUMMARY:This morning\r\nDTSTART:20261126T070000\r\nDTEND:20261126T073000',
    ),
    today,
    color,
  );

  expect(result.activities.map((activity) => activity.title)).toEqual(['This morning']);
  expect(result.past).toBe(1);
});

test('turns an all-day event into a short morning activity', () => {
  // All-day events have no time, so they are placed at 9:00â€“9:30.
  const { activities } = parseIcs(
    calendar('SUMMARY:Birthday\r\nDTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261202'),
    today,
    color,
  );

  expect(activities[0].start).toEqual(new Date(2026, 11, 1, 9, 0));
  expect(activities[0].end).toEqual(new Date(2026, 11, 1, 9, 30));
});

test('reads times in UTC, durations and missing ends', () => {
  // A time ending in Z is shown in the phone's time; with no end, it lasts 30 minutes.
  const { activities } = parseIcs(
    calendar(
      'SUMMARY:Call\r\nDTSTART:20261130T150000Z\r\nDURATION:PT1H',
      'SUMMARY:Reminder\r\nDTSTART;TZID=Europe/Rome:20261130T090000',
    ),
    today,
    color,
  );
  const callStart = new Date(Date.UTC(2026, 10, 30, 15, 0));

  expect(activities[0].start).toEqual(callStart);
  expect(activities[0].end).toEqual(new Date(callStart.getTime() + 60 * 60000));
  expect(activities[1].start).toEqual(new Date(2026, 10, 30, 9, 0));
  expect(activities[1].end).toEqual(new Date(2026, 10, 30, 9, 30));
});

test('stops an event that ends on a later day at 23:59', () => {
  // Activities fit in one day.
  const { activities } = parseIcs(
    calendar('SUMMARY:Night shift\r\nDTSTART:20261128T220000\r\nDTEND:20261129T060000'),
    today,
    color,
  );

  expect(activities[0].end).toEqual(new Date(2026, 10, 28, 23, 59));
});

test('names an event without a title and leaves out cancelled ones', () => {
  // The alarm inside an event does not replace its description.
  const result = parseIcs(
    calendar(
      [
        'DTSTART:20261127T100000',
        'DESCRIPTION:Event note',
        'BEGIN:VALARM',
        'DESCRIPTION:Alarm note',
        'END:VALARM',
      ].join('\r\n'),
      'SUMMARY:Gone\r\nSTATUS:CANCELLED\r\nDTSTART:20261127T120000',
    ),
    today,
    color,
  );

  expect(result.activities).toHaveLength(1);
  expect(result.activities[0]).toMatchObject({
    title: 'Untitled activity',
    description: 'Event note',
  });
});

test('keeps a weekly repeat with no end as a repeating activity', () => {
  // A series already going on starts again from its next date, without past skips.
  const { activities } = parseIcs(
    calendar(
      [
        'SUMMARY:Gym',
        'DTSTART:20260105T180000',
        'DTEND:20260105T190000',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
        'EXDATE:20261102T180000,20261202T180000',
      ].join('\r\n'),
    ),
    today,
    color,
  );

  expect(activities).toEqual([
    expect.objectContaining({
      title: 'Gym',
      start: new Date(2026, 10, 30, 18, 0),
      end: new Date(2026, 10, 30, 19, 0),
      repeatDays: [0, 2],
      skippedDates: ['2026-12-02'],
    }),
  ]);
});

test('keeps daily repeats with no end, on every day or on chosen weekdays', () => {
  // Every weekday is a daily repeat limited to Monday to Friday.
  const { activities } = parseIcs(
    calendar(
      'SUMMARY:Walk\r\nDTSTART:20261101T070000\r\nRRULE:FREQ=DAILY',
      'SUMMARY:Work\r\nDTSTART:20261101T090000\r\nRRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    ),
    today,
    color,
  );

  expect(activities[0].repeatDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(activities[0].start).toEqual(new Date(2026, 10, 26, 7, 0));
  expect(activities[1].repeatDays).toEqual([0, 1, 2, 3, 4]);
  expect(activities[1].start).toEqual(new Date(2026, 10, 26, 9, 0));
});

test('turns a monthly repeat into one-time activities for 3 months', () => {
  // Dates after 26 February 2027 are left out.
  const { activities } = parseIcs(
    calendar('SUMMARY:Rent\r\nDTSTART:20260310T100000\r\nRRULE:FREQ=MONTHLY'),
    today,
    color,
  );

  expect(activities.map((activity) => activity.start)).toEqual([
    new Date(2026, 11, 10, 10, 0),
    new Date(2027, 0, 10, 10, 0),
    new Date(2027, 1, 10, 10, 0),
  ]);
  expect(activities.every((activity) => activity.repeatDays.length === 0)).toBe(true);
});

test('follows the count, the end date, the interval and the skipped dates', () => {
  // Each of these becomes single dates, because Bloomora repeats have no end.
  const { activities } = parseIcs(
    calendar(
      'SUMMARY:Course\r\nDTSTART:20261123T100000\r\nRRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Trip\r\nDTSTART:20261127T080000\r\nRRULE:FREQ=DAILY;UNTIL=20261129T120000Z',
      [
        'SUMMARY:Football',
        'DTSTART:20261126T200000',
        'RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231',
        'EXDATE:20261210T200000',
      ].join('\r\n'),
    ),
    today,
    color,
  );
  const datesOf = (title: string) =>
    activities
      .filter((activity) => activity.title === title)
      .map((activity) => activity.start.getDate());

  expect(datesOf('Course')).toEqual([30, 7]);
  expect(datesOf('Trip')).toEqual([27, 28, 29]);
  expect(datesOf('Football')).toEqual([26, 24]);
});

test('leaves out a day that the month does not have', () => {
  // A monthly event on the 31st skips the shorter months.
  const { activities } = parseIcs(
    calendar('SUMMARY:Report\r\nDTSTART:20261031T090000\r\nRRULE:FREQ=MONTHLY'),
    today,
    color,
  );

  expect(activities.map((activity) => activity.start.getMonth())).toEqual([11, 0]);
});

test('counts the repeats it cannot work out', () => {
  // "The second Monday of the month" has no clear dates in Bloomora.
  const result = parseIcs(
    calendar(
      'SUMMARY:Meeting\r\nDTSTART:20261109T100000\r\nRRULE:FREQ=MONTHLY;BYDAY=2MO',
      'SUMMARY:Odd\r\nDTSTART:20261109T100000\r\nRRULE:FREQ=HOURLY',
    ),
    today,
    color,
  );

  expect(result.activities).toEqual([]);
  expect(result.unsupported).toBe(2);
});

test('does not add the same activity twice', () => {
  // Importing a file again skips what is already in the calendar.
  const { activities } = parseIcs(
    calendar(
      'SUMMARY:Call\r\nDTSTART:20261127T100000',
      'SUMMARY:Call\r\nDTSTART:20261127T100000',
      'SUMMARY:Lunch\r\nDTSTART:20261127T130000',
    ),
    today,
    color,
  );
  const existing = [
    { ...activities[2], id: '1', completedDates: [] },
  ] as Activity[];

  const result = withoutDuplicates(activities, existing);

  expect(result.activities.map((activity) => activity.title)).toEqual(['Call']);
  expect(result.duplicates).toBe(2);
});
