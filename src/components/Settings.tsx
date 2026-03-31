import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { ScrapeInterval } from '../types';

interface SettingsProps {
  onClose: () => void;
}

const INTERVAL_OPTIONS: { label: string; value: ScrapeInterval }[] = [
  { label: '30 分钟', value: '30m' },
  { label: '1 小时', value: '1h' },
  { label: '2 小时', value: '2h' },
  { label: '6 小时', value: '6h' },
];

export function Settings({ onClose }: SettingsProps) {
  const { settings, isLoaded, fetchSettings, updateSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (isLoaded) {
      setApiKey(settings.deepseekApiKey ?? '');
      setProxyUrl(settings.proxyUrl ?? '');
    }
  }, [isLoaded, settings]);

  const handleApiKeyBlur = () => {
    if (apiKey !== settings.deepseekApiKey) {
      updateSettings({ deepseekApiKey: apiKey });
    }
  };

  const handleProxyBlur = () => {
    if (proxyUrl !== settings.proxyUrl) {
      updateSettings({ proxyUrl });
    }
  };

  const handleIntervalChange = (value: ScrapeInterval) => {
    updateSettings({ scrapeInterval: value });
  };

  const handleRunNow = () => {
    window.electronAPI.invoke('scraper:runNow').catch(() => {});
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#f0eee6',
    border: '1px solid rgba(20,20,19,0.08)',
    color: '#141413',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3"
        style={{
          backgroundColor: '#f5f3ec',
          borderBottom: '1px solid rgba(20,20,19,0.06)',
        }}
      >
        <button
          onClick={onClose}
          className="text-sm font-medium transition-colors"
          style={{ color: '#878680' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141413')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#878680')}
        >
          ← 返回
        </button>
        <h1 className="text-lg font-semibold font-serif" style={{ color: '#141413' }}>
          设置
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 flex flex-col gap-8">
        {/* API Key */}
        <section>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#141413' }}>
            DeepSeek API Key
          </h2>
          <p className="text-xs mb-3" style={{ color: '#878680' }}>
            用于中文翻译服务。获取地址：platform.deepseek.com
          </p>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c6613f]/30"
            style={inputStyle}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={handleApiKeyBlur}
          />
        </section>

        {/* Scrape Interval */}
        <section>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#141413' }}>
            抓取频率
          </h2>
          <p className="text-xs mb-3" style={{ color: '#878680' }}>
            自动抓取新内容的间隔时间
          </p>
          <div className="flex gap-2">
            {INTERVAL_OPTIONS.map((opt) => {
              const isActive = settings.scrapeInterval === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleIntervalChange(opt.value)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: '#141413',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: '#f0eee6',
                          color: '#878680',
                          border: '1px solid rgba(20,20,19,0.06)',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#e8e5dc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f0eee6';
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Proxy */}
        <section>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#141413' }}>
            代理设置
          </h2>
          <p className="text-xs mb-3" style={{ color: '#878680' }}>
            可选。用于访问需要代理的平台（如 𝕏、Facebook）
          </p>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c6613f]/30"
            style={inputStyle}
            placeholder="http://127.0.0.1:7890"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            onBlur={handleProxyBlur}
          />
        </section>

        {/* Manual sync */}
        <section>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#141413' }}>
            手动同步
          </h2>
          <p className="text-xs mb-3" style={{ color: '#878680' }}>
            立即抓取所有关注对象的最新内容
          </p>
          <button
            onClick={handleRunNow}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#c6613f' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b5552f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c6613f')}
          >
            立即同步
          </button>
        </section>
      </div>
    </div>
  );
}
