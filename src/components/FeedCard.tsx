import { useState } from 'react';
import type { ScrapedItem, Person } from '../types';
import { useFeedStore } from '../stores/feedStore';

interface FeedCardProps {
  item: ScrapedItem;
  person?: Person;
}

const TAG_COLORS = [
  { bg: 'rgba(198,97,63,0.10)', text: '#c6613f' },
  { bg: 'rgba(92,122,110,0.10)', text: '#5c7a6e' },
  { bg: 'rgba(139,115,85,0.10)', text: '#8b7355' },
  { bg: 'rgba(107,91,115,0.10)', text: '#6b5b73' },
];

const PLATFORM_LABELS: Record<string, string> = {
  x: '𝕏 Twitter',
  github: 'GitHub',
  arxiv: 'arXiv',
  facebook: 'Facebook',
};

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

export function FeedCard({ item, person }: FeedCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const toggleItemStar = useFeedStore((s) => s.toggleItemStar);

  const displayText = item.translatedText || item.originalText;
  const hasTranslation = !!item.translatedText && item.translatedText !== item.originalText;
  const topic = item.topics?.[0];
  const topicColor = TAG_COLORS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText).catch(() => {});
  };

  const handleOpenUrl = () => {
    window.electronAPI.invoke('shell:openExternal', item.url).catch(() => {});
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
            style={{
              width: 32,
              height: 32,
              backgroundColor: person.avatarColor,
            }}
          >
            {person.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 text-sm">
          <span className="font-semibold" style={{ color: '#141413' }}>
            {person?.name ?? '未知'}
          </span>
          <span style={{ color: '#b0aea5' }}>·</span>
          <span style={{ color: '#878680' }}>
            {PLATFORM_LABELS[item.platform] ?? item.platform}
          </span>
          <span style={{ color: '#b0aea5' }}>·</span>
          <span style={{ color: '#878680' }}>{timeAgo(item.publishedAt)}</span>
        </div>
        {topic && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: topicColor.bg, color: topicColor.text }}
          >
            {topic}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        className="font-serif text-[15px] leading-relaxed mb-3"
        style={{ color: '#141413' }}
      >
        {displayText}
      </div>

      {/* Collapsible original */}
      {hasTranslation && (
        <div className="mb-3">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs font-medium mb-1.5 transition-colors"
            style={{ color: '#878680' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c6613f')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#878680')}
          >
            {showOriginal ? '收起原文 ▲' : '查看原文 ▼'}
          </button>
          {showOriginal && (
            <div
              className="rounded-[10px] p-3 text-sm italic leading-relaxed"
              style={{
                backgroundColor: '#f0eee6',
                borderLeft: '3px solid rgba(20,20,19,0.08)',
                color: '#878680',
              }}
            >
              {item.originalText}
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
