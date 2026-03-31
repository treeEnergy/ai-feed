import axios from 'axios';
import { ScrapedItem } from '../../src/types';

const SYSTEM_PROMPT = `你是一个 AI/ML 领域的专业翻译。请将以下英文内容翻译为流畅的中文。
规则：
1. 保留专业术语原文，如 Transformer、RLHF、AGI、LLM 等
2. 人名保持英文
3. 翻译要自然，不要翻译腔
4. 同时提取 1-2 个关键主题标签（中文）

请返回 JSON 格式：{"translation": "...", "topics": ["...", "..."]}`;

export class DeepSeekTranslator {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string): Promise<{ translation: string; topics: string[] }> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );
    return JSON.parse(response.data.choices[0].message.content);
  }

  async translateBatch(items: ScrapedItem[]): Promise<ScrapedItem[]> {
    const results: ScrapedItem[] = [];
    for (const item of items) {
      try {
        const { translation, topics } = await this.translate(item.originalText);
        results.push({
          ...item,
          translatedText: translation,
          topics,
          translationStatus: 'done',
        });
      } catch (e) {
        console.error(`Translation failed for item ${item.id}:`, e);
        results.push({ ...item, translationStatus: 'failed' });
      }
    }
    return results;
  }
}
