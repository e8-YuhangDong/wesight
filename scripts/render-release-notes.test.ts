import { createRequire } from 'node:module';

import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const {
  getReleaseNotesEntry,
  normalizeVersion,
  readReleaseNotes,
  renderReleaseNotes,
} = require('./render-release-notes.cjs');

describe('Chinese release notes', () => {
  test('normalizes version tags', () => {
    expect(normalizeVersion('v1.0.3')).toBe('1.0.3');
  });

  test('renders the current release in Chinese Markdown', () => {
    const markdown = renderReleaseNotes('1.0.3');

    expect(markdown).toContain('## WeSight v1.0.3 · 主题资源修复');
    expect(markdown).toContain('### 修复');
    expect(markdown).toContain('Windows x64 安装包当前尚未签名');
    expect(markdown).toContain(
      '[查看 v1.0.3 的完整代码差异](https://github.com/freestylefly/wesight/compare/v1.0.2...v1.0.3)',
    );
    expect(markdown).not.toContain("What's Changed");
  });

  test('rejects a version without prepared release notes', () => {
    expect(() => getReleaseNotesEntry('9.9.9', readReleaseNotes())).toThrow(
      'No Chinese release notes found for v9.9.9',
    );
  });
});
