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
