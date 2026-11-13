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
  loadReminderSettings: jest.fn(
    async () =>
      jest.requireActual('../src/notifications/reminders')
        .DEFAULT_REMINDER_SETTINGS,
  ),
  loadWaterGlasses: jest.fn(async () => 0),
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

  await fireEvent.press(screen.getByLabelText('Edit Gym'));
  await fireEvent.changeText(screen.getByLabelText('End time'), '1800');
  await fireEvent.press(screen.getByText('Save'));
  expect(saveActivity).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: '1',
      end: new Date(2026, 10, 3, 18, 0),
      completedDates: ['2026-11-03'],
    }),
  );

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByText('Delete'));
  // The activity was not due yet, so it leaves nothing to keep in the stats.
  expect(deleteActivity).toHaveBeenCalledWith('1', {
    done: 0,
    skipped: 0,
    missed: 0,
  });
});
