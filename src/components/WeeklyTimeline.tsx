import { useState, useMemo } from 'react';
import { useFeedStore } from '../stores/feedStore';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  terra: { bg: 'rgba(198,97,63,0.10)', text: '#c6613f' },
  sage: { bg: 'rgba(92,122,110,0.10)', text: '#5c7a6e' },
  warm: { bg: 'rgba(139,115,85,0.10)', text: '#8b7355' },
  plum: { bg: 'rgba(107,91,115,0.10)', text: '#6b5b73' },
};

const TAG_KEYS = Object.keys(TAG_COLORS);

function getWeekRanges(count: number) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    weeks.push({ start, end, label: `${fmt(start)} - ${fmt(end)}` });
  }
  return weeks.reverse();
}

export function WeeklyTimeline() {
  const { weeklyTopics } = useFeedStore();
  const [activeIdx, setActiveIdx] = useState(3);

  const weeks = useMemo(() => getWeekRanges(4), []);

  // Merge store topics with week placeholders
  const weekData = weeks.map((w, i) => {
    const matched = weeklyTopics.find((wt) => {
      const ws = new Date(wt.weekStart);
      return ws >= w.start && ws <= w.end;
    });
    const topics = matched?.topics?.slice(0, 3) ?? [];
    return { ...w, topics, index: i };
  });

  return (
    <div
      className="shrink-0 px-6 py-4"
      style={{
        backgroundColor: '#faf9f5',
        borderBottom: '1px solid rgba(20,20,19,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: '#c6613f' }}>◆</span>
          <span className="text-sm font-semibold" style={{ color: '#141413' }}>
            每周关注热点
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveIdx((p) => Math.max(0, p - 1))}
            className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors"
            style={{ color: '#878680', border: '1px solid rgba(20,20,19,0.08)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(20,20,19,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(20,20,19,0.08)')}
          >
            ‹
          </button>
          <button
            onClick={() => setActiveIdx((p) => Math.min(3, p + 1))}
            className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors"
            style={{ color: '#878680', border: '1px solid rgba(20,20,19,0.08)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(20,20,19,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(20,20,19,0.08)')}
          >
            ›
          </button>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative flex items-start">
        {/* Horizontal line */}
        <div
          className="absolute top-[7px] left-0 right-0"
          style={{ height: 2, backgroundColor: 'rgba(20,20,19,0.06)' }}
        />

        {weekData.map((week) => (
          <div
            key={week.index}
            className="flex-1 flex flex-col items-center cursor-pointer relative z-10"
            onClick={() => setActiveIdx(week.index)}
          >
            {/* Dot */}
            <div
              className="rounded-full transition-all"
              style={
                week.index === activeIdx
                  ? {
                      width: 14,
                      height: 14,
                      backgroundColor: '#c6613f',
                      boxShadow: '0 0 0 4px rgba(198,97,63,0.2)',
                    }
                  : {
                      width: 10,
                      height: 10,
                      marginTop: 2,
                      backgroundColor: 'rgba(20,20,19,0.12)',
                    }
              }
            />
            {/* Date label */}
            <span
              className="text-[11px] mt-1.5 whitespace-nowrap"
              style={{
                color: week.index === activeIdx ? '#141413' : '#b0aea5',
                fontWeight: week.index === activeIdx ? 600 : 400,
              }}
            >
              {week.label}
            </span>
            {/* Topic tags */}
            <div className="flex flex-wrap justify-center gap-1 mt-1.5">
              {week.topics.length > 0
                ? week.topics.map((t, ti) => {
                    const colorKey = TAG_KEYS[ti % TAG_KEYS.length];
                    const c = TAG_COLORS[colorKey];
                    return (
                      <span
                        key={ti}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {typeof t === 'string' ? t : t.name}
                      </span>
                    );
                  })
                : week.index === activeIdx && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(20,20,19,0.04)', color: '#b0aea5' }}
                    >
                      暂无话题
                    </span>
                  )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
