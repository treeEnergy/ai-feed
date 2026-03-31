import type { Browser, Page } from 'puppeteer-core';
import type { Person, ScrapedItem } from '../../src/types/index';
import { BaseScraper } from './base';
import { generateItemId } from './utils';
import type { BrowserManager } from './browser';

export interface RawTweet {
  text: string;
  timestamp: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
}

export class XScraper extends BaseScraper {
  platform = 'x' as const;
  private browserManager: BrowserManager;

  constructor(browserManager: BrowserManager) {
    super();
    this.browserManager = browserManager;
  }

  async scrape(person: Person): Promise<ScrapedItem[]> {
    const username = person.platforms.x;
    if (!username) return [];

    return this.withRetry(async () => {
      await this.delay();
      const browser = await this.browserManager.getBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(`https://x.com/${username}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 });

        const rawTweets = await page.evaluate(() => {
          const tweets: Array<{
            text: string;
            timestamp: string;
            url: string;
            likes: number;
            retweets: number;
            replies: number;
          }> = [];

          const tweetEls = document.querySelectorAll('[data-testid="tweet"]');
          tweetEls.forEach((el) => {
            if (tweets.length >= 20) return;

            const textEl = el.querySelector('[data-testid="tweetText"]');
            const text = textEl?.textContent || '';

            const timeEl = el.querySelector('time');
            const timestamp = timeEl?.getAttribute('datetime') || '';

            const linkEl = timeEl?.closest('a');
            const url = linkEl?.getAttribute('href') || '';

            const getMetric = (testId: string): number => {
              const metricEl = el.querySelector(`[data-testid="${testId}"]`);
              const val = metricEl?.textContent?.trim() || '0';
              return parseInt(val.replace(/,/g, ''), 10) || 0;
            };

            tweets.push({
              text,
              timestamp,
              url: url.startsWith('http') ? url : `https://x.com${url}`,
              likes: getMetric('like'),
              retweets: getMetric('retweet'),
              replies: getMetric('reply'),
            });
          });

          return tweets;
        });

        return rawTweets.map((raw) => toScrapedItem(raw, person.id));
      } finally {
        await page.close();
      }
    });
  }
}

export function toScrapedItem(raw: RawTweet, personId: string): ScrapedItem {
  const id = generateItemId('x', raw.url || `${personId}-${raw.timestamp}-${raw.text.slice(0, 50)}`);

  return {
    id,
    platform: 'x',
    personId,
    originalText: raw.text,
    url: raw.url,
    publishedAt: raw.timestamp || new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    metadata: {
      likes: raw.likes,
      retweets: raw.retweets,
      replies: raw.replies,
    },
    isRead: false,
    isStarred: false,
    translationStatus: 'pending',
  };
}
