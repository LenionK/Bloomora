import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CalendarScreen from '../src/screens/CalendarScreen';

const today = new Date(2026, 10, 2);

async function openDay(day: string) {
  await fireEvent.press(screen.getByRole('button', { name: day }));
}

async function addActivity(title: string, start: string, repeatDay?: string) {
  await fireEvent.press(screen.getByLabelText('Add activity'));
  await fireEvent.changeText(screen.getByLabelText('Activity title'), title);
  await fireEvent.changeText(screen.getByLabelText('Start time'), start);
  if (repeatDay) {
    await fireEvent.press(screen.getByRole('checkbox', { name: repeatDay }));
  }
  await fireEvent.press(screen.getByText('Add'));
}

test('shows the current month', async () => {
  await render(<CalendarScreen today={today} />);

  expect(screen.getByText('November')).toBeTruthy();
  expect(screen.getByText('2026')).toBeTruthy();
  expect(screen.getByText('30')).toBeTruthy();
  expect(screen.queryByText('31')).toBeNull();
  expect(screen.getByText('No upcoming activities')).toBeTruthy();
});

test('moves between months, across the year, and back to today', async () => {
  await render(<CalendarScreen today={today} />);

  await fireEvent.press(screen.getByLabelText('Next month'));
  await fireEvent.press(screen.getByLabelText('Next month'));
  expect(screen.getByText('January')).toBeTruthy();
  expect(screen.getByText('2027')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Previous month'));
  expect(screen.getByText('December')).toBeTruthy();
  expect(screen.getByText('2026')).toBeTruthy();

  await fireEvent.press(screen.getByText('Today'));
  expect(screen.getByText('November')).toBeTruthy();
});

test('opens the pressed day and keeps it selected when going back', async () => {
  await render(<CalendarScreen today={today} />);
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();

  await openDay('15');
  expect(screen.getByText('Sunday')).toBeTruthy();
  expect(screen.getByText('15 November')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByRole('button', { name: '15', selected: true })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '2', selected: true })).toBeNull();

  await fireEvent.press(screen.getByText('Today'));
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();
});

test('marks today in the day screen', async () => {
  await render(<CalendarScreen today={today} />);

  await openDay('2');

  expect(screen.getByText('Monday')).toBeTruthy();
  expect(screen.getByText('2 November · today')).toBeTruthy();
});

test('changes day across months and returns to that month', async () => {
  await render(<CalendarScreen today={today} />);

  await openDay('30');
  await fireEvent.press(screen.getByLabelText('Next day'));
  expect(screen.getByText('1 December')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('December')).toBeTruthy();
  expect(screen.getByRole('button', { name: '1', selected: true })).toBeTruthy();

  await openDay('1');
  await fireEvent.press(screen.getByLabelText('Previous day'));
  expect(screen.getByText('30 November')).toBeTruthy();
});

test('opens the add activity popup and starts empty after cancelling', async () => {
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByText('2 November')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Call');

  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByLabelText('Activity title').props.value).toBe('');
});

test('shows the activities of the day by start time', async () => {
  await render(<CalendarScreen today={today} />);
  await openDay('2');

  await addActivity('Evening call', '1800');
  await addActivity('Morning run', '0900');

  expect(screen.queryByText('New activity')).toBeNull();
  expect(screen.getByText('18:00–18:30')).toBeTruthy();
  expect(
    screen
      .getAllByText(/Morning run|Evening call/)
      .map((title) => title.props.children),
  ).toEqual(['Morning run', 'Evening call']);

  await fireEvent.press(screen.getByLabelText('Next day'));
  expect(screen.queryByText('Morning run')).toBeNull();
});

test('shows the next activity on the calendar and opens its day', async () => {
  await render(<CalendarScreen today={today} />);
  await openDay('20');
  await addActivity('Later', '1000');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('9');
  await addActivity('Sooner', '1630');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();
  expect(screen.getByText('Sooner')).toBeTruthy();
  expect(screen.getByText('16:30–17:00')).toBeTruthy();
  expect(screen.queryByText('Later')).toBeNull();

  await fireEvent.press(screen.getByText('Sooner'));
  expect(screen.getByText('9 November')).toBeTruthy();
});

test('completes an activity only on the selected day', async () => {
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');
  expect(screen.getByText('0/1')).toBeTruthy();

  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym done' }));
  expect(screen.getByText('1/1')).toBeTruthy();
  expect(
    screen.getByRole('checkbox', { name: 'Gym done', checked: true }),
  ).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();

  await openDay('9');
  expect(screen.getByText('0/1')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('2');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym done' }));
  expect(screen.getByText('0/1')).toBeTruthy();
});

test('deletes a one-time activity immediately', async () => {
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Call', '1630');

  await fireEvent.press(screen.getByLabelText('Delete Call'));

  expect(screen.queryByText('Call')).toBeNull();
  expect(screen.queryByLabelText('0 of 1 completed')).toBeNull();
});

test('asks before deleting a repeating activity', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  expect(screen.getByText('Gym')).toBeTruthy();

  const buttons = alert.mock.calls[0][2]!;
  await act(async () => buttons[1].onPress?.());
  expect(screen.queryByText('Gym')).toBeNull();

  alert.mockRestore();
});
