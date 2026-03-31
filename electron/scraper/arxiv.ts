import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Person, ScrapedItem } from '../../src/types/index';
import { BaseScraper } from './base';
import { generateItemId, randomUA } from './utils';

export class ArxivScraper extends BaseScraper {
  platform = 'arxiv' as const;

  async scrape(person: Person): Promise<ScrapedItem[]> {
    const query = person.platforms.arxiv;
    if (!query) return [];

    return this.withRetry(async () => {
      await this.delay();
      const url = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=author&order=-announced_date_first`;
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': randomUA() },
        timeout: 15000,
      });
      return parseResults(html, person.id);
    });
  }
}

export function parseResults(html: string, personId: string): ScrapedItem[] {
  const $ = cheerio.load(html);
  const items: ScrapedItem[] = [];

  $('li.arxiv-result').each((i, el) => {
    if (items.length >= 10) return false;

    const $el = $(el);
    const title = $el.find('p.title').text().trim();
    const abstract = $el.find('span.abstract-full').text().replace(/\s*Less$/, '').trim();
    const paperUrl = $el.find('p.list-title a').first().attr('href') || '';
    const dateText = $el.find('p.is-size-7').text().trim();

    // Extract arxiv ID from the URL (e.g., https://arxiv.org/abs/2301.12345)
    const arxivIdMatch = paperUrl.match(/\/(?:abs|pdf)\/(.+?)(?:\?|$)/);
    const arxivId = arxivIdMatch ? arxivIdMatch[1] : paperUrl;

    const id = generateItemId('arxiv', arxivId || `${personId}-${i}`);

    items.push({
      id,
      platform: 'arxiv',
      personId,
      originalText: title && abstract ? `${title}\n\n${abstract}` : abstract || title,
      url: paperUrl.startsWith('http') ? paperUrl : `https://arxiv.org${paperUrl}`,
      publishedAt: parseArxivDate(dateText),
      scrapedAt: new Date().toISOString(),
      metadata: { arxivId, title },
      isRead: false,
      isStarred: false,
      translationStatus: 'pending',
    });
  });

  return items;
}

function parseArxivDate(text: string): string {
  // Try to extract a date like "Submitted 15 January, 2025" or similar
  const match = text.match(/(\d{1,2}\s+\w+,?\s+\d{4})/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}
