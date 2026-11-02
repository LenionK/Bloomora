import { fireEvent, render, screen } from '@testing-library/react-native';
import CalendarScreen from '../src/screens/CalendarScreen';

const today = new Date(2026, 10, 2);

test('shows the current month', async () => {
  await render(<CalendarScreen today={today} />);

  expect(screen.getByText('November')).toBeTruthy();
  expect(screen.getByText('2026')).toBeTruthy();
  expect(screen.getByText('30')).toBeTruthy();
  expect(screen.queryByText('31')).toBeNull();
});

test('opens the add activity popup and starts empty after cancelling', async () => {
  await render(<CalendarScreen today={today} />);
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByText('2 November')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Call');

  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByLabelText('Activity title').props.value).toBe('');
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

test('selects the pressed day and returns to today', async () => {
  await render(<CalendarScreen today={today} />);
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: '15' }));
  expect(screen.getByRole('button', { name: '15', selected: true })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '2', selected: true })).toBeNull();

  await fireEvent.press(screen.getByText('Today'));
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();
});

