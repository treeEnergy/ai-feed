import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { DeepSeekTranslator } from './deepseek';

vi.mock('axios');

describe('DeepSeekTranslator', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends correct request and parses response', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { choices: [{ message: { content: '{"translation":"这是测试","topics":["测试"]}' } }] },
    });
    const translator = new DeepSeekTranslator('test-key');
    const result = await translator.translate('This is a test');
    expect(result.translation).toBe('这是测试');
    expect(result.topics).toEqual(['测试']);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('deepseek'),
      expect.objectContaining({ model: 'deepseek-chat' }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }),
    );
  });

  it('handles API failure in batch gracefully', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('API error'));
    const translator = new DeepSeekTranslator('test-key');
    const items = [{ id: '1', originalText: 'test', translationStatus: 'pending' }] as any;
    const results = await translator.translateBatch(items);
    expect(results[0].translationStatus).toBe('failed');
  });
});
