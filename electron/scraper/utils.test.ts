import { describe, it, expect } from 'vitest';
import { generateItemId, randomUA, USER_AGENTS } from './utils';

describe('generateItemId', () => {
  it('is deterministic for same inputs', () => {
    const id1 = generateItemId('x', 'abc123');
    const id2 = generateItemId('x', 'abc123');
    expect(id1).toBe(id2);
  });

  it('returns 16-char hex string', () => {
    const id = generateItemId('x', 'test');
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('different inputs produce different IDs', () => {
    const id1 = generateItemId('x', 'abc');
    const id2 = generateItemId('x', 'def');
    const id3 = generateItemId('arxiv', 'abc');
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
  });
});

describe('randomUA', () => {
  it('returns a string from USER_AGENTS', () => {
    const ua = randomUA();
    expect(USER_AGENTS).toContain(ua);
  });

  it('USER_AGENTS has 5 entries', () => {
    expect(USER_AGENTS).toHaveLength(5);
  });
});
