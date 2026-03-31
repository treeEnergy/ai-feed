import { useState } from 'react';
import { useFeedStore } from '../stores/feedStore';
import type { Platform } from '../types';

interface AddPersonDialogProps {
  onClose: () => void;
}

const AVATAR_COLORS = ['#c6613f', '#5c7a6e', '#8b7355', '#6b5b73', '#3d6b8e'];

const PLATFORM_FIELDS: { key: Platform; label: string; placeholder: string }[] = [
  { key: 'x', label: '𝕏 Twitter', placeholder: 'https://x.com/username' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { key: 'arxiv', label: 'arXiv', placeholder: 'arXiv author ID 或搜索关键词' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
];

export function AddPersonDialog({ onClose }: AddPersonDialogProps) {
  const fetchPersons = useFeedStore((s) => s.fetchPersons);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [platforms, setPlatforms] = useState<Partial<Record<Platform, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await window.electronAPI.invoke('persons:add', {
        name: name.trim(),
        title: title.trim() || undefined,
        avatarColor,
        platforms,
      });
      await fetchPersons();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#f0eee6',
    border: '1px solid rgba(20,20,19,0.08)',
    color: '#141413',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20,20,19,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-[16px] w-full max-w-md p-6"
        style={{
          backgroundColor: '#faf9f5',
          border: '1px solid rgba(20,20,19,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        }}
      >
        <h2 className="text-lg font-semibold font-serif mb-5" style={{ color: '#141413' }}>
          添加关注对象
        </h2>

        {/* Name */}
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#878680' }}>
          姓名 *
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-[#c6613f]/30"
          style={inputStyle}
          placeholder="例如：Andrej Karpathy"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Title */}
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#878680' }}>
          头衔
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-[#c6613f]/30"
          style={inputStyle}
          placeholder="例如：前 Tesla AI 负责人"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Avatar color */}
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#878680' }}>
          头像颜色
        </label>
        <div className="flex gap-2 mb-4">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              className="w-8 h-8 rounded-full transition-all"
              style={{
                backgroundColor: c,
                boxShadow: avatarColor === c ? `0 0 0 3px #faf9f5, 0 0 0 5px ${c}` : 'none',
              }}
              onClick={() => setAvatarColor(c)}
            />
          ))}
        </div>

        {/* Platform URLs */}
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#878680' }}>
          平台链接
        </label>
        <div className="flex flex-col gap-2 mb-5">
          {PLATFORM_FIELDS.map((pf) => (
            <div key={pf.key} className="flex items-center gap-2">
              <span
                className="text-xs font-medium w-16 shrink-0 text-right"
                style={{ color: '#878680' }}
              >
                {pf.label}
              </span>
              <input
                className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#c6613f]/30"
                style={inputStyle}
                placeholder={pf.placeholder}
                value={platforms[pf.key] ?? ''}
                onChange={(e) =>
                  setPlatforms((prev) => ({ ...prev, [pf.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#878680' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0eee6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#c6613f' }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = '#b5552f';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c6613f')}
          >
            {submitting ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
