import { fireEvent, render, screen } from '@testing-library/react-native';
import { Activity } from '../src/calendar/activities';
import StatsScreen from '../src/screens/StatsScreen';
import {
  loadKeptActivityStats,
  loadStatsStart,
  loadWaterDays,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  loadKeptActivityStats: jest.fn(),
  loadStatsStart: jest.fn(),
  loadWaterDays: jest.fn(),
}));

// A Monday, so this week is today only.
const today = new Date(2026, 10, 16, 15, 0);
// The Sunday that ends the same week.
const sunday = new Date(2026, 10, 22, 15, 0);
const mondays: Activity = {
  id: '1',
  title: 'Gym',
  start: new Date(2026, 10, 2, 9, 0),
  end: new Date(2026, 10, 2, 10, 0),
  color: '#3559C7',
  repeatDays: [0],
  completedDates: ['2026-11-02'],
  skippedDates: [],
};
const noKeptStats = { done: 0, skipped: 0, missed: 0 };
const onAddActivity = jest.fn();
const onAddWater = jest.fn();

async function renderStats(
  waterDays: { date: string; glasses: number }[] = [],
  activities: Activity[] = [],
  day = today,
) {
  jest.mocked(loadWaterDays).mockResolvedValue(waterDays);
  await render(
    <StatsScreen
      activities={activities}
      onAddActivity={onAddActivity}
      onAddWater={onAddWater}
      onBack={jest.fn()}
      today={day}
    />,
  );
  await screen.findByLabelText('Chart: Water');
}

async function choose(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
}

beforeEach(() => {
  jest.mocked(loadKeptActivityStats).mockResolvedValue(noKeptStats);
  jest.mocked(loadStatsStart).mockResolvedValue(null);
});

test('counts nothing from before the last reset', async () => {
  // After a reset on the 10th, the Monday of the 9th no longer counts.
  jest.mocked(loadStatsStart).mockResolvedValue('2026-11-10');
  const doneToday: Activity = {
    ...mondays,
    completedDates: ['2026-11-02', '2026-11-16'],
  };

  await renderStats([], [doneToday]);
  await choose('Period: All time');

  expect(screen.getByText('1 of 1')).toBeTruthy();
  expect(screen.getByLabelText('Mon 9: nothing planned')).toBeTruthy();
});

test('adds the kept stats of deleted activities to the current ones', async () => {
  // Done 5 + 1, missed 1 + 1 (9 November), cancelled 2: 6 completed out of 8.
  jest.mocked(loadKeptActivityStats).mockResolvedValue({
    done: 5,
    skipped: 2,
    missed: 1,
  });

  await renderStats([], [mondays]);
  await choose('Period: All time');

  expect(screen.getByText('75%')).toBeTruthy();
  expect(screen.getByText('6 of 8')).toBeTruthy();
  expect(screen.getByText('completed')).toBeTruthy();
  expect(screen.getByText('Done 6 · 60%')).toBeTruthy();
  expect(screen.getByText('Missed 2 · 20%')).toBeTruthy();
  expect(screen.getByText('Cancelled 2 · 20%')).toBeTruthy();
});

test('counts this week from Monday and this month from the 1st', async () => {
  // Days before the period, and the deleted activities, are left out.
  jest.mocked(loadKeptActivityStats).mockResolvedValue({
    done: 5,
    skipped: 2,
    missed: 1,
  });
  await renderStats(
    [
      { date: '2026-10-20', glasses: 10 },
      { date: '2026-11-15', glasses: 2 },
    ],
    [mondays],
  );

  // This week is only today, Monday, with nothing done or drunk yet.
  expect(screen.getByText('Nothing to rate yet')).toBeTruthy();
  expect(screen.getByText('Not tracked yet')).toBeTruthy();

  await choose('Period: This month');
  expect(screen.getByText('1 of 2')).toBeTruthy();
  expect(screen.getByText('0/1 days at 2 L')).toBeTruthy();
});

test('shows the water score and streak', async () => {
  // Three days at 2 litres out of four, the last two in a row.
  await renderStats([
    { date: '2026-11-12', glasses: 10 },
    { date: '2026-11-13', glasses: 0 },
    { date: '2026-11-14', glasses: 10 },
    { date: '2026-11-15', glasses: 10 },
    { date: '2026-11-16', glasses: 3 },
  ]);
  await choose('Period: This month');

  expect(screen.getByText('75%')).toBeTruthy();
  expect(screen.getByText('3/4 days at 2 L')).toBeTruthy();
  expect(screen.getByText('2 days')).toBeTruthy();
  expect(screen.getByLabelText('3 of the last 7 days at 2 L')).toBeTruthy();
  expect(screen.queryByText(/Best/)).toBeNull();
});

test("shows today's water before any day can be counted", async () => {
  // Water added today shows up at once, even below 2 litres.
  await renderStats([{ date: '2026-11-16', glasses: 6 }]);

  expect(screen.getByText('60%')).toBeTruthy();
  expect(screen.getByText('1.2 L of 2 L today')).toBeTruthy();
  expect(screen.queryByText('Not tracked yet')).toBeNull();
});

test('counts an activity done today at once', async () => {
  // Marking today's activity as done raises the score without waiting.
  const doneToday: Activity = {
    ...mondays,
    completedDates: ['2026-11-02', '2026-11-16'],
  };

  await renderStats([], [doneToday]);
  await choose('Period: All time');

  expect(screen.getByText('2 of 3')).toBeTruthy();
  expect(screen.getByText('67%')).toBeTruthy();
});

test('shows the activities chart first, with what was done each day', async () => {
  // On Sunday the week has seven bars, Monday's showing its activity.
  await renderStats([], [mondays], sunday);

  expect(screen.getByLabelText('Mon 16: 0 of 1 done')).toBeTruthy();
  expect(screen.getByLabelText('Sun 22: nothing planned')).toBeTruthy();
  expect(screen.getByText('0/1')).toBeTruthy();
  expect(screen.getByText('Nothing planned')).toBeTruthy();
});

test('switches the chart to water, telling untracked days from zero', async () => {
  // A dot marks a day with no record; a recorded day shows its litres.
  await renderStats(
    [
      { date: '2026-11-17', glasses: 0 },
      { date: '2026-11-21', glasses: 10 },
      { date: '2026-11-22', glasses: 3 },
    ],
    [],
    sunday,
  );

  await choose('Chart: Water');

  expect(screen.getByLabelText('Mon 16: not tracked')).toBeTruthy();
  expect(screen.getByLabelText('Tue 17: 0 L')).toBeTruthy();
  expect(screen.getByLabelText('Sat 21: 2 L')).toBeTruthy();
  expect(screen.getByLabelText('Sun 22: 0.6 L')).toBeTruthy();
  expect(screen.getByText('0.6 L')).toBeTruthy();
  expect(screen.getByText('Not tracked')).toBeTruthy();
});

test('shows the whole month in the chart', async () => {
  // Sixteen bars are too thin for values, so only their heights are shown.
  await renderStats([{ date: '2026-11-16', glasses: 3 }], [mondays]);
  await choose('Chart: Water');

  await choose('Period: This month');

  expect(screen.getByLabelText('Sun 1: not tracked')).toBeTruthy();
  expect(screen.getByLabelText('Mon 16: 0.6 L')).toBeTruthy();
  expect(screen.queryByText('0.6 L')).toBeNull();

  await choose('Chart: Activities');
  expect(screen.getByLabelText('Mon 2: 1 of 1 done')).toBeTruthy();
});

test('invites to start when there is nothing to count', async () => {
  // Instead of an empty score, each card leads to where data comes from.
  await renderStats();

  expect(screen.getByText('Nothing to rate yet')).toBeTruthy();
  expect(screen.getByText('Not tracked yet')).toBeTruthy();
  expect(screen.queryByText('–')).toBeNull();

  await fireEvent.press(screen.getByText('Plan an activity'));
  expect(onAddActivity).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Add water'));
  expect(onAddWater).toHaveBeenCalledTimes(1);
});

test('explains how the stats are counted from the info button', async () => {
  // The rules stay out of the way until asked for.
  const rule = /^Deleted activities stay in the stats/;
  await renderStats();
  expect(screen.queryByText(rule)).toBeNull();

  await choose('About stats');
  expect(screen.getByText(rule)).toBeTruthy();

  await choose('About stats');
  expect(screen.queryByText(rule)).toBeNull();
});
