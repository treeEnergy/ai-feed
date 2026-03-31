import { describe, it, expect, afterEach } from 'vitest';
import { initDatabase, getDb, closeDb } from './database';
import fs from 'fs';
import path from 'path';
import os from 'os';

function tempDbPath() {
  return path.join(os.tmpdir(), `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
}

describe('database initialization', () => {
  let dbPath: string;

  afterEach(() => {
    closeDb();
    if (dbPath && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      // clean up WAL/SHM files
      try { fs.unlinkSync(dbPath + '-wal'); } catch {}
      try { fs.unlinkSync(dbPath + '-shm'); } catch {}
    }
  });

  it('creates persons table', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='persons'").all();
    expect(tables).toHaveLength(1);
  });

  it('creates items table with all required columns', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const columns = db.prepare("PRAGMA table_info(items)").all() as { name: string }[];
    const colNames = columns.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('platform');
    expect(colNames).toContain('personId');
    expect(colNames).toContain('originalText');
    expect(colNames).toContain('translatedText');
    expect(colNames).toContain('url');
    expect(colNames).toContain('publishedAt');
    expect(colNames).toContain('scrapedAt');
    expect(colNames).toContain('metadata');
    expect(colNames).toContain('topics');
    expect(colNames).toContain('isRead');
    expect(colNames).toContain('isStarred');
    expect(colNames).toContain('translationStatus');
  });

  it('creates weekly_topics table', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_topics'").all();
    expect(tables).toHaveLength(1);
  });

  it('seeds 10 preset persons', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const persons = db.prepare("SELECT * FROM persons WHERE isPreset = 1").all();
    expect(persons).toHaveLength(10);
  });

  it('preset persons have correct platform data as JSON', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const yann = db.prepare("SELECT * FROM persons WHERE name = 'Yann LeCun'").get() as any;
    expect(yann).toBeDefined();
    const platforms = JSON.parse(yann.platforms);
    expect(platforms.x).toBe('ylecun');
    expect(platforms.facebook).toBe('yann.lecun');
    expect(platforms.arxiv).toBe('Yann LeCun');
  });

  it('creates indices on items table', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const indices = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='items'").all() as { name: string }[];
    const indexNames = indices.map((i) => i.name);
    expect(indexNames).toContain('idx_items_person_date');
    expect(indexNames).toContain('idx_items_platform');
    expect(indexNames).toContain('idx_items_published');
  });

  it('enables WAL mode', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    const db = getDb();
    const result = db.prepare("PRAGMA journal_mode").get() as { journal_mode: string };
    expect(result.journal_mode).toBe('wal');
  });

  it('does not duplicate seeds on re-init', () => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    closeDb();
    initDatabase(dbPath);
    const db = getDb();
    const persons = db.prepare("SELECT * FROM persons WHERE isPreset = 1").all();
    expect(persons).toHaveLength(10);
  });
});
