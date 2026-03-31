import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { AppSettings } from '../../src/types';

const DEFAULTS: AppSettings = {
  deepseekApiKey: '',
  scrapeInterval: '2h',
};

function getPath(): string {
  return join(app.getPath('userData'), 'settings.json');
}

export function loadSettings(): AppSettings {
  const p = getPath();
  if (!existsSync(p)) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(p, 'utf-8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  writeFileSync(getPath(), JSON.stringify(merged, null, 2));
  return merged;
}
