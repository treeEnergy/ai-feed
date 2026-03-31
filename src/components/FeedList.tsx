import { useMemo } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { FeedCard } from './FeedCard';
import { RepoCard } from './RepoCard';
import type { ScrapedItem } from '../types';

function dateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate >= today) return '今天';
  if (itemDate >= yesterday) return '昨天';
  return '更早';
}

export function FeedList() {
  const { items, persons, isLoading } = useFeedStore();

  const personMap = useMemo(() => {
    const m = new Map<string, (typeof persons)[0]>();
    for (const p of persons) m.set(p.id, p);
    return m;
  }, [persons]);

  const grouped = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const groups: { label: string; items: ScrapedItem[] }[] = [];
    const order = ['今天', '昨天', '更早'];
    const map = new Map<string, ScrapedItem[]>();

    for (const item of sorted) {
      const g = dateGroup(item.publishedAt);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }

    for (const label of order) {
      const arr = map.get(label);
      if (arr && arr.length > 0) groups.push({ label, items: arr });
    }
    return groups;
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(20,20,19,0.12)', borderTopColor: '#c6613f' }}
          />
          <span className="text-sm" style={{ color: '#878680' }}>
            加载中...
          </span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl" style={{ color: '#b0aea5' }}>
            ○
          </span>
          <span className="text-sm" style={{ color: '#878680' }}>
            暂无动态
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {grouped.map((group) => (
        <div key={group.label} className="mb-6">
          {/* Date divider */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#b0aea5' }}
            >
              {group.label}
            </span>
            <div
              className="flex-1"
              style={{ height: 1, backgroundColor: 'rgba(20,20,19,0.06)' }}
            />
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {group.items.map((item) => {
              const person = personMap.get(item.personId);
              if (item.platform === 'github') {
                return <RepoCard key={item.id} item={item} person={person} />;
              }
              return <FeedCard key={item.id} item={item} person={person} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
