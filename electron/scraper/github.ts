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
      const repos = parseRepos(html, person.id);

      // Fetch README for top 5 repos to get richer content
      const enriched: ScrapedItem[] = [];
      for (const repo of repos.slice(0, 5)) {
        try {
          const readmeText = await this.fetchReadme(username, repo.metadata.repoName);
          if (readmeText) {
            repo.originalText = readmeText;
            repo.metadata.hasReadme = true;
          }
        } catch {
          // Keep original description
        }
        enriched.push(repo);
      }
      // Add remaining repos without README fetch
      enriched.push(...repos.slice(5));
      return enriched;
    });
  }

  private async fetchReadme(username: string, repoName: string): Promise<string | null> {
    try {
      // Use GitHub raw API to get README content
      const { data } = await axios.get(
        `https://raw.githubusercontent.com/${username}/${repoName}/HEAD/README.md`,
        { headers: { 'User-Agent': randomUA() }, timeout: 10000 }
      );
      if (typeof data === 'string' && data.length > 20) {
        // Strip markdown formatting, keep first 1500 chars for translation
        const cleaned = data
          .replace(/<!--[\s\S]*?-->/g, '')      // HTML comments
          .replace(/!\[.*?\]\(.*?\)/g, '')       // images
          .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links -> text
          .replace(/#{1,6}\s/g, '')              // headings
          .replace(/[`*_~]/g, '')                // formatting
          .replace(/\n{3,}/g, '\n\n')            // multiple newlines
          .trim();
        return cleaned.substring(0, 1500);
      }
    } catch {
      // README not found or fetch failed
    }
    return null;
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
      metadata: { repoName, language, stars, forks, description },
      isRead: false,
      isStarred: false,
      translationStatus: 'pending',
    });
  });

  return items;
}
