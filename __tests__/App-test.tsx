import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('shows the calendar', async () => {
  // The app starts on the calendar screen.
  await render(<App />);
  expect(screen.getByLabelText('My day')).toBeTruthy();
});
