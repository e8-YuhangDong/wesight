import { describe, expect, test } from 'vitest';

import { CoworkAgentEngine } from '../../../shared/cowork/constants';
import { getCoworkSlashCommandsForEngine } from './coworkSlashCommands';

describe('getCoworkSlashCommandsForEngine', () => {
  test('includes Claude Code native commands for Claude Code sessions', () => {
    const commands = getCoworkSlashCommandsForEngine(CoworkAgentEngine.ClaudeCode)
      .map((entry) => entry.command);

    expect(commands).toContain('/goal');
    expect(commands).toContain('/compact');
    expect(commands).toContain('/security-review');
  });

  test('keeps native Claude Code commands out of other engines', () => {
    const commands = getCoworkSlashCommandsForEngine(CoworkAgentEngine.Codex)
      .map((entry) => entry.command);

    expect(commands).not.toContain('/goal');
    expect(commands).toContain('/model');
  });
});
