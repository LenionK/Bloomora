import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('shows the welcome text', async () => {
  await render(<App />);
  expect(screen.getByText(/Open up App\.tsx/)).toBeTruthy();
});
