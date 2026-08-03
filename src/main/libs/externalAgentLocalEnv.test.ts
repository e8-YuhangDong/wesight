import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ClaudeSettingsScope, resolveClaudeCodeLiveConfig } from './claudeCodeLiveConfig';
import {
  applyLocalClaudeCodeEnvForPrintMode,
  resolveLocalClaudeCodeConfigSnapshot,
} from './externalAgentLocalEnv';

let tempDir = '';
let projectDir = '';
let originalHome: string | undefined;
let originalUserProfile: string | undefined;

const writeJson = (filePath: string, value: Record<string, unknown>): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value), 'utf8');
};

const writeUserSettings = (settings: Record<string, unknown>): void => {
  writeJson(path.join(tempDir, '.claude', 'settings.json'), settings);
};

const writeProjectSettings = (settings: Record<string, unknown>): void => {
  writeJson(path.join(projectDir, '.claude', 'settings.json'), settings);
};

const writeProjectLocalSettings = (settings: Record<string, unknown>): void => {
  writeJson(path.join(projectDir, '.claude', 'settings.local.json'), settings);
};

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wesight-local-claude-'));
  projectDir = path.join(tempDir, 'workspace');
  fs.mkdirSync(projectDir, { recursive: true });
  originalHome = process.env.HOME;
  originalUserProfile = process.env.USERPROFILE;
  process.env.HOME = tempDir;
  process.env.USERPROFILE = tempDir;
});

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  if (originalUserProfile === undefined) {
    delete process.env.USERPROFILE;
  } else {
    process.env.USERPROFILE = originalUserProfile;
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('local Claude Code environment', () => {
  test('reads the model from the user settings env block', () => {
    writeUserSettings({
      env: {
        ANTHROPIC_MODEL: 'claude-sonnet-4-5',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4-5',
      },
    });
    const env: Record<string, string | undefined> = {};

    const loaded = applyLocalClaudeCodeEnvForPrintMode(env, { processEnv: {}, managedSettingsPath: null });
    const snapshot = resolveLocalClaudeCodeConfigSnapshot({ processEnv: {}, managedSettingsPath: null });

    expect(loaded).toMatchObject({
      sourceScope: ClaudeSettingsScope.User,
      model: 'claude-sonnet-4-5',
    });
    expect(snapshot).toMatchObject({
      sourceScope: ClaudeSettingsScope.User,
      model: 'claude-sonnet-4-5',
    });
    expect(env.ANTHROPIC_MODEL).toBe('claude-sonnet-4-5');
  });

  test('uses the top-level model when env model fields are absent', () => {
    writeUserSettings({ model: 'claude-opus-4-5', env: {} });
    const env: Record<string, string | undefined> = {};

    const loaded = applyLocalClaudeCodeEnvForPrintMode(env, { processEnv: {}, managedSettingsPath: null });

    expect(loaded).toMatchObject({ model: 'claude-opus-4-5' });
    expect(env.ANTHROPIC_MODEL).toBe('claude-opus-4-5');
  });

  test('project settings override user settings', () => {
    writeUserSettings({
      env: {
        ANTHROPIC_MODEL: 'claude-sonnet-4-5',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
      },
    });
    writeProjectSettings({
      env: {
        ANTHROPIC_MODEL: 'kimi-k2.5',
        ANTHROPIC_BASE_URL: 'https://api.moonshot.cn/anthropic',
      },
    });
    const env: Record<string, string | undefined> = {};

    const loaded = applyLocalClaudeCodeEnvForPrintMode(env, { cwd: projectDir, processEnv: {}, managedSettingsPath: null });

    expect(loaded).toMatchObject({
      sourceScope: ClaudeSettingsScope.Project,
      model: 'kimi-k2.5',
      baseUrl: 'https://api.moonshot.cn/anthropic',
    });
    expect(env.ANTHROPIC_MODEL).toBe('kimi-k2.5');
  });

  test('settings.local.json outranks the shared project settings', () => {
    writeProjectSettings({ env: { ANTHROPIC_MODEL: 'shared-model' } });
    writeProjectLocalSettings({ env: { ANTHROPIC_MODEL: 'local-model' } });

    const config = resolveClaudeCodeLiveConfig({ cwd: projectDir, processEnv: {}, managedSettingsPath: null });

    expect(config.model).toBe('local-model');
    expect(config.envScopes.ANTHROPIC_MODEL).toBe(ClaudeSettingsScope.ProjectLocal);
  });

  test('finds project settings from a nested working directory', () => {
    writeProjectSettings({ env: { ANTHROPIC_MODEL: 'project-model' } });
    const nested = path.join(projectDir, 'src', 'deep');
    fs.mkdirSync(nested, { recursive: true });

    const config = resolveClaudeCodeLiveConfig({ cwd: nested, processEnv: {}, managedSettingsPath: null });

    expect(config.model).toBe('project-model');
  });

  test('settings files outrank the ambient process environment', () => {
    writeUserSettings({ env: { ANTHROPIC_MODEL: 'settings-model' } });

    const config = resolveClaudeCodeLiveConfig({
      processEnv: { ANTHROPIC_MODEL: 'env-model', ANTHROPIC_BASE_URL: 'https://env.example.com' },
      managedSettingsPath: null,
    });

    expect(config.model).toBe('settings-model');
    // Keys no settings file defines still fall through to the environment.
    expect(config.baseUrl).toBe('https://env.example.com');
    expect(config.envScopes.ANTHROPIC_BASE_URL).toBe(ClaudeSettingsScope.ProcessEnv);
  });

  test('passes through exactly one credential key', () => {
    writeUserSettings({
      env: {
        ANTHROPIC_AUTH_TOKEN: 'sk-auth-token-value',
        ANTHROPIC_BASE_URL: 'https://api.moonshot.cn/anthropic',
      },
    });
    const env: Record<string, string | undefined> = { ANTHROPIC_API_KEY: 'stale-wesight-key' };

    const loaded = applyLocalClaudeCodeEnvForPrintMode(env, { processEnv: {}, managedSettingsPath: null });

    expect(loaded?.credentialSource).toBe('ANTHROPIC_AUTH_TOKEN');
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-auth-token-value');
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  test('reports an official login when no credential is configured', () => {
    writeUserSettings({ model: 'opus' });
    writeJson(path.join(tempDir, '.claude', '.credentials.json'), { claudeAiOauth: {} });

    const snapshot = resolveLocalClaudeCodeConfigSnapshot({ processEnv: {}, managedSettingsPath: null });

    expect(snapshot).toMatchObject({
      model: 'opus',
      credentialSource: null,
      usesOfficialLogin: true,
    });
  });

  test('ignores placeholder values left in a settings file', () => {
    writeUserSettings({
      env: {
        ANTHROPIC_MODEL: '${MODEL_FROM_SHELL}',
        ANTHROPIC_BASE_URL: 'https://api.example.com',
      },
    });

    const config = resolveClaudeCodeLiveConfig({ processEnv: {}, managedSettingsPath: null });

    expect(config.model).toBe('');
    expect(config.baseUrl).toBe('https://api.example.com');
  });

  test('resolves short model aliases to the concrete model id', () => {
    writeUserSettings({ model: 'opus' });

    const config = resolveClaudeCodeLiveConfig({ processEnv: {}, managedSettingsPath: null });

    // The literal config value is preserved; the resolved id is what the CLI runs.
    expect(config.model).toBe('opus');
    expect(config.resolvedModel).toBe('claude-opus-5');
  });

  test('passes an unknown model through unchanged', () => {
    writeUserSettings({ env: { ANTHROPIC_MODEL: 'kimi-k2.5' } });

    const config = resolveClaudeCodeLiveConfig({ processEnv: {}, managedSettingsPath: null });

    expect(config.model).toBe('kimi-k2.5');
    expect(config.resolvedModel).toBe('kimi-k2.5');
  });

  test('honours CLAUDE_CONFIG_DIR the way the CLI does', () => {
    // The default location is deliberately populated with a different model so
    // a passing test proves the override was followed, not just defaulted.
    writeUserSettings({ env: { ANTHROPIC_MODEL: 'default-dir-model' } });
    const relocated = path.join(tempDir, 'relocated-claude');
    writeJson(path.join(relocated, 'settings.json'), { env: { ANTHROPIC_MODEL: 'relocated-model' } });

    const config = resolveClaudeCodeLiveConfig({
      processEnv: { CLAUDE_CONFIG_DIR: relocated },
      managedSettingsPath: null,
    });

    expect(config.model).toBe('relocated-model');
    expect(config.primarySourcePath).toBe(path.join(relocated, 'settings.json'));
  });

  test('never reads the cc-switch database', () => {
    // A cc-switch install pointing at a different model must not influence the
    // result: Claude Code follows the machine's own settings chain only.
    const ccSwitchDir = path.join(tempDir, '.cc-switch');
    fs.mkdirSync(ccSwitchDir, { recursive: true });
    writeJson(path.join(ccSwitchDir, 'settings.json'), { currentProviderClaude: 'ghost-provider' });
    fs.writeFileSync(path.join(ccSwitchDir, 'cc-switch.db'), 'not-a-real-db', 'utf8');
    writeUserSettings({ env: { ANTHROPIC_MODEL: 'settings-chain-model' } });

    const config = resolveClaudeCodeLiveConfig({ processEnv: {}, managedSettingsPath: null });

    expect(config.model).toBe('settings-chain-model');
    expect(config.inspectedPaths.some((item) => item.includes('.cc-switch'))).toBe(false);
  });

  test('returns null when the machine has no Claude Code config at all', () => {
    expect(resolveLocalClaudeCodeConfigSnapshot({ processEnv: {}, managedSettingsPath: null })).toBeNull();
    expect(applyLocalClaudeCodeEnvForPrintMode({}, { processEnv: {}, managedSettingsPath: null })).toBeNull();
  });
});
