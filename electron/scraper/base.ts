import type { Person, ScrapedItem } from '../../src/types/index';
import { randomDelay } from './utils';

export interface Scraper {
  platform: string;
  scrape(person: Person): Promise<ScrapedItem[]>;
}

export abstract class BaseScraper implements Scraper {
  abstract platform: string;
  abstract scrape(person: Person): Promise<ScrapedItem[]>;

  protected async delay(): Promise<void> {
    await randomDelay();
  }

  protected async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s, ...
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
    throw lastError;
  }
}
