import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { Activity } from '../calendar/activities';
import { ActivityStats, NO_ACTIVITY_STATS, WaterDay } from '../stats/stats';
import { ActivityRow, activityToRow, rowToActivity } from './activityRow';

const ACTIVITY_STATS_NAMES = ['done', 'skipped', 'missed'] as const;

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openAndPrepare(): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync('bloomora.db');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      start_at INTEGER NOT NULL,
      end_at INTEGER NOT NULL,
      color TEXT NOT NULL,
      repeat_days TEXT NOT NULL,
      completed_dates TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS water_days (
      date TEXT PRIMARY KEY NOT NULL,
      glasses INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stats_totals (
      name TEXT PRIMARY KEY NOT NULL,
      value INTEGER NOT NULL
    );
  `);

  // user_version records which changes this database on the phone already has.
  const version = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );

  if (!version || version.user_version < 1) {
    await database.execAsync(`
      BEGIN;
      ALTER TABLE activities ADD COLUMN skipped_dates TEXT NOT NULL DEFAULT '[]';
      PRAGMA user_version = 1;
      COMMIT;
    `);
  }

  return database;
}

function getDatabase(): Promise<SQLiteDatabase> {
  databasePromise ??= openAndPrepare();

  return databasePromise;
}

export async function loadActivities(): Promise<Activity[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ActivityRow>(
    'SELECT * FROM activities',
  );

  return rows.map(rowToActivity);
}

export async function saveActivity(activity: Activity): Promise<void> {
  const database = await getDatabase();
  const row = activityToRow(activity);

  await database.runAsync(
    `INSERT OR REPLACE INTO activities
      (id, title, start_at, end_at, color, repeat_days, completed_dates, skipped_dates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.title,
      row.start_at,
      row.end_at,
      row.color,
      row.repeat_days,
      row.completed_dates,
      row.skipped_dates,
    ],
  );
}

// Deleted activities leave their past days here, so the stats keep them.
async function keepActivityStats(
  database: SQLiteDatabase,
  stats: ActivityStats,
): Promise<void> {
  for (const name of ACTIVITY_STATS_NAMES) {
    await database.runAsync(
      `INSERT INTO stats_totals (name, value) VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET value = value + excluded.value`,
      [name, stats[name]],
    );
  }
}

export async function deleteActivity(
  id: string,
  pastStats: ActivityStats,
): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await keepActivityStats(database, pastStats);
    await database.runAsync('DELETE FROM activities WHERE id = ?', [id]);
  });
}

export async function deleteActivities(
  ids: string[],
  pastStats: ActivityStats,
): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await keepActivityStats(database, pastStats);
    for (const id of ids) {
      await database.runAsync('DELETE FROM activities WHERE id = ?', [id]);
    }
  });

  // SQLite keeps the freed space in its file until it is asked to give it back.
  await database.execAsync('VACUUM');
}

// A day with no row has had no water yet, so each day starts from zero.
export async function loadWaterGlasses(dateKey: string): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ glasses: number }>(
    'SELECT glasses FROM water_days WHERE date = ?',
    [dateKey],
  );

  return row?.glasses ?? 0;
}

export async function saveWaterGlasses(
  dateKey: string,
  glasses: number,
): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    'INSERT OR REPLACE INTO water_days (date, glasses) VALUES (?, ?)',
    [dateKey, glasses],
  );
}

export async function loadWaterDays(): Promise<WaterDay[]> {
  const database = await getDatabase();

  return database.getAllAsync<WaterDay>(
    'SELECT date, glasses FROM water_days ORDER BY date',
  );
}

export async function loadKeptActivityStats(): Promise<ActivityStats> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ name: string; value: number }>(
    'SELECT name, value FROM stats_totals',
  );
  const stats = { ...NO_ACTIVITY_STATS };

  for (const { name, value } of rows) {
    if (name in stats) stats[name as keyof ActivityStats] = value;
  }

  return stats;
}

export async function getDatabaseSize(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ size: number }>(
    'SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()',
  );

  return result?.size ?? 0;
}
