import { formatBytes } from '../src/storage/formatBytes';

test('shows kilobytes and then megabytes', () => {
  // The value is rounded up, so a small database never shows 0 KB.
  expect(formatBytes(1)).toBe('1 KB');
  expect(formatBytes(8192)).toBe('8 KB');
  expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
});
