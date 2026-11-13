import { Activity } from '../src/calendar/activities';
import {
  deleteActivities,
  deleteActivity,
  getDatabaseSize,
  loadActivities,
  loadKeptActivityStats,
  loadReminderSettings,
  loadWaterDays,
  loadWaterGlasses,
  saveActivity,
  saveReminderSettings,
  saveWaterGlasses,
} from '../src/storage/activityDatabase';
import { activityToRow } from '../src/storage/activityRow';

const mockDatabase = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

const activity: Activity = {
  id: '1',
  title: "Dall'avvocato",
  start: new Date(2026, 10, 2, 16, 30),
  end: new Date(2026, 10, 2, 17, 0),
  color: '#3559C7',
  repeatDays: [0, 2],
  completedDates: [],
  skippedDates: [],
};

async function openDatabaseAtVersion(version: number) {
  mockDatabase.execAsync.mockClear();
  mockDatabase.getAllAsync.mockResolvedValue([]);
  mockDatabase.getFirstAsync.mockResolvedValue({ user_version: version });

  let load: () => Promise<Activity[]> = async () => [];

  jest.isolateModules(() => {
    load = jest.requireActual('../src/storage/activityDatabase').loadActivities;
  });
  await load();

  return mockDatabase.execAsync.mock.calls.map(([query]) => query).join('\n');
}

test('adds the skipped dates to a database created before them', async () => {
  // Activities already on the phone must survive the update of the table.
  const queries = await openDatabaseAtVersion(0);

  expect(queries).toContain('ADD COLUMN skipped_dates');
  expect(queries).toContain('PRAGMA user_version = 1');
});

test('does not change a database that is already up to date', async () => {
  // Adding the same column twice would make the app fail at every opening.
  const queries = await openDatabaseAtVersion(1);

  expect(queries).not.toContain('ADD COLUMN');
});

test('loads the saved activities', async () => {
  // The rows read from the database become activities.
  mockDatabase.getAllAsync.mockResolvedValue([activityToRow(activity)]);

  expect(await loadActivities()).toEqual([activity]);
});

test('saves an activity with its values passed separately', async () => {
  // Values travel apart from the query, so an apostrophe in a title cannot break it.
  await saveActivity(activity);

  const [query, values] = mockDatabase.runAsync.mock.lastCall;
  expect(query).toContain('INSERT OR REPLACE INTO activities');
  expect(values).toContain("Dall'avvocato");
  expect(query.match(/\?/g)).toHaveLength(values.length);
});

test('deletes old activities together, keeping their stats, and frees their space', async () => {
  // Deletions and kept stats succeed or fail together, then the file gets smaller.
  mockDatabase.runAsync.mockClear();
  mockDatabase.withTransactionAsync.mockClear();

  await deleteActivities(['1', '2'], { done: 4, skipped: 1, missed: 2 });

  expect(mockDatabase.withTransactionAsync).toHaveBeenCalledTimes(1);
  const queries = mockDatabase.runAsync.mock.calls;
  expect(queries.filter(([query]) => query.includes('stats_totals'))).toEqual([
    [expect.stringContaining('value = value + excluded.value'), ['done', 4]],
    [expect.any(String), ['skipped', 1]],
    [expect.any(String), ['missed', 2]],
  ]);
  expect(
    queries.filter(([query]) => query.startsWith('DELETE FROM activities')),
  ).toHaveLength(2);
  expect(mockDatabase.execAsync).toHaveBeenLastCalledWith('VACUUM');
});

test('keeps the stats of a single deleted activity', async () => {
  // Deleting from the day screen keeps its past days in the stats too.
  mockDatabase.runAsync.mockClear();

  await deleteActivity('1', { done: 2, skipped: 0, missed: 1 });

  expect(mockDatabase.runAsync).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO stats_totals'),
    ['done', 2],
  );
});

test('reads the kept stats, with zero for those never saved', async () => {
  // Before any deletion the table is empty and every count is zero.
  mockDatabase.getAllAsync.mockResolvedValueOnce([
    { name: 'done', value: 7 },
    { name: 'missed', value: 3 },
  ]);

  expect(await loadKeptActivityStats()).toEqual({
    done: 7,
    skipped: 0,
    missed: 3,
  });
});

test('reads every saved water day in date order', async () => {
  // The stats need the days in order to find the streaks.
  const waterDays = [{ date: '2026-11-13', glasses: 10 }];
  mockDatabase.getAllAsync.mockResolvedValueOnce(waterDays);

  expect(await loadWaterDays()).toEqual(waterDays);
  expect(mockDatabase.getAllAsync).toHaveBeenLastCalledWith(
    'SELECT date, glasses FROM water_days ORDER BY date',
  );
});

test('reads the size of the database', async () => {
  // This is the space shown in the settings.
  mockDatabase.getFirstAsync.mockResolvedValue({ size: 8192 });

  expect(await getDatabaseSize()).toBe(8192);
});

test('creates the water table with the activities one', async () => {
  // A phone that already has activities gets the new table at the next opening.
  const queries = await openDatabaseAtVersion(1);

  expect(queries).toContain('CREATE TABLE IF NOT EXISTS water_days');
  expect(queries).toContain('CREATE TABLE IF NOT EXISTS stats_totals');
  expect(queries).toContain('CREATE TABLE IF NOT EXISTS settings');
});

test('reads the glasses of a day, starting from zero', async () => {
  // A day never saved has no row yet, which means no water drunk.
  mockDatabase.getFirstAsync.mockResolvedValueOnce({ glasses: 4 });
  expect(await loadWaterGlasses('2026-11-13')).toBe(4);
  expect(mockDatabase.getFirstAsync).toHaveBeenLastCalledWith(
    'SELECT glasses FROM water_days WHERE date = ?',
    ['2026-11-13'],
  );

  mockDatabase.getFirstAsync.mockResolvedValueOnce(null);
  expect(await loadWaterGlasses('2026-11-14')).toBe(0);
});

test('saves the glasses of a day', async () => {
  // Saving the same day again replaces its count instead of adding a row.
  await saveWaterGlasses('2026-11-13', 5);

  expect(mockDatabase.runAsync).toHaveBeenLastCalledWith(
    'INSERT OR REPLACE INTO water_days (date, glasses) VALUES (?, ?)',
    ['2026-11-13', 5],
  );
});

test('reads the reminder settings, keeping defaults for those never saved', async () => {
  // Only what was changed is in the table; the rest uses the defaults.
  mockDatabase.getAllAsync.mockResolvedValueOnce([
    { name: 'activityLeadMinutes', value: 'null' },
    { name: 'waterIntervalMinutes', value: '60' },
  ]);

  expect(await loadReminderSettings()).toEqual({
    activityLeadMinutes: null,
    waterIntervalMinutes: 60,
    waterStartMinutes: 540,
    waterEndMinutes: 1260,
  });
});

test('saves every reminder setting together', async () => {
  // One transaction, so a half saved change cannot happen.
  mockDatabase.runAsync.mockClear();
  mockDatabase.withTransactionAsync.mockClear();

  await saveReminderSettings({
    activityLeadMinutes: 30,
    waterIntervalMinutes: null,
    waterStartMinutes: 600,
    waterEndMinutes: 1200,
  });

  expect(mockDatabase.withTransactionAsync).toHaveBeenCalledTimes(1);
  expect(mockDatabase.runAsync).toHaveBeenCalledWith(
    'INSERT OR REPLACE INTO settings (name, value) VALUES (?, ?)',
    ['waterIntervalMinutes', 'null'],
  );
  expect(mockDatabase.runAsync).toHaveBeenCalledTimes(4);
});

test('deletes an activity by id', async () => {
  // Only the activity with that id is removed.
  await deleteActivity('1', { done: 0, skipped: 0, missed: 0 });

  expect(mockDatabase.runAsync).toHaveBeenLastCalledWith(
    'DELETE FROM activities WHERE id = ?',
    ['1'],
  );
});
