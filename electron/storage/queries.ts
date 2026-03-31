import { v4 as uuid } from 'uuid';
import { getDb } from './database';
import type { Person, ScrapedItem, WeeklyTopic, Platform, ViewFilter } from '../../src/types/index';

interface GetItemsOpts {
  personId?: string;
  platform?: Platform;
  filter?: ViewFilter;
  limit?: number;
  offset?: number;
}

interface AddPersonData {
  name: string;
  title?: string;
  platforms: Partial<Record<Platform, string>>;
  avatarColor: string;
}

function rowToPerson(row: any): Person {
  return {
    id: row.id,
    name: row.name,
    title: row.title || undefined,
    avatarColor: row.avatarColor,
    platforms: JSON.parse(row.platforms),
    isPreset: row.isPreset === 1,
    createdAt: row.createdAt,
  };
}

function rowToItem(row: any): ScrapedItem {
  return {
    id: row.id,
    platform: row.platform as Platform,
    personId: row.personId,
    originalText: row.originalText,
    translatedText: row.translatedText || undefined,
    url: row.url,
    publishedAt: row.publishedAt,
    scrapedAt: row.scrapedAt,
    metadata: JSON.parse(row.metadata || '{}'),
    topics: row.topics ? JSON.parse(row.topics) : undefined,
    isRead: row.isRead === 1,
    isStarred: row.isStarred === 1,
    translationStatus: row.translationStatus,
  };
}

export class Queries {
  getAllPersons(): Person[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM persons ORDER BY createdAt ASC').all();
    return rows.map(rowToPerson);
  }

  addPerson(data: AddPersonData): Person {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO persons (id, name, title, avatarColor, platforms, isPreset, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)'
    ).run(id, data.name, data.title || null, data.avatarColor, JSON.stringify(data.platforms), now);
    return {
      id,
      name: data.name,
      title: data.title,
      avatarColor: data.avatarColor,
      platforms: data.platforms,
      isPreset: false,
      createdAt: now,
    };
  }

  deletePerson(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM persons WHERE id = ?').run(id);
    // items cascade-deleted via FK
  }

  getItems(opts: GetItemsOpts): ScrapedItem[] {
    const db = getDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (opts.personId) {
      conditions.push('personId = ?');
      params.push(opts.personId);
    }
    if (opts.platform) {
      conditions.push('platform = ?');
      params.push(opts.platform);
    }
    if (opts.filter === 'starred') {
      conditions.push('isStarred = 1');
    } else if (opts.filter === 'papers') {
      conditions.push("platform = 'arxiv'");
    }

    let sql = 'SELECT * FROM items';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY publishedAt DESC';

    if (opts.limit) {
      sql += ' LIMIT ?';
      params.push(opts.limit);
    }
    if (opts.offset) {
      sql += ' OFFSET ?';
      params.push(opts.offset);
    }

    const rows = db.prepare(sql).all(...params);
    return rows.map(rowToItem);
  }

  upsertItems(items: ScrapedItem[]): void {
    const db = getDb();
    const insert = db.prepare(`
      INSERT OR IGNORE INTO items (id, platform, personId, originalText, translatedText, url, publishedAt, scrapedAt, metadata, topics, isRead, isStarred, translationStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction(() => {
      for (const item of items) {
        insert.run(
          item.id,
          item.platform,
          item.personId,
          item.originalText,
          item.translatedText || null,
          item.url,
          item.publishedAt,
          item.scrapedAt,
          JSON.stringify(item.metadata),
          item.topics ? JSON.stringify(item.topics) : null,
          item.isRead ? 1 : 0,
          item.isStarred ? 1 : 0,
          item.translationStatus,
        );
      }
    });
    insertAll();
  }

  toggleStar(id: string): void {
    const db = getDb();
    db.prepare('UPDATE items SET isStarred = CASE WHEN isStarred = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  }

  markRead(id: string): void {
    const db = getDb();
    db.prepare('UPDATE items SET isRead = 1 WHERE id = ?').run(id);
  }

  updateTranslation(id: string, translatedText: string, topics: string[]): void {
    const db = getDb();
    db.prepare(
      "UPDATE items SET translatedText = ?, topics = ?, translationStatus = 'done' WHERE id = ?"
    ).run(translatedText, JSON.stringify(topics), id);
  }

  getItemsNeedingTranslation(): ScrapedItem[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM items WHERE translationStatus IN ('pending', 'failed') ORDER BY publishedAt DESC").all();
    return rows.map(rowToItem);
  }

  getWeeklyTopics(weekStart?: string, personId?: string): WeeklyTopic[] {
    const db = getDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (weekStart) {
      conditions.push('weekStart = ?');
      params.push(weekStart);
    }
    if (personId) {
      conditions.push('personId = ?');
      params.push(personId);
    }

    let sql = 'SELECT * FROM weekly_topics';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map((row) => ({
      weekStart: row.weekStart,
      personId: row.personId,
      topics: JSON.parse(row.topics),
    }));
  }

  computeAndCacheWeeklyTopics(weekStart: string): void {
    const db = getDb();
    // Get all items in the week (7 days from weekStart) that have topics
    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = db.prepare(
      "SELECT topics FROM items WHERE publishedAt >= ? AND publishedAt < ? AND topics IS NOT NULL AND translationStatus = 'done'"
    ).all(weekStart, weekEnd) as { topics: string }[];

    // Aggregate topic counts
    const topicCounts = new Map<string, number>();
    for (const row of rows) {
      const topics: string[] = JSON.parse(row.topics);
      for (const t of topics) {
        topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      }
    }

    // Top 5
    const sorted = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    db.prepare(
      'INSERT OR REPLACE INTO weekly_topics (weekStart, personId, topics) VALUES (?, ?, ?)'
    ).run(weekStart, null, JSON.stringify(sorted));
  }
}
