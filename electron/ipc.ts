import { ipcMain, shell } from 'electron';
import { Queries } from './storage/queries';
import { Scheduler } from './scheduler';
import { loadSettings, saveSettings } from './storage/settings';

export function registerIPCHandlers(queries: Queries, scheduler: Scheduler) {
  ipcMain.handle('items:getAll', (_e, opts) => queries.getItems(opts || {}));
  ipcMain.handle('items:markRead', (_e, { id }) => queries.markRead(id));
  ipcMain.handle('items:toggleStar', (_e, { id }) => queries.toggleStar(id));

  ipcMain.handle('persons:getAll', () => queries.getAllPersons());
  ipcMain.handle('persons:add', (_e, data) => queries.addPerson(data));
  ipcMain.handle('persons:delete', (_e, { id }) => queries.deletePerson(id));

  ipcMain.handle('settings:get', () => loadSettings());
  ipcMain.handle('settings:update', (_e, partial) => {
    const updated = saveSettings(partial);
    if (partial.deepseekApiKey) scheduler.updateApiKey(partial.deepseekApiKey);
    if (partial.scrapeInterval) {
      scheduler.stop();
      scheduler.start(partial.scrapeInterval);
    }
    return updated;
  });

  ipcMain.handle('scraper:runNow', async () => {
    await scheduler.run();
  });

  ipcMain.handle('weekly-topics:get', (_e, opts) =>
    queries.getWeeklyTopics(opts?.weekStart, opts?.personId)
  );

  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url));
}
