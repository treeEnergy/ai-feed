import { describe, it, expect } from 'vitest';
import { parseRepos } from './github';

const GITHUB_HTML = `
<html>
<body>
<div id="user-repositories-list">
  <ul>
    <li>
      <div class="col-10 col-lg-9 d-inline-block">
        <h3>
          <a href="/octocat/hello-world" itemprop="name codeRepository">hello-world</a>
        </h3>
        <p itemprop="description">My first repository on GitHub!</p>
        <div class="f6 color-fg-muted mt-2">
          <span itemprop="programmingLanguage">JavaScript</span>
          <a href="/octocat/hello-world/stargazers">
            142
          </a>
          <a href="/octocat/hello-world/forks">
            38
          </a>
          <relative-time datetime="2024-06-15T10:30:00Z">Jun 15, 2024</relative-time>
        </div>
      </div>
    </li>
    <li>
      <div class="col-10 col-lg-9 d-inline-block">
        <h3>
          <a href="/octocat/spoon-knife" itemprop="name codeRepository">spoon-knife</a>
        </h3>
        <p itemprop="description">This repo is for demonstration purposes</p>
        <div class="f6 color-fg-muted mt-2">
          <span itemprop="programmingLanguage">HTML</span>
          <a href="/octocat/spoon-knife/stargazers">
            12,345
          </a>
          <a href="/octocat/spoon-knife/forks">
            1,234
          </a>
          <relative-time datetime="2024-05-20T08:00:00Z">May 20, 2024</relative-time>
        </div>
      </div>
    </li>
    <li>
      <div class="col-10 col-lg-9 d-inline-block">
        <h3>
          <a href="/octocat/no-desc-repo" itemprop="name codeRepository">no-desc-repo</a>
        </h3>
        <div class="f6 color-fg-muted mt-2">
          <span itemprop="programmingLanguage">Python</span>
          <relative-time datetime="2024-04-01T12:00:00Z">Apr 1, 2024</relative-time>
        </div>
      </div>
    </li>
  </ul>
</div>
</body>
</html>
`;

describe('GitHub parseRepos', () => {
  it('parses three repos from fixture HTML', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items).toHaveLength(3);
  });

  it('extracts repo name into metadata', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].metadata.repoName).toBe('hello-world');
    expect(items[1].metadata.repoName).toBe('spoon-knife');
  });

  it('extracts description as originalText', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].originalText).toBe('My first repository on GitHub!');
    expect(items[1].originalText).toBe('This repo is for demonstration purposes');
  });

  it('falls back to repo name when no description', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[2].originalText).toBe('Repository: no-desc-repo');
  });

  it('extracts language', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].metadata.language).toBe('JavaScript');
    expect(items[2].metadata.language).toBe('Python');
  });

  it('extracts stars and forks as numbers', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].metadata.stars).toBe(142);
    expect(items[0].metadata.forks).toBe(38);
    expect(items[1].metadata.stars).toBe(12345);
    expect(items[1].metadata.forks).toBe(1234);
  });

  it('builds full GitHub URL', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].url).toBe('https://github.com/octocat/hello-world');
  });

  it('extracts datetime from relative-time element', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].publishedAt).toBe('2024-06-15T10:30:00Z');
  });

  it('sets platform and personId correctly', () => {
    const items = parseRepos(GITHUB_HTML, 'person-2');
    expect(items[0].platform).toBe('github');
    expect(items[0].personId).toBe('person-2');
  });

  it('generates deterministic IDs', () => {
    const items1 = parseRepos(GITHUB_HTML, 'person-2');
    const items2 = parseRepos(GITHUB_HTML, 'person-2');
    expect(items1[0].id).toBe(items2[0].id);
  });

  it('returns empty array for HTML with no repos', () => {
    const items = parseRepos('<html><body></body></html>', 'person-2');
    expect(items).toHaveLength(0);
  });
});
