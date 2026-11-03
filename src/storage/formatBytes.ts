const BYTES_PER_KB = 1024;

export function formatBytes(bytes: number): string {
  const kilobytes = Math.ceil(bytes / BYTES_PER_KB);

  if (kilobytes < BYTES_PER_KB) return `${kilobytes} KB`;

  return `${(kilobytes / BYTES_PER_KB).toFixed(1)} MB`;
}
