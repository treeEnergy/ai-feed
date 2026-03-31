import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initDatabase } from './storage/database';
import { Queries } from './storage/queries';
import { Scheduler } from './scheduler';
import { registerIPCHandlers } from './ipc';
import { loadSettings } from './storage/settings';

let mainWindow: BrowserWindow | null = null;
let scheduler: Scheduler | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#faf9f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const dbPath = path.join(app.getPath('userData'), 'ai-feed.db');
  initDatabase(dbPath);
  const queries = new Queries();

  const settings = loadSettings();
  scheduler = new Scheduler(queries, settings.deepseekApiKey || undefined);
  scheduler.setMainWindow(mainWindow);
  if (settings.deepseekApiKey) scheduler.start(settings.scrapeInterval);

  registerIPCHandlers(queries, scheduler);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', async () => {
  await scheduler?.shutdown();
});
