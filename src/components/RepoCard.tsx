import { useState } from 'react';
import type { ScrapedItem, Person } from '../types';
import { useFeedStore } from '../stores/feedStore';

interface RepoCardProps {
  item: ScrapedItem;
  person?: Person;
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function RepoCard({ item, person }: RepoCardProps) {
  const toggleItemStar = useFeedStore((s) => s.toggleItemStar);
  const [showReadme, setShowReadme] = useState(false);
  const meta = item.metadata ?? {};
  const repoName = meta.repoName ?? meta.name ?? item.originalText;
  const description = meta.description ?? '';
  const stars = meta.stars;
  const forks = meta.forks;
  const language = meta.language;
  const readmeContent = item.translatedText || item.originalText;
  const hasRichContent = readmeContent && readmeContent.length > 100;

  const handleOpenUrl = () => {
    window.electronAPI?.invoke('shell:openExternal', item.url).catch(() => {});
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(item.url).catch(() => {});
  };

  return (
    <div
      className="rounded-[16px] p-5 transition-all"
      style={{
        backgroundColor: '#faf9f5',
        border: '1px solid rgba(20,20,19,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(20,20,19,0.12)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(20,20,19,0.06)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {person && (
          <div
            className="shrink-0 flex items-center justify-center rounded-full text-white font-semibold text-xs"
            style={{ width: 32, height: 32, backgroundColor: person.avatarColor }}
          >
            {person.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 text-sm">
          <span className="font-semibold" style={{ color: '#141413' }}>
            {person?.name ?? '未知'}
          </span>
          <span style={{ color: '#b0aea5' }}>·</span>
          <span style={{ color: '#878680' }}>GitHub</span>
          <span style={{ color: '#b0aea5' }}>·</span>
          <span style={{ color: '#878680' }}>{timeAgo(item.publishedAt)}</span>
        </div>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'rgba(92,122,110,0.10)', color: '#5c7a6e' }}
        >
          Repo
        </span>
      </div>

      {/* Repo name */}
      <div className="mb-3">
        <span
          className="font-mono text-sm font-semibold cursor-pointer"
          style={{ color: '#c6613f' }}
          onClick={handleOpenUrl}
        >
          {repoName}
        </span>
      </div>

      {/* Repo sub-card */}
      <div
        className="rounded-[12px] p-4 mb-3"
        style={{
          backgroundColor: '#f0eee6',
          border: '1px solid rgba(20,20,19,0.06)',
        }}
      >
        <div className="flex items-start gap-2.5">
          <span className="text-base mt-0.5" style={{ color: '#8b7355' }}>
            ⬡
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-medium mb-1" style={{ color: '#141413' }}>
              {repoName}
            </div>
            {description && (
              <p className="text-sm leading-relaxed mb-2" style={{ color: '#878680' }}>
                {description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs" style={{ color: '#878680' }}>
              {language && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#8b7355' }}
                  />
                  {language}
                </span>
              )}
              {stars != null && (
                <span className="flex items-center gap-1">
                  ★ {typeof stars === 'number' ? stars.toLocaleString() : stars}
                </span>
              )}
              {forks != null && (
                <span className="flex items-center gap-1">
                  ⑂ {typeof forks === 'number' ? forks.toLocaleString() : forks}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* README content */}
      {hasRichContent && (
        <div className="mb-3">
          <button
            onClick={() => setShowReadme(!showReadme)}
            className="text-xs font-medium mb-1.5 transition-colors"
            style={{ color: '#878680' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c6613f')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#878680')}
          >
            {showReadme ? '收起详情 ▲' : '查看详情 ▼'}
          </button>
          {showReadme && (
            <div
              className="rounded-[10px] p-4 text-sm leading-relaxed font-serif whitespace-pre-line"
              style={{
                backgroundColor: '#f0eee6',
                borderLeft: '3px solid rgba(20,20,19,0.08)',
                color: '#141413',
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {readmeContent}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 pt-1">
        {[
          { label: '原文', icon: '↗', action: handleOpenUrl },
          { label: '复制', icon: '⊡', action: handleCopy },
          {
            label: '收藏',
            icon: item.isStarred ? '★' : '☆',
            action: () => toggleItemStar(item.id),
            active: item.isStarred,
          },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: btn.active ? '#c6613f' : '#b0aea5' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c6613f')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = btn.active ? '#c6613f' : '#b0aea5')
            }
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
