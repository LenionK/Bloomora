import { act, render, screen } from '@testing-library/react-native';
import App from '../App';

test('shows the calendar', async () => {
  // The app starts on the calendar screen.
  await render(<App />);
  expect(screen.getByLabelText('My day')).toBeTruthy();
});

test('shows the logo and name for a moment when opening', async () => {
  // The opening screen covers the calendar while it loads, then goes away by itself.
  jest.useFakeTimers();
  await render(<App />);
  expect(screen.getAllByText('Bloomora')).toHaveLength(2);

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getAllByText('Bloomora')).toHaveLength(1);
  jest.useRealTimers();
});
