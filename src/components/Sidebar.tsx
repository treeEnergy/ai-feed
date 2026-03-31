import { useFeedStore } from '../stores/feedStore';
import type { ViewFilter } from '../types';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

interface SidebarProps {
  onAddPerson: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ onAddPerson, onOpenSettings }: SidebarProps) {
  const {
    persons,
    items,
    selectedPersonId,
    viewFilter,
    scrapeStatus,
    lastSyncTime,
    selectPerson,
    setViewFilter,
  } = useFeedStore();

  const unreadCount = items.filter((i) => !i.isRead).length;

  const navItems: { label: string; icon: string; filter: ViewFilter }[] = [
    { label: '全部动态', icon: '◉', filter: 'all' },
    { label: '收藏', icon: '☆', filter: 'starred' },
    { label: '论文追踪', icon: '◈', filter: 'papers' },
  ];

  const isNavActive = (filter: ViewFilter) =>
    viewFilter === filter && selectedPersonId === null;

  return (
    <aside
      className="flex flex-col h-full border-r shrink-0"
      style={{
        width: 272,
        backgroundColor: '#faf9f5',
        borderColor: 'rgba(20,20,19,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div
          className="flex items-center justify-center rounded-lg font-bold text-white text-sm"
          style={{ width: 32, height: 32, backgroundColor: '#141413' }}
        >
          AI
        </div>
        <span className="font-serif text-xl font-semibold" style={{ color: '#141413' }}>
          AI Feed
        </span>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: '#f0eee6',
            color: '#b0aea5',
          }}
        >
          <span>⌕</span>
          <span>搜索...</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pb-2">
        {navItems.map((item) => (
          <button
            key={item.filter}
            onClick={() => {
              selectPerson(null);
              setViewFilter(item.filter);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
            style={
              isNavActive(item.filter)
                ? { backgroundColor: '#141413', color: '#ffffff' }
                : { color: '#141413' }
            }
            onMouseEnter={(e) => {
              if (!isNavActive(item.filter))
                e.currentTarget.style.backgroundColor = '#f0eee6';
            }}
            onMouseLeave={(e) => {
              if (!isNavActive(item.filter))
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.filter === 'all' && unreadCount > 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: '#c6613f', minWidth: 20, textAlign: 'center' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-1" style={{ borderTop: '1px solid rgba(20,20,19,0.06)' }} />

      {/* Person list */}
      <div className="px-5 pt-2 pb-1">
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: '#b0aea5' }}
        >
          关注的人
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        {persons.map((person) => {
          const isActive = selectedPersonId === person.id;
          const personUnread = items.filter(
            (i) => i.personId === person.id && !i.isRead
          ).length;

          return (
            <button
              key={person.id}
              onClick={() => {
                selectPerson(person.id);
                setViewFilter('all');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors mb-0.5"
              style={
                isActive
                  ? { backgroundColor: '#f0eee6' }
                  : {}
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f0eee6';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar */}
              <div
                className="shrink-0 flex items-center justify-center rounded-full text-white font-semibold text-xs"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: person.avatarColor,
                }}
              >
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate" style={{ color: '#141413' }}>
                  {person.name}
                </div>
                {person.title && (
                  <div className="text-xs truncate" style={{ color: '#878680' }}>
                    {person.title}
                  </div>
                )}
              </div>
              {personUnread > 0 && (
                <div
                  className="shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: '#c6613f',
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Add person button */}
        <button
          onClick={onAddPerson}
          className="flex items-center justify-center w-full py-2.5 mt-1 rounded-lg text-sm font-medium transition-colors"
          style={{
            border: '1.5px dashed rgba(20,20,19,0.12)',
            color: '#878680',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#c6613f';
            e.currentTarget.style.color = '#c6613f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(20,20,19,0.12)';
            e.currentTarget.style.color = '#878680';
          }}
        >
          + 添加关注对象
        </button>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2 px-5 py-3 text-xs"
        style={{ borderTop: '1px solid rgba(20,20,19,0.06)', color: '#878680' }}
      >
        <span
          className="inline-block rounded-full"
          style={{
            width: 7,
            height: 7,
            backgroundColor:
              scrapeStatus === 'running'
                ? '#c6613f'
                : scrapeStatus === 'error'
                ? '#e74c3c'
                : '#5c7a6e',
          }}
        />
        <span className="flex-1">
          {scrapeStatus === 'running'
            ? '同步中...'
            : scrapeStatus === 'error'
            ? '同步出错'
            : lastSyncTime
            ? `上次同步 · ${timeAgo(lastSyncTime)}`
            : '未同步'}
        </span>
        <button
          onClick={onOpenSettings}
          className="p-1 rounded transition-colors"
          style={{ color: '#878680' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141413')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#878680')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
