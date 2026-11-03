import { Activity } from '../src/calendar/activities';
import {
  deleteActivities,
  deleteActivity,
  getDatabaseSize,
  loadActivities,
  saveActivity,
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

test('deletes old activities together and frees their space', async () => {
  // All the deletions succeed or fail together, then the file gets smaller.
  mockDatabase.runAsync.mockClear();

  await deleteActivities(['1', '2']);

  expect(mockDatabase.withTransactionAsync).toHaveBeenCalledTimes(1);
  expect(mockDatabase.runAsync).toHaveBeenCalledTimes(2);
  expect(mockDatabase.execAsync).toHaveBeenLastCalledWith('VACUUM');
});

test('reads the size of the database', async () => {
  // This is the space shown in the settings.
  mockDatabase.getFirstAsync.mockResolvedValue({ size: 8192 });

  expect(await getDatabaseSize()).toBe(8192);
});

test('deletes an activity by id', async () => {
  // Only the activity with that id is removed.
  await deleteActivity('1');

  expect(mockDatabase.runAsync).toHaveBeenLastCalledWith(
    'DELETE FROM activities WHERE id = ?',
    ['1'],
  );
});
