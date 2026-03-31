import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { WeeklyTimeline } from './components/WeeklyTimeline';
import { FilterBar } from './components/FilterBar';
import { FeedList } from './components/FeedList';
import { Settings } from './components/Settings';
import { AddPersonDialog } from './components/AddPersonDialog';
import { useFeedStore } from './stores/feedStore';
import { useIPCListener } from './hooks/useIPC';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const { fetchPersons, fetchItems, fetchWeeklyTopics, setScrapeStatus } = useFeedStore();

  useEffect(() => {
    fetchPersons();
    fetchItems();
    fetchWeeklyTopics();
  }, []);

  useIPCListener(
    'items:updated',
    useCallback(() => {
      fetchItems();
      fetchWeeklyTopics();
    }, [])
  );

  useIPCListener(
    'scrape:status',
    useCallback((status: string) => {
      setScrapeStatus(status as 'running' | 'idle' | 'error');
    }, [])
  );

  return (
    <div className="flex h-screen bg-[#faf9f5] font-sans text-[#141413]">
      <Sidebar
        onAddPerson={() => setShowAddPerson(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f3ec]">
        {showSettings ? (
          <Settings onClose={() => setShowSettings(false)} />
        ) : (
          <>
            <WeeklyTimeline />
            <FilterBar />
            <FeedList />
          </>
        )}
      </main>
      {showAddPerson && <AddPersonDialog onClose={() => setShowAddPerson(false)} />}
    </div>
  );
}
