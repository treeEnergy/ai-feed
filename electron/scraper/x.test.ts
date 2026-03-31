import { describe, it, expect } from 'vitest';
import { toScrapedItem, RawTweet } from './x';

describe('X toScrapedItem', () => {
  const baseTweet: RawTweet = {
    text: 'Just published a new paper on transformer architectures!',
    timestamp: '2024-06-15T14:30:00.000Z',
    url: 'https://x.com/researcher/status/1234567890',
    likes: 42,
    retweets: 15,
    replies: 7,
  };

  it('maps text to originalText', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.originalText).toBe('Just published a new paper on transformer architectures!');
  });

  it('sets platform to x', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.platform).toBe('x');
  });

  it('preserves the URL', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.url).toBe('https://x.com/researcher/status/1234567890');
  });

  it('preserves the timestamp as publishedAt', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.publishedAt).toBe('2024-06-15T14:30:00.000Z');
  });

  it('includes likes, retweets, replies in metadata', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.metadata.likes).toBe(42);
    expect(item.metadata.retweets).toBe(15);
    expect(item.metadata.replies).toBe(7);
  });

  it('sets personId correctly', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.personId).toBe('person-3');
  });

  it('generates deterministic IDs from URL', () => {
    const item1 = toScrapedItem(baseTweet, 'person-3');
    const item2 = toScrapedItem(baseTweet, 'person-3');
    expect(item1.id).toBe(item2.id);
  });

  it('generates different IDs for different tweets', () => {
    const tweet2 = { ...baseTweet, url: 'https://x.com/researcher/status/9999999' };
    const item1 = toScrapedItem(baseTweet, 'person-3');
    const item2 = toScrapedItem(tweet2, 'person-3');
    expect(item1.id).not.toBe(item2.id);
  });

  it('generates a 16-char hex ID', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('sets default values for isRead, isStarred, translationStatus', () => {
    const item = toScrapedItem(baseTweet, 'person-3');
    expect(item.isRead).toBe(false);
    expect(item.isStarred).toBe(false);
    expect(item.translationStatus).toBe('pending');
  });

  it('handles tweet with zero engagement', () => {
    const quietTweet: RawTweet = {
      text: 'Hello world',
      timestamp: '2024-01-01T00:00:00.000Z',
      url: 'https://x.com/user/status/111',
      likes: 0,
      retweets: 0,
      replies: 0,
    };
    const item = toScrapedItem(quietTweet, 'person-3');
    expect(item.metadata.likes).toBe(0);
    expect(item.metadata.retweets).toBe(0);
    expect(item.metadata.replies).toBe(0);
  });

  it('handles empty timestamp by using current time', () => {
    const noTimeTweet: RawTweet = {
      ...baseTweet,
      timestamp: '',
    };
    const item = toScrapedItem(noTimeTweet, 'person-3');
    // Should be a valid ISO date string (falls back to now)
    expect(new Date(item.publishedAt).getTime()).not.toBeNaN();
  });
});
