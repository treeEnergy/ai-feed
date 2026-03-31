import { describe, it, expect } from 'vitest';
import { parseResults } from './arxiv';

const ARXIV_HTML = `
<html>
<body>
<ol class="breathe-horizontal">
  <li class="arxiv-result">
    <p class="list-title is-inline-block">
      <a href="https://arxiv.org/abs/2401.00001">arXiv:2401.00001</a>
    </p>
    <p class="title is-5 mathjax">
      Attention Is All You Need Revisited
    </p>
    <p class="abstract mathjax">
      <span class="abstract-short has-text-grey-dark mathjax" style="display: inline;">
        Short abstract...
        <a class="is-size-7" onclick="">▽ More</a>
      </span>
      <span class="abstract-full has-text-grey-dark mathjax" style="display: none;">
        We revisit the transformer architecture and propose several improvements that lead to better performance on language modeling benchmarks.
        <a class="is-size-7" onclick="">△ Less</a>
      </span>
    </p>
    <p class="is-size-7">
      Submitted 1 January, 2024
    </p>
  </li>
  <li class="arxiv-result">
    <p class="list-title is-inline-block">
      <a href="https://arxiv.org/abs/2312.99999">arXiv:2312.99999</a>
    </p>
    <p class="title is-5 mathjax">
      Scaling Laws for Neural Language Models
    </p>
    <p class="abstract mathjax">
      <span class="abstract-short has-text-grey-dark mathjax" style="display: inline;">
        Short abstract...
        <a class="is-size-7" onclick="">▽ More</a>
      </span>
      <span class="abstract-full has-text-grey-dark mathjax" style="display: none;">
        We study empirical scaling laws for language model performance on cross-entropy loss.
        <a class="is-size-7" onclick="">△ Less</a>
      </span>
    </p>
    <p class="is-size-7">
      Submitted 15 December, 2023
    </p>
  </li>
</ol>
</body>
</html>
`;

describe('arXiv parseResults', () => {
  it('parses two results from fixture HTML', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items).toHaveLength(2);
  });

  it('extracts title into metadata', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].metadata.title).toBe('Attention Is All You Need Revisited');
    expect(items[1].metadata.title).toBe('Scaling Laws for Neural Language Models');
  });

  it('extracts abstract as originalText', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].originalText).toContain('revisit the transformer architecture');
    expect(items[1].originalText).toContain('empirical scaling laws');
  });

  it('extracts arxivId from URL', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].metadata.arxivId).toBe('2401.00001');
    expect(items[1].metadata.arxivId).toBe('2312.99999');
  });

  it('builds full paper URL', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].url).toBe('https://arxiv.org/abs/2401.00001');
  });

  it('sets platform and personId correctly', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].platform).toBe('arxiv');
    expect(items[0].personId).toBe('person-1');
  });

  it('generates deterministic IDs', () => {
    const items1 = parseResults(ARXIV_HTML, 'person-1');
    const items2 = parseResults(ARXIV_HTML, 'person-1');
    expect(items1[0].id).toBe(items2[0].id);
  });

  it('limits to 10 items', () => {
    // Generate HTML with 15 items
    const manyItems = Array.from({ length: 15 }, (_, i) => `
      <li class="arxiv-result">
        <p class="list-title is-inline-block">
          <a href="https://arxiv.org/abs/2401.${String(i).padStart(5, '0')}">arXiv:2401.${String(i).padStart(5, '0')}</a>
        </p>
        <p class="title is-5 mathjax">Paper ${i}</p>
        <p class="abstract mathjax">
          <span class="abstract-full">Abstract ${i}</span>
        </p>
        <p class="is-size-7">Submitted 1 January, 2024</p>
      </li>
    `).join('');
    const html = `<html><body><ol>${manyItems}</ol></body></html>`;
    const items = parseResults(html, 'person-1');
    expect(items).toHaveLength(10);
  });

  it('returns empty array for HTML with no results', () => {
    const items = parseResults('<html><body></body></html>', 'person-1');
    expect(items).toHaveLength(0);
  });

  it('sets default values for isRead, isStarred, translationStatus', () => {
    const items = parseResults(ARXIV_HTML, 'person-1');
    expect(items[0].isRead).toBe(false);
    expect(items[0].isStarred).toBe(false);
    expect(items[0].translationStatus).toBe('pending');
  });
});
