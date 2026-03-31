import puppeteer, { Browser } from 'puppeteer-core';
import { existsSync } from 'fs';

const CHROME_PATHS_WIN = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export class BrowserManager {
  private browser: Browser | null = null;

  async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    const executablePath = this.findChromePath();
    this.browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720',
      ],
    });

    return this.browser;
  }

  private findChromePath(): string {
    for (const p of CHROME_PATHS_WIN) {
      if (existsSync(p)) {
        return p;
      }
    }
    throw new Error(
      'Could not find Chrome or Edge. Please install one of them or set the path manually.'
    );
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
