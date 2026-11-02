import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('shows the calendar', async () => {
  await render(<App />);
  expect(screen.getByText('Today')).toBeTruthy();
});
