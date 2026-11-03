import { Activity } from '../src/calendar/activities';
import {
  getDayGaps,
  getTimeMarks,
  HOUR_HEIGHT,
  layoutDay,
} from '../src/calendar/dayLayout';

function activity(id: string, start: number, end: number): Activity {
  return {
    id,
    title: id,
    start: new Date(2026, 10, 2, Math.floor(start / 60), start % 60),
    end: new Date(2026, 10, 2, Math.floor(end / 60), end % 60),
    color: '#000000',
    repeatDays: [],
    completedDates: [],
    skippedDates: [],
  };
}

function labels(activities: Activity[]) {
  return getTimeMarks(activities).map(({ label }) => label);
}

test('places a card from its start time and duration', () => {
  // The position comes from the start time and the height from the duration.
  const [card] = layoutDay([activity('a', 9 * 60, 11 * 60)]);

  expect(card.top).toBe(9 * HOUR_HEIGHT);
  expect(card.height).toBe(2 * HOUR_HEIGHT);
  expect(card.lane).toBe(0);
  expect(card.laneCount).toBe(1);
});

test('keeps short activities tall enough to read', () => {
  // A 5 minute activity still gets the minimum card height.
  const [card] = layoutDay([activity('a', 9 * 60, 9 * 60 + 5)]);

  expect(card.height).toBe(64);
});

test('keeps separate activities in one lane', () => {
  // One activity ending when the next starts is not an overlap.
  const cards = layoutDay([
    activity('a', 9 * 60, 10 * 60),
    activity('b', 10 * 60, 11 * 60),
  ]);

  expect(cards.map(({ lane, laneCount }) => [lane, laneCount])).toEqual([
    [0, 1],
    [0, 1],
  ]);
});

test('places overlapping activities side by side', () => {
  // Overlapping activities share the width, while a later separate one gets it all.
  const cards = layoutDay([
    activity('a', 9 * 60, 11 * 60),
    activity('b', 10 * 60, 12 * 60),
    activity('c', 11 * 60, 12 * 60),
    activity('d', 15 * 60, 16 * 60),
  ]);

  expect(cards.map(({ lane, laneCount }) => [lane, laneCount])).toEqual([
    [0, 2],
    [1, 2],
    [0, 2],
    [0, 1],
  ]);
});

test('measures the free time between activities', () => {
  // The gap is placed between the cards and counts the real minutes.
  const gaps = getDayGaps(
    layoutDay([
      activity('a', 9 * 60, 10 * 60),
      activity('b', 11 * 60 + 30, 12 * 60 + 30),
    ]),
  );

  expect(gaps).toEqual([
    { top: 10 * HOUR_HEIGHT, height: 1.5 * HOUR_HEIGHT, minutes: 90 },
  ]);
});

test('shows no gap when activities touch or there is no room', () => {
  // Without free time, or with cards too close, there is nothing to show.
  expect(
    getDayGaps(
      layoutDay([
        activity('a', 9 * 60, 10 * 60),
        activity('b', 10 * 60, 11 * 60),
      ]),
    ),
  ).toEqual([]);
  expect(
    getDayGaps(
      layoutDay([
        activity('a', 9 * 60, 9 * 60 + 5),
        activity('b', 10 * 60, 11 * 60),
      ]),
    ),
  ).toHaveLength(0);
});

test('adds activity times to the hours on the left', () => {
  // 08:30 and 09:15 are not hours, so they join the list in the colour of the activity.
  const marks = getTimeMarks([activity('a', 8 * 60 + 30, 9 * 60 + 15)]);
  const start = marks.find(({ label }) => label === '08:30');

  expect(start?.color).toBe('#000000');
  expect(start?.top).toBe(8.5 * HOUR_HEIGHT);
  expect(marks.map(({ label }) => label)).toEqual(
    expect.arrayContaining(['08:00', '08:30', '09:00', '09:15', '10:00']),
  );
});

test('does not repeat a time already on the left', () => {
  // An activity starting on the hour takes the place of that hour.
  const marks = labels([activity('a', 10 * 60, 11 * 60)]);

  expect(marks.filter((label) => label === '10:00')).toHaveLength(1);
  expect(marks.filter((label) => label === '11:00')).toHaveLength(1);
  expect(marks).toHaveLength(24);
});

test('drops times that would overlap on screen', () => {
  // A start wins over the nearby hour, and over a nearby end of another activity.
  const marks = labels([
    activity('a', 8 * 60, 9 * 60),
    activity('b', 9 * 60 + 5, 10 * 60),
  ]);

  expect(marks).toContain('09:05');
  expect(marks).not.toContain('09:00');
});

test('separates activities whose short cards would touch', () => {
  // Overlap is measured on the card height, not only on the real duration.
  const cards = layoutDay([
    activity('a', 9 * 60, 9 * 60 + 5),
    activity('b', 9 * 60 + 10, 9 * 60 + 15),
  ]);

  expect(cards.map(({ lane }) => lane)).toEqual([0, 1]);
});
