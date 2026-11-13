import { render, screen } from '@testing-library/react-native';
import { Activity } from '../src/calendar/activities';
import StatsScreen from '../src/screens/StatsScreen';
import {
  loadKeptActivityStats,
  loadWaterDays,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  loadKeptActivityStats: jest.fn(),
  loadWaterDays: jest.fn(),
}));

const today = new Date(2026, 10, 16, 15, 0);
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

test('adds the kept stats of deleted activities to the current ones', async () => {
  // Deleted activities still count, next to the past days of current ones.
  jest.mocked(loadKeptActivityStats).mockResolvedValue({
    done: 5,
    skipped: 2,
    missed: 1,
  });
  jest.mocked(loadWaterDays).mockResolvedValue([]);

  await render(
    <StatsScreen activities={[mondays]} onBack={jest.fn()} today={today} />,
  );

  // Done 5 + 1, missed 1 + 1 (9 November), skipped 2: 6 out of 8 days.
  expect(await screen.findByText('75%')).toBeTruthy();
  expect(screen.getByText('6')).toBeTruthy();
  expect(screen.getAllByText('2')).toHaveLength(2);
  expect(screen.getByText('done on their day')).toBeTruthy();
});

test('shows the water score and streaks', async () => {
  // Three days at 2 litres out of four, the last two in a row.
  jest.mocked(loadKeptActivityStats).mockResolvedValue({
    done: 0,
    skipped: 0,
    missed: 0,
  });
  jest.mocked(loadWaterDays).mockResolvedValue([
    { date: '2026-11-12', glasses: 10 },
    { date: '2026-11-14', glasses: 10 },
    { date: '2026-11-15', glasses: 10 },
  ]);

  await render(<StatsScreen activities={[]} onBack={jest.fn()} today={today} />);

  expect(await screen.findByText('of days at 2 L')).toBeTruthy();
  expect(screen.getByText('75%')).toBeTruthy();
  expect(screen.getAllByText('2 days')).toHaveLength(2);
  expect(screen.getByText('3 of 4')).toBeTruthy();
});

test('shows no score before there is anything to count', async () => {
  // A dash instead of 0%, which would look like a bad result.
  jest.mocked(loadKeptActivityStats).mockResolvedValue({
    done: 0,
    skipped: 0,
    missed: 0,
  });
  jest.mocked(loadWaterDays).mockResolvedValue([]);

  await render(<StatsScreen activities={[]} onBack={jest.fn()} today={today} />);

  expect(await screen.findAllByText('–')).toHaveLength(2);
});
