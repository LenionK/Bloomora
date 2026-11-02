import { Activity } from '../src/calendar/activities';
import { HOUR_HEIGHT, layoutDay } from '../src/calendar/dayLayout';

function activity(id: string, start: number, end: number): Activity {
  return {
    id,
    title: id,
    start: new Date(2026, 10, 2, Math.floor(start / 60), start % 60),
    end: new Date(2026, 10, 2, Math.floor(end / 60), end % 60),
    color: '#000000',
    repeatDays: [],
    completedDates: [],
  };
}

test('places a card from its start time and duration', () => {
  const [card] = layoutDay([activity('a', 9 * 60, 11 * 60)]);

  expect(card.top).toBe(9 * HOUR_HEIGHT);
  expect(card.height).toBe(2 * HOUR_HEIGHT);
  expect(card.lane).toBe(0);
  expect(card.laneCount).toBe(1);
});

test('keeps short activities tall enough to read', () => {
  const [card] = layoutDay([activity('a', 9 * 60, 9 * 60 + 5)]);

  expect(card.height).toBe(64);
});

test('keeps separate activities in one lane', () => {
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

test('separates activities whose short cards would touch', () => {
  const cards = layoutDay([
    activity('a', 9 * 60, 9 * 60 + 5),
    activity('b', 9 * 60 + 10, 9 * 60 + 15),
  ]);

  expect(cards.map(({ lane }) => lane)).toEqual([0, 1]);
});
