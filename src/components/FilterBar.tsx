import { useFeedStore } from '../stores/feedStore';
import type { Platform } from '../types';

const PLATFORM_OPTIONS: { label: string; value: Platform | null }[] = [
  { label: '全部', value: null },
  { label: '𝕏', value: 'x' },
  { label: 'GitHub', value: 'github' },
  { label: 'arXiv', value: 'arxiv' },
  { label: 'Facebook', value: 'facebook' },
];

export function FilterBar() {
  const {
    persons,
    selectedPersonId,
    selectedPlatform,
    viewFilter,
    items,
    selectPlatform,
  } = useFeedStore();

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  let title = '全部动态';
  let subtitle = `来自 ${persons.length} 位关注对象的最新内容`;

  if (selectedPersonId && selectedPerson) {
    title = selectedPerson.name;
    subtitle = selectedPerson.title ?? '关注对象';
  } else if (viewFilter === 'starred') {
    title = '收藏';
    subtitle = `${items.length} 条收藏内容`;
  } else if (viewFilter === 'papers') {
    title = '论文追踪';
    subtitle = '来自 arXiv 的最新论文';
  }

  return (
    <div
      className="shrink-0 px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(20,20,19,0.06)' }}
    >
      {/* Title area */}
      <div>
        <h1 className="text-lg font-semibold font-serif" style={{ color: '#141413' }}>
          {title}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#878680' }}>
          {subtitle}
        </p>
      </div>

      {/* Platform pills */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg"
        style={{ backgroundColor: '#f0eee6' }}
      >
        {PLATFORM_OPTIONS.map((opt) => {
          const isActive = selectedPlatform === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => selectPlatform(opt.value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={
                isActive
                  ? {
                      backgroundColor: '#ffffff',
                      color: '#141413',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: '#878680',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#141413';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#878680';
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
