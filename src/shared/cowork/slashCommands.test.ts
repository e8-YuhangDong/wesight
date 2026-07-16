import { describe, expect, test } from 'vitest';

import { isClaudeCodeSlashInput } from './slashCommands';

describe('isClaudeCodeSlashInput', () => {
  test('recognizes built-in and custom Claude Code commands', () => {
    expect(isClaudeCodeSlashInput('/goal finish when tests pass')).toBe(true);
    expect(isClaudeCodeSlashInput('/security-review')).toBe(true);
    expect(isClaudeCodeSlashInput('/my-custom-skill input')).toBe(true);
  });

  test('does not treat regular prompts or paths as slash commands', () => {
    expect(isClaudeCodeSlashInput('please run /goal')).toBe(false);
    expect(isClaudeCodeSlashInput('//server/share')).toBe(false);
    expect(isClaudeCodeSlashInput('/path/to/file')).toBe(false);
  });
});
