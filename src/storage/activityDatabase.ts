import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { Activity } from '../calendar/activities';
import { ActivityRow, activityToRow, rowToActivity } from './activityRow';

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

export async function deleteActivity(id: string): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    'DELETE FROM activities WHERE id = ?', [id]
  );
}

export async function deleteActivities(ids: string[]): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    for (const id of ids) {
      await database.runAsync('DELETE FROM activities WHERE id = ?', [id]);
    }
  });

  // SQLite keeps the freed space in its file until it is asked to give it back.
  await database.execAsync('VACUUM');
}

export async function getDatabaseSize(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ size: number }>(
    'SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()',
  );

  return result?.size ?? 0;
}
