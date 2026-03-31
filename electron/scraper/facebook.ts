import type { Person, ScrapedItem } from '../../src/types/index';
import { BaseScraper } from './base';
import { generateItemId } from './utils';
import type { BrowserManager } from './browser';

export class FacebookScraper extends BaseScraper {
  platform = 'facebook' as const;
  private browserManager: BrowserManager;

  constructor(browserManager: BrowserManager) {
    super();
    this.browserManager = browserManager;
  }

  async scrape(person: Person): Promise<ScrapedItem[]> {
    const username = person.platforms.facebook;
    if (!username) return [];

    try {
      return await this.withRetry(async () => {
        await this.delay();
        const browser = await this.browserManager.getBrowser();
        const page = await browser.newPage();

        try {
          await page.goto(`https://www.facebook.com/${username}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });

          // Wait for posts to load
          await page.waitForSelector('[data-ad-comet-preview="message"]', { timeout: 10000 });

          const rawPosts = await page.evaluate(() => {
            const posts: Array<{ text: string; url: string }> = [];
            const postEls = document.querySelectorAll('[data-ad-comet-preview="message"]');

            postEls.forEach((el) => {
              if (posts.length >= 20) return;
              const text = el.textContent || '';
              if (text.trim()) {
                // Try to find a permalink
                const linkEl = el.closest('[role="article"]')?.querySelector('a[href*="/posts/"]');
                const url = linkEl?.getAttribute('href') || `https://www.facebook.com/${window.location.pathname}`;
                posts.push({ text: text.trim(), url });
              }
            });

            return posts;
          });

          return rawPosts.map((post, i) => {
            const id = generateItemId('facebook', `${username}-${i}-${post.text.slice(0, 50)}`);
            return {
              id,
              platform: 'facebook' as const,
              personId: person.id,
              originalText: post.text,
              url: post.url,
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString(),
              metadata: {},
              isRead: false,
              isStarred: false,
              translationStatus: 'pending' as const,
            };
          });
        } finally {
          await page.close();
        }
      });
    } catch (err) {
      // Graceful degradation: on failure return empty array
      console.warn(`Facebook scraper failed for ${username}:`, err);
      return [];
    }
  }
}
