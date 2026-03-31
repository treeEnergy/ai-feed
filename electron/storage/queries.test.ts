import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, getDb, closeDb } from './database';
import { Queries } from './queries';
import fs from 'fs';
import path from 'path';
import os from 'os';

function tempDbPath() {
  return path.join(os.tmpdir(), `test-q-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
}

describe('Queries', () => {
  let dbPath: string;
  let q: Queries;

  beforeEach(() => {
    dbPath = tempDbPath();
    initDatabase(dbPath);
    q = new Queries();
  });

  afterEach(() => {
    closeDb();
    try { fs.unlinkSync(dbPath); } catch {}
    try { fs.unlinkSync(dbPath + '-wal'); } catch {}
    try { fs.unlinkSync(dbPath + '-shm'); } catch {}
  });

  describe('getAllPersons', () => {
    it('returns 10 preset persons with parsed platforms', () => {
      const persons = q.getAllPersons();
      expect(persons).toHaveLength(10);
      expect(persons[0].platforms).toBeTypeOf('object');
      expect(persons[0].isPreset).toBe(true);
    });
  });

  describe('addPerson / deletePerson', () => {
    it('adds a new person and returns it', () => {
      const p = q.addPerson({ name: 'Test User', platforms: { x: 'testuser' }, avatarColor: '#ff0000' });
      expect(p.id).toBeDefined();
      expect(p.name).toBe('Test User');
      expect(p.isPreset).toBe(false);
      const all = q.getAllPersons();
      expect(all).toHaveLength(11);
    });

    it('deletes person and their items', () => {
      const p = q.addPerson({ name: 'ToDelete', platforms: { x: 'del' }, avatarColor: '#000' });
      q.upsertItems([{
        id: 'item1',
        platform: 'x',
        personId: p.id,
        originalText: 'hello',
        url: 'http://example.com',
        publishedAt: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
        metadata: {},
        isRead: false,
        isStarred: false,
        translationStatus: 'pending',
      }]);
      q.deletePerson(p.id);
      expect(q.getAllPersons()).toHaveLength(10);
      expect(q.getItems({ personId: p.id })).toHaveLength(0);
    });
  });

  describe('upsertItems and getItems', () => {
    let personId: string;

    beforeEach(() => {
      const persons = q.getAllPersons();
      personId = persons[0].id;
    });

    it('inserts and retrieves items', () => {
      q.upsertItems([{
        id: 'a1',
        platform: 'x',
        personId,
        originalText: 'Post 1',
        url: 'http://x.com/1',
        publishedAt: '2026-01-01T00:00:00Z',
        scrapedAt: '2026-01-01T01:00:00Z',
        metadata: { likes: 10 },
        isRead: false,
        isStarred: false,
        translationStatus: 'pending',
      }]);
      const items = q.getItems({ personId });
      expect(items).toHaveLength(1);
      expect(items[0].originalText).toBe('Post 1');
      expect(items[0].metadata).toEqual({ likes: 10 });
    });

    it('deduplicates on same id', () => {
      const item = {
        id: 'dup1',
        platform: 'x' as const,
        personId,
        originalText: 'Original',
        url: 'http://x.com/dup',
        publishedAt: '2026-01-01T00:00:00Z',
        scrapedAt: '2026-01-01T01:00:00Z',
        metadata: {},
        isRead: false,
        isStarred: false,
        translationStatus: 'pending' as const,
      };
      q.upsertItems([item]);
      q.upsertItems([{ ...item, originalText: 'Changed' }]);
      const items = q.getItems({ personId });
      expect(items).toHaveLength(1);
      expect(items[0].originalText).toBe('Original'); // INSERT OR IGNORE keeps first
    });

    it('filters by person', () => {
      const persons = q.getAllPersons();
      const p1 = persons[0].id;
      const p2 = persons[1].id;
      q.upsertItems([
        { id: 'fp1', platform: 'x', personId: p1, originalText: 'A', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
        { id: 'fp2', platform: 'x', personId: p2, originalText: 'B', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
      ]);
      expect(q.getItems({ personId: p1 })).toHaveLength(1);
      expect(q.getItems({ personId: p2 })).toHaveLength(1);
    });

    it('filters by starred', () => {
      q.upsertItems([
        { id: 's1', platform: 'x', personId, originalText: 'A', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
        { id: 's2', platform: 'x', personId, originalText: 'B', url: 'u', publishedAt: '2026-01-02T00:00:00Z', scrapedAt: '2026-01-02T00:00:00Z', metadata: {}, isRead: false, isStarred: true, translationStatus: 'pending' },
      ]);
      const starred = q.getItems({ filter: 'starred' });
      expect(starred).toHaveLength(1);
      expect(starred[0].id).toBe('s2');
    });

    it('filters papers (arxiv)', () => {
      q.upsertItems([
        { id: 'px1', platform: 'x', personId, originalText: 'tweet', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
        { id: 'pa1', platform: 'arxiv', personId, originalText: 'paper', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
      ]);
      const papers = q.getItems({ filter: 'papers' });
      expect(papers).toHaveLength(1);
      expect(papers[0].platform).toBe('arxiv');
    });
  });

  describe('toggleStar', () => {
    it('flips isStarred', () => {
      const personId = q.getAllPersons()[0].id;
      q.upsertItems([{
        id: 'ts1', platform: 'x', personId, originalText: 'A', url: 'u',
        publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z',
        metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending',
      }]);
      q.toggleStar('ts1');
      expect(q.getItems({})[0].isStarred).toBe(true);
      q.toggleStar('ts1');
      expect(q.getItems({})[0].isStarred).toBe(false);
    });
  });

  describe('markRead', () => {
    it('sets isRead to true', () => {
      const personId = q.getAllPersons()[0].id;
      q.upsertItems([{
        id: 'mr1', platform: 'x', personId, originalText: 'A', url: 'u',
        publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z',
        metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending',
      }]);
      q.markRead('mr1');
      expect(q.getItems({})[0].isRead).toBe(true);
    });
  });

  describe('updateTranslation', () => {
    it('updates translatedText, topics, and status', () => {
      const personId = q.getAllPersons()[0].id;
      q.upsertItems([{
        id: 'ut1', platform: 'x', personId, originalText: 'Hello', url: 'u',
        publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z',
        metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending',
      }]);
      q.updateTranslation('ut1', '你好', ['greeting', 'test']);
      const item = q.getItems({})[0];
      expect(item.translatedText).toBe('你好');
      expect(item.topics).toEqual(['greeting', 'test']);
      expect(item.translationStatus).toBe('done');
    });
  });

  describe('getItemsNeedingTranslation', () => {
    it('returns only pending items', () => {
      const personId = q.getAllPersons()[0].id;
      q.upsertItems([
        { id: 'nt1', platform: 'x', personId, originalText: 'A', url: 'u', publishedAt: '2026-01-01T00:00:00Z', scrapedAt: '2026-01-01T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
        { id: 'nt2', platform: 'x', personId, originalText: 'B', url: 'u', publishedAt: '2026-01-02T00:00:00Z', scrapedAt: '2026-01-02T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
      ]);
      q.updateTranslation('nt1', 'translated', ['t']);
      const pending = q.getItemsNeedingTranslation();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('nt2');
    });
  });

  describe('weeklyTopics', () => {
    it('computes and caches weekly topics', () => {
      const personId = q.getAllPersons()[0].id;
      q.upsertItems([
        { id: 'wt1', platform: 'x', personId, originalText: 'A', url: 'u', publishedAt: '2026-01-05T00:00:00Z', scrapedAt: '2026-01-05T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
        { id: 'wt2', platform: 'x', personId, originalText: 'B', url: 'u', publishedAt: '2026-01-06T00:00:00Z', scrapedAt: '2026-01-06T00:00:00Z', metadata: {}, isRead: false, isStarred: false, translationStatus: 'pending' },
      ]);
      // Manually set topics on items
      q.updateTranslation('wt1', 'a', ['AI', 'safety', 'research']);
      q.updateTranslation('wt2', 'b', ['AI', 'LLM']);

      q.computeAndCacheWeeklyTopics('2026-01-05');
      const topics = q.getWeeklyTopics('2026-01-05');
      expect(topics).toHaveLength(1);
      expect(topics[0].topics[0].name).toBe('AI');
      expect(topics[0].topics[0].count).toBe(2);
    });
  });
});
