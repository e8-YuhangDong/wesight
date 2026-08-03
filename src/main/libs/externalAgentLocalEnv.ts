import {
  CLAUDE_ENV_KEYS,
  type ClaudeCodeLiveConfig,
  type ClaudeCodeLiveConfigOptions,
  type ClaudeCredentialEnvKey,
  type ClaudeEnvKey,
  ClaudeSettingsScope,
  hasUsableClaudeCodeLiveConfig,
  resolveClaudeCodeLiveConfig,
} from './claudeCodeLiveConfig';

export {
  CLAUDE_MODEL_ENV_KEYS,
  type ClaudeCodeLiveConfig,
  type ClaudeCodeLiveConfigOptions,
} from './claudeCodeLiveConfig';

export type LocalClaudeCodeEnvLoadResult = {
  sourceName: string;
  sourceScope: ClaudeSettingsScope | null;
  baseUrl: string;
  /** Literal config value, which may be an alias such as `opus`. */
  model: string;
  /** Concrete model the alias resolves to; equals `model` when not an alias. */
  resolvedModel: string;
  credentialSource: ClaudeCredentialEnvKey | null;
  usesOfficialLogin: boolean;
};

export type LocalClaudeCodeConfigSnapshot = LocalClaudeCodeEnvLoadResult & {
  configPath: string;
  /** Every settings file that contributed a value, highest precedence first. */
  contributingPaths: string[];
};

const SCOPE_LABELS: Record<ClaudeSettingsScope, string> = {
  [ClaudeSettingsScope.Managed]: 'Claude Code managed settings',
  [ClaudeSettingsScope.ProjectLocal]: 'Claude Code project settings (local)',
  [ClaudeSettingsScope.Project]: 'Claude Code project settings',
  [ClaudeSettingsScope.User]: 'Claude Code user settings',
  [ClaudeSettingsScope.ProcessEnv]: 'Process environment',
};

const getString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const maskSecretForLog = (value: unknown): string => {
  const text = getString(value);
  if (!text) return '(not set)';
  if (text.length <= 10) return `<redacted:${text.length}>`;
  return `${text.slice(0, 5)}...${text.slice(-5)} (${text.length})`;
};

const isClaudeSecretEnvKey = (key: ClaudeEnvKey): boolean => (
  key === 'ANTHROPIC_AUTH_TOKEN' || key === 'ANTHROPIC_API_KEY'
);

const describeSource = (config: ClaudeCodeLiveConfig): string => {
  if (config.primaryScope) return SCOPE_LABELS[config.primaryScope];
  return config.usesOfficialLogin ? 'Claude Code official login' : 'Claude Code local config';
};

const toLoadResult = (config: ClaudeCodeLiveConfig): LocalClaudeCodeEnvLoadResult => ({
  sourceName: describeSource(config),
  sourceScope: config.primaryScope,
  baseUrl: config.baseUrl,
  model: config.model,
  resolvedModel: config.resolvedModel,
  credentialSource: config.credentialSource,
  usesOfficialLogin: config.usesOfficialLogin,
});

/**
 * Reads the Claude Code config that is actually in effect on this machine.
 * Purely read-only — WeSight never writes back in local-CLI mode, so switching
 * providers in cc-switch (or editing settings.json by hand) is picked up on the
 * next read with no import or sync step.
 */
export const resolveLocalClaudeCodeConfigSnapshot = (
  options: ClaudeCodeLiveConfigOptions = {},
): LocalClaudeCodeConfigSnapshot | null => {
  const config = resolveClaudeCodeLiveConfig(options);
  if (!hasUsableClaudeCodeLiveConfig(config)) return null;
  return {
    ...toLoadResult(config),
    configPath: config.primarySourcePath,
    contributingPaths: config.sources.map((source) => source.path),
  };
};

const summarizeClaudeEnv = (
  env: Partial<Record<ClaudeEnvKey, string>> | Record<string, string | undefined>,
): Record<ClaudeEnvKey, string> => {
  const summary = {} as Record<ClaudeEnvKey, string>;
  for (const key of CLAUDE_ENV_KEYS) {
    const value = getString((env as Record<string, unknown>)[key]);
    if (!value) {
      summary[key] = '(not set)';
      continue;
    }
    summary[key] = isClaudeSecretEnvKey(key) ? maskSecretForLog(value) : value;
  }
  return summary;
};

const collectClaudeEnvConflicts = (
  childEnv: Record<string, string | undefined>,
  localEnv: Partial<Record<ClaudeEnvKey, string>>,
): string[] => {
  const conflicts: string[] = [];
  for (const key of CLAUDE_ENV_KEYS) {
    const childValue = getString(childEnv[key]);
    const localValue = getString(localEnv[key]);
    if (!childValue || !localValue || childValue === localValue) {
      continue;
    }
    const childDisplay = isClaudeSecretEnvKey(key) ? maskSecretForLog(childValue) : childValue;
    const localDisplay = isClaudeSecretEnvKey(key) ? maskSecretForLog(localValue) : localValue;
    conflicts.push(`${key}: child=${childDisplay} local=${localDisplay}`);
  }
  return conflicts;
};

export const buildClaudeCodeConfigDiagnostics = (
  childEnv: Record<string, string | undefined>,
  options: ClaudeCodeLiveConfigOptions = {},
): Record<string, unknown> => {
  const config = resolveClaudeCodeLiveConfig(options);
  return {
    childEnv: summarizeClaudeEnv(childEnv),
    resolvedLocalConfig: {
      source: describeSource(config),
      configPath: config.primarySourcePath || '(unknown)',
      inspectedPaths: config.inspectedPaths,
      env: summarizeClaudeEnv(config.env),
      conflictsWithChildEnv: collectClaudeEnvConflicts(childEnv, config.env),
    },
    layers: config.sources.map((source) => ({
      scope: source.scope,
      configPath: source.path,
      appliedKeys: source.appliedKeys,
    })),
  };
};

/**
 * Applies the machine's effective Claude Code config onto a child process env.
 * Values absent from the local config are left untouched, so an official OAuth
 * login keeps working without any credential being injected.
 */
export const applyLocalClaudeCodeEnvForPrintMode = (
  env: Record<string, string | undefined>,
  options: ClaudeCodeLiveConfigOptions = {},
): LocalClaudeCodeEnvLoadResult | null => {
  const config = resolveClaudeCodeLiveConfig(options);
  if (!hasUsableClaudeCodeLiveConfig(config)) return null;

  for (const key of CLAUDE_ENV_KEYS) {
    const value = config.env[key];
    if (value) {
      env[key] = value;
    }
  }
  if (config.model && !env.ANTHROPIC_MODEL) {
    env.ANTHROPIC_MODEL = config.model;
  }

  // Claude Code honours exactly one credential key; passing both invites the
  // CLI to pick the one we did not resolve.
  if (config.credentialSource) {
    delete env.ANTHROPIC_API_KEY;
    delete env.ANTHROPIC_AUTH_TOKEN;
    env[config.credentialSource] = config.env[config.credentialSource] ?? '';
  }

  console.log('[ExternalAgentLocalEnv] loaded local Claude Code config.', {
    source: describeSource(config),
    configPath: config.primarySourcePath || '(unknown)',
    baseUrl: config.baseUrl || '(not set)',
    model: config.model || '(not set)',
    credentialSource: config.credentialSource ?? (config.usesOfficialLogin ? '(official login)' : '(not set)'),
    anthropicApiKey: maskSecretForLog(env.ANTHROPIC_API_KEY),
    anthropicAuthToken: maskSecretForLog(env.ANTHROPIC_AUTH_TOKEN),
  });
  return toLoadResult(config);
};
