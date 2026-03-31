import cron from 'node-cron';
import { ScraperEngine } from './scraper';
import { DeepSeekTranslator } from './translator/deepseek';
import { Queries } from './storage/queries';
import { BrowserWindow } from 'electron';
import { ScrapeInterval } from '../src/types';

const INTERVAL_CRON: Record<ScrapeInterval, string> = {
  '30m': '*/30 * * * *',
  '1h': '0 * * * *',
  '2h': '0 */2 * * *',
  '6h': '0 */6 * * *',
};

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private scraperEngine: ScraperEngine;
  private translator: DeepSeekTranslator | null = null;
  private queries: Queries;
  private mainWindow: BrowserWindow | null = null;

  constructor(queries: Queries, apiKey?: string) {
    this.scraperEngine = new ScraperEngine();
    this.queries = queries;
    if (apiKey) this.translator = new DeepSeekTranslator(apiKey);
  }

  setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  updateApiKey(apiKey: string) {
    this.translator = new DeepSeekTranslator(apiKey);
  }

  start(interval: ScrapeInterval = '2h') {
    this.stop();
    this.task = cron.schedule(INTERVAL_CRON[interval], () => this.run());
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async run(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      this.notify('scrape:status', 'running');
      console.log('[Scheduler] Starting scrape run...');

      const persons = this.queries.getAllPersons().filter(p => Object.keys(p.platforms).length > 0);
      console.log(`[Scheduler] Found ${persons.length} persons to scrape`);

      const items = await this.scraperEngine.scrapeAll(persons);
      console.log(`[Scheduler] Scraped ${items.length} items total`);

      this.queries.upsertItems(items);
      console.log('[Scheduler] Items saved to database');

      if (this.translator) {
        const pending = this.queries.getItemsNeedingTranslation();
        console.log(`[Scheduler] ${pending.length} items need translation`);
        if (pending.length > 0) {
          const translated = await this.translator.translateBatch(pending);
          for (const item of translated) {
            if (item.translationStatus === 'done' && item.translatedText) {
              this.queries.updateTranslation(item.id, item.translatedText, item.topics || []);
            }
          }
          console.log('[Scheduler] Translation complete');
        }
      } else {
        console.log('[Scheduler] No translator configured (missing API key?)');
      }

      const monday = this.getCurrentMonday();
      this.queries.computeAndCacheWeeklyTopics(monday);

      this.notify('scrape:status', 'idle');
      this.notify('items:updated', null);
      console.log('[Scheduler] Run complete');
    } catch (e) {
      console.error('Scheduler run failed:', e);
      this.notify('scrape:status', 'error');
    } finally {
      this.isRunning = false;
    }
  }

  private notify(channel: string, data: any) {
    this.mainWindow?.webContents.send(channel, data);
  }

  private getCurrentMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  async shutdown() {
    this.stop();
    await this.scraperEngine.shutdown();
  }
}
