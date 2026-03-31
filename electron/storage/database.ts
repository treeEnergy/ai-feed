import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

let db: BetterSqlite3.Database | null = null;

const AVATAR_COLORS = ['#141413', '#c6613f', '#5c7a6e', '#8b7355', '#6b5b73'];

const PRESET_PERSONS = [
  { name: 'Yann LeCun', platforms: { x: 'ylecun', facebook: 'yann.lecun', arxiv: 'Yann LeCun' } },
  { name: 'Andrej Karpathy', platforms: { x: 'karpathy', github: 'karpathy' } },
  { name: 'Jim Fan', platforms: { x: 'DrJimFan' } },
  { name: 'Ilya Sutskever', platforms: { x: 'iaborislavsky' } },
  { name: 'Demis Hassabis', platforms: { x: 'demaborislavsky' } },
  { name: 'Fei-Fei Li', platforms: { x: 'drfeifei', arxiv: 'Fei-Fei Li' } },
  { name: 'Geoffrey Hinton', platforms: { x: 'geoffreyhinton', arxiv: 'Geoffrey Hinton' } },
  { name: 'Andrew Ng', platforms: { x: 'AndrewYNg', facebook: 'andrew.ng.96' } },
  { name: 'Sam Altman', platforms: { x: 'sama' } },
  { name: 'Dario Amodei', platforms: { x: 'DarioAmodei' } },
];

export function initDatabase(dbPath: string): void {
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      avatarColor TEXT NOT NULL,
      platforms TEXT NOT NULL,
      isPreset INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      personId TEXT NOT NULL,
      originalText TEXT NOT NULL,
      translatedText TEXT,
      url TEXT NOT NULL,
      publishedAt TEXT NOT NULL,
      scrapedAt TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      topics TEXT,
      isRead INTEGER NOT NULL DEFAULT 0,
      isStarred INTEGER NOT NULL DEFAULT 0,
      translationStatus TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_topics (
      weekStart TEXT NOT NULL,
      personId TEXT,
      topics TEXT NOT NULL,
      PRIMARY KEY (weekStart, personId)
    );

    CREATE INDEX IF NOT EXISTS idx_items_person_date ON items(personId, publishedAt);
    CREATE INDEX IF NOT EXISTS idx_items_platform ON items(platform);
    CREATE INDEX IF NOT EXISTS idx_items_published ON items(publishedAt);
  `);

  // Seed preset persons if not already present
  const existingCount = db.prepare("SELECT COUNT(*) as cnt FROM persons WHERE isPreset = 1").get() as { cnt: number };
  if (existingCount.cnt === 0) {
    const insert = db.prepare(
      "INSERT INTO persons (id, name, title, avatarColor, platforms, isPreset, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)"
    );
    const now = new Date().toISOString();
    const insertAll = db.transaction(() => {
      PRESET_PERSONS.forEach((p, i) => {
        insert.run(uuid(), p.name, null, AVATAR_COLORS[i % AVATAR_COLORS.length], JSON.stringify(p.platforms), now);
      });
    });
    insertAll();
  }
}

export function getDb(): BetterSqlite3.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
