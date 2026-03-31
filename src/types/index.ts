export type Platform = 'x' | 'github' | 'arxiv' | 'facebook';
export type TranslationStatus = 'pending' | 'done' | 'failed';
export type ViewFilter = 'all' | 'starred' | 'papers';
export type ScrapeInterval = '30m' | '1h' | '2h' | '6h';

export interface Person {
  id: string;
  name: string;
  title?: string;
  avatarColor: string;
  platforms: Partial<Record<Platform, string>>;
  isPreset: boolean;
  createdAt: string;
}

export interface ScrapedItem {
  id: string;
  platform: Platform;
  personId: string;
  originalText: string;
  translatedText?: string;
  url: string;
  publishedAt: string;
  scrapedAt: string;
  metadata: Record<string, any>;
  topics?: string[];
  isRead: boolean;
  isStarred: boolean;
  translationStatus: TranslationStatus;
}

export interface WeeklyTopic {
  weekStart: string;
  personId: string | null;
  topics: { name: string; count: number }[];
}

export interface AppSettings {
  deepseekApiKey: string;
  scrapeInterval: ScrapeInterval;
  proxyUrl?: string;
}
