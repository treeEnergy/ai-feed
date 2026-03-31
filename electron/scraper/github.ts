import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Person, ScrapedItem } from '../../src/types/index';
import { BaseScraper } from './base';
import { generateItemId, randomUA } from './utils';

export class GitHubScraper extends BaseScraper {
  platform = 'github' as const;

  async scrape(person: Person): Promise<ScrapedItem[]> {
    const username = person.platforms.github;
    if (!username) return [];

    return this.withRetry(async () => {
      await this.delay();
      const url = `https://github.com/${username}?tab=repositories&sort=updated`;
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': randomUA() },
        timeout: 15000,
      });
      return parseRepos(html, person.id);
    });
  }
}

export function parseRepos(html: string, personId: string): ScrapedItem[] {
  const $ = cheerio.load(html);
  const items: ScrapedItem[] = [];

  $('#user-repositories-list li').each((i, el) => {
    const $el = $(el);
    const repoLink = $el.find('a[itemprop="name codeRepository"]').first();
    const repoName = repoLink.text().trim();
    const repoHref = repoLink.attr('href') || '';
    const description = $el.find('p[itemprop="description"]').text().trim();
    const language = $el.find('[itemprop="programmingLanguage"]').text().trim();

    // Stars and forks from the link text
    const starsText = $el.find('a[href$="/stargazers"]').text().trim();
    const forksText = $el.find('a[href$="/forks"]').text().trim();
    const stars = parseInt(starsText.replace(/,/g, ''), 10) || 0;
    const forks = parseInt(forksText.replace(/,/g, ''), 10) || 0;

    const dateEl = $el.find('relative-time');
    const datetime = dateEl.attr('datetime') || new Date().toISOString();

    if (!repoName) return;

    const id = generateItemId('github', repoHref || `${personId}-${i}`);

    items.push({
      id,
      platform: 'github',
      personId,
      originalText: description || `Repository: ${repoName}`,
      url: repoHref.startsWith('http') ? repoHref : `https://github.com${repoHref}`,
      publishedAt: datetime,
      scrapedAt: new Date().toISOString(),
      metadata: { repoName, language, stars, forks },
      isRead: false,
      isStarred: false,
      translationStatus: 'pending',
    });
  });

  return items;
}
