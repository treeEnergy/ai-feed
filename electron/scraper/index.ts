import type { Person, Platform, ScrapedItem } from '../../src/types/index';
import type { Scraper } from './base';
import { BrowserManager } from './browser';
import { ArxivScraper } from './arxiv';
import { GitHubScraper } from './github';
import { XScraper } from './x';
import { FacebookScraper } from './facebook';

export class ScraperEngine {
  private scrapers: Map<Platform, Scraper>;
  private browserManager: BrowserManager;

  constructor() {
    this.browserManager = new BrowserManager();

    this.scrapers = new Map<Platform, Scraper>([
      ['arxiv', new ArxivScraper()],
      ['github', new GitHubScraper()],
      ['x', new XScraper(this.browserManager)],
      ['facebook', new FacebookScraper(this.browserManager)],
    ]);
  }

  async scrapeAll(persons: Person[]): Promise<ScrapedItem[]> {
    const allItems: ScrapedItem[] = [];

    for (const person of persons) {
      const platforms = Object.keys(person.platforms) as Platform[];

      for (const platform of platforms) {
        const handle = person.platforms[platform];
        if (!handle) continue;

        const scraper = this.scrapers.get(platform);
        if (!scraper) continue;

        try {
          const items = await scraper.scrape(person);
          allItems.push(...items);
        } catch (err) {
          console.error(
            `Scraper error for ${person.name} on ${platform}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }

    return allItems;
  }

  async shutdown(): Promise<void> {
    await this.browserManager.close();
  }
}

export { BrowserManager } from './browser';
export { ArxivScraper } from './arxiv';
export { GitHubScraper } from './github';
export { XScraper } from './x';
export { FacebookScraper } from './facebook';
