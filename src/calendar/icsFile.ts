import { File } from 'expo-file-system';

// The file system's own picker gives the app the right to read the chosen
// file. Some file managers do not mark .ics files as calendars, so any file
// can be picked and its text is checked instead.
export async function pickCalendarFile(): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
  if (picked.canceled) return null;

  return picked.result.text();
}

export function isCalendarText(text: string): boolean {
  return /BEGIN:VCALENDAR/i.test(text);
}
