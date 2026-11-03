import { fireEvent, render, screen } from '@testing-library/react-native';
import { Activity } from '../src/calendar/activities';
import CalendarScreen from '../src/screens/CalendarScreen';
import {
  deleteActivity,
  loadActivities,
  saveActivity,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  loadActivities: jest.fn(),
  saveActivity: jest.fn(async () => {}),
  deleteActivity: jest.fn(async () => {}),
}));

const today = new Date(2026, 10, 2);
const gym: Activity = {
  id: '1',
  title: 'Gym',
  start: new Date(2026, 10, 3, 16, 30),
  end: new Date(2026, 10, 3, 17, 0),
  color: '#3559C7',
  repeatDays: [],
  completedDates: [],
  skippedDates: [],
};

test('loads saved activities, then saves and deletes changes', async () => {
  // The screen shows what the database holds and writes every change back to it.
  jest.mocked(loadActivities).mockResolvedValue([gym]);
  await render(<CalendarScreen today={today} />);

  await fireEvent.press(await screen.findByText('Gym'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym done' }));
  expect(saveActivity).toHaveBeenCalledWith(
    expect.objectContaining({ id: '1', completedDates: ['2026-11-03'] }),
  );

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByText('Delete'));
  expect(deleteActivity).toHaveBeenCalledWith('1');
});
