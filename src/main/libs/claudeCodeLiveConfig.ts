import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Resolves the Claude Code configuration that is actually in effect on this
 * machine — the same thing the user would get by running `claude` in a
 * terminal. This module is strictly read-only: it never writes to any of the
 * files it inspects.
 */

export const ClaudeSettingsScope = {
  Managed: 'managed',
  ProjectLocal: 'project_local',
  Project: 'project',
  User: 'user',
  ProcessEnv: 'process_env',
} as const;
export type ClaudeSettingsScope = typeof ClaudeSettingsScope[keyof typeof ClaudeSettingsScope];

/** Highest precedence first — mirrors Claude Code's own settings resolution. */
const SCOPE_PRIORITY = [
  ClaudeSettingsScope.Managed,
  ClaudeSettingsScope.ProjectLocal,
  ClaudeSettingsScope.Project,
  ClaudeSettingsScope.User,
  ClaudeSettingsScope.ProcessEnv,
] as const satisfies readonly ClaudeSettingsScope[];

export const CLAUDE_ENV_KEYS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_REASONING_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_SMALL_FAST_MODEL',
] as const;
export type ClaudeEnvKey = typeof CLAUDE_ENV_KEYS[number];

/** Checked in order when deciding which model Claude Code would actually use. */
export const CLAUDE_MODEL_ENV_KEYS = [
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_REASONING_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_SMALL_FAST_MODEL',
] as const satisfies readonly ClaudeEnvKey[];

export const ClaudeCredentialEnvKey = {
  AuthToken: 'ANTHROPIC_AUTH_TOKEN',
  ApiKey: 'ANTHROPIC_API_KEY',
} as const;
export type ClaudeCredentialEnvKey = typeof ClaudeCredentialEnvKey[keyof typeof ClaudeCredentialEnvKey];

/** How far up the tree we look for a project-level `.claude` directory. */
const PROJECT_LOOKUP_MAX_DEPTH = 64;

/**
 * Claude Code accepts short aliases in `model`, and resolves them to a concrete
 * model at runtime. Resolving them here keeps WeSight's display consistent with
 * what the CLI shows.
 *
 * NOTE: this mapping tracks Anthropic's current models and needs updating when
 * a new generation ships. Anything not listed passes through unchanged, so an
 * unknown alias degrades to showing the literal config value rather than a
 * wrong one.
 */
export const CLAUDE_MODEL_ALIASES: Record<string, string> = {
  opus: 'claude-opus-5',
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5',
};

export const resolveClaudeModelAlias = (model: string): string => {
  const alias = getString(model).toLowerCase();
  return CLAUDE_MODEL_ALIASES[alias] ?? getString(model);
};

export type ClaudeSettingsLayer = {
  scope: ClaudeSettingsScope;
  /** Absolute file path, or a synthetic label for the process environment. */
  path: string;
  settings: Record<string, unknown>;
  env: Record<string, string>;
};

export type ClaudeCodeLiveConfigSource = {
  scope: ClaudeSettingsScope;
  path: string;
  /** Env keys (and the pseudo-key `model`) this layer actually won. */
  appliedKeys: string[];
};

export type ClaudeCodeLiveConfig = {
  env: Partial<Record<ClaudeEnvKey, string>>;
  /** Which layer supplied each resolved env key. */
  envScopes: Partial<Record<ClaudeEnvKey, ClaudeSettingsScope>>;
  /** The literal value from the config, which may be an alias like `opus`. */
  model: string;
  /** The concrete model the alias resolves to; equals `model` when not an alias. */
  resolvedModel: string;
  baseUrl: string;
  credentialSource: ClaudeCredentialEnvKey | null;
  /** True when no explicit credential is configured but an OAuth login exists. */
  usesOfficialLogin: boolean;
  /** The layer that supplied the model, or the highest-priority layer present. */
  primaryScope: ClaudeSettingsScope | null;
  primarySourcePath: string;
  /** Every layer that contributed at least one resolved value, highest first. */
  sources: ClaudeCodeLiveConfigSource[];
  /** Every layer that was found on disk, whether or not it won anything. */
  inspectedPaths: string[];
};

const homeDir = (): string => os.homedir();

const getString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const looksLikePlaceholder = (value: unknown): boolean => /^\$\{[^}]+\}$/.test(getString(value));

const readJsonObject = (filePath: string): Record<string, unknown> | null => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch (error) {
    console.warn(`[ClaudeCodeLiveConfig] could not parse ${filePath}, ignoring it:`, error);
    return null;
  }
};

const getNestedRecord = (value: unknown, key: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const nested = (value as Record<string, unknown>)[key];
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : {};
};

/** Keeps only the Anthropic keys we understand, dropping empty placeholders. */
const pickClaudeEnv = (source: Record<string, unknown>): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const key of CLAUDE_ENV_KEYS) {
    const value = getString(source[key]);
    if (value && !looksLikePlaceholder(value)) {
      env[key] = value;
    }
  }
  return env;
};

/**
 * Reads the model out of a single Claude settings-shaped object. Used for
 * summarising stored provider configs, which are not part of the live chain.
 */
export const getClaudeCodeModelFromSettingsConfig = (
  settingsConfig: Record<string, unknown>,
): string => {
  const env = getNestedRecord(settingsConfig, 'env');
  for (const key of CLAUDE_MODEL_ENV_KEYS) {
    const value = getString(env[key]);
    if (value && !looksLikePlaceholder(value)) {
      return value;
    }
  }
  const topLevelModel = getString(settingsConfig.model);
  return topLevelModel && !looksLikePlaceholder(topLevelModel) ? topLevelModel : '';
};

export const getManagedClaudeSettingsPath = (): string => {
  if (process.platform === 'darwin') {
    return '/Library/Application Support/ClaudeCode/managed-settings.json';
  }
  if (process.platform === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    return path.join(programData, 'ClaudeCode', 'managed-settings.json');
  }
  return '/etc/claude-code/managed-settings.json';
};

/**
 * Claude Code relocates its whole config directory when CLAUDE_CONFIG_DIR is
 * set, so honouring it is part of matching what the terminal actually reads.
 */
export const getClaudeConfigDir = (
  processEnv: Record<string, string | undefined> = process.env,
): string => {
  const override = getString(processEnv.CLAUDE_CONFIG_DIR);
  return override || path.join(homeDir(), '.claude');
};

export const getUserClaudeSettingsPath = (
  processEnv?: Record<string, string | undefined>,
): string => path.join(getClaudeConfigDir(processEnv), 'settings.json');

export const getClaudeCredentialsPath = (
  processEnv?: Record<string, string | undefined>,
): string => path.join(getClaudeConfigDir(processEnv), '.credentials.json');

/**
 * Walks up from `cwd` to find the nearest directory holding a `.claude`
 * settings file, matching how Claude Code picks up project settings when it is
 * launched from a subdirectory.
 */
export const findProjectClaudeSettingsDir = (cwd: string): string | null => {
  let current: string;
  try {
    current = path.resolve(cwd);
  } catch {
    return null;
  }

  for (let depth = 0; depth < PROJECT_LOOKUP_MAX_DEPTH; depth += 1) {
    const claudeDir = path.join(current, '.claude');
    if (
      fs.existsSync(path.join(claudeDir, 'settings.json'))
      || fs.existsSync(path.join(claudeDir, 'settings.local.json'))
    ) {
      return claudeDir;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
};

const buildFileLayer = (
  scope: ClaudeSettingsScope,
  filePath: string,
): ClaudeSettingsLayer | null => {
  const settings = readJsonObject(filePath);
  if (!settings) return null;
  return {
    scope,
    path: filePath,
    settings,
    env: pickClaudeEnv(getNestedRecord(settings, 'env')),
  };
};

const buildProcessEnvLayer = (
  processEnv: Record<string, string | undefined>,
): ClaudeSettingsLayer | null => {
  const env = pickClaudeEnv(processEnv as Record<string, unknown>);
  if (Object.keys(env).length === 0) return null;
  return {
    scope: ClaudeSettingsScope.ProcessEnv,
    path: '(process environment)',
    settings: {},
    env,
  };
};

export type ClaudeCodeLiveConfigOptions = {
  /** Working directory of the session, used to locate project settings. */
  cwd?: string | null;
  /** Ambient environment to treat as the lowest-priority layer. */
  processEnv?: Record<string, string | undefined>;
  /** Overrides the enterprise managed-settings location; for tests. */
  managedSettingsPath?: string | null;
};

/**
 * Collects every settings layer that exists on disk, highest precedence first.
 */
export const collectClaudeSettingsLayers = (
  options: ClaudeCodeLiveConfigOptions = {},
): ClaudeSettingsLayer[] => {
  const layers: ClaudeSettingsLayer[] = [];

  const managedPath = options.managedSettingsPath === undefined
    ? getManagedClaudeSettingsPath()
    : options.managedSettingsPath;
  const managed = managedPath ? buildFileLayer(ClaudeSettingsScope.Managed, managedPath) : null;
  if (managed) layers.push(managed);

  const projectDir = options.cwd ? findProjectClaudeSettingsDir(options.cwd) : null;
  if (projectDir) {
    const projectLocal = buildFileLayer(
      ClaudeSettingsScope.ProjectLocal,
      path.join(projectDir, 'settings.local.json'),
    );
    if (projectLocal) layers.push(projectLocal);
    const project = buildFileLayer(
      ClaudeSettingsScope.Project,
      path.join(projectDir, 'settings.json'),
    );
    if (project) layers.push(project);
  }

  const ambientEnv = options.processEnv ?? process.env;
  const user = buildFileLayer(ClaudeSettingsScope.User, getUserClaudeSettingsPath(ambientEnv));
  if (user) layers.push(user);

  const processEnv = buildProcessEnvLayer(ambientEnv);
  if (processEnv) layers.push(processEnv);

  return layers.sort(
    (left, right) => SCOPE_PRIORITY.indexOf(left.scope) - SCOPE_PRIORITY.indexOf(right.scope),
  );
};

const pickCredentialSource = (
  env: Partial<Record<ClaudeEnvKey, string>>,
  envScopes: Partial<Record<ClaudeEnvKey, ClaudeSettingsScope>>,
): ClaudeCredentialEnvKey | null => {
  const hasAuthToken = Boolean(env.ANTHROPIC_AUTH_TOKEN);
  const hasApiKey = Boolean(env.ANTHROPIC_API_KEY);
  if (!hasAuthToken && !hasApiKey) return null;
  if (hasAuthToken && !hasApiKey) return ClaudeCredentialEnvKey.AuthToken;
  if (!hasAuthToken && hasApiKey) return ClaudeCredentialEnvKey.ApiKey;
  if (env.ANTHROPIC_AUTH_TOKEN === env.ANTHROPIC_API_KEY) return ClaudeCredentialEnvKey.AuthToken;

  // Both are set to different values: the one from the higher-precedence layer
  // is the one Claude Code would honour.
  const authRank = SCOPE_PRIORITY.indexOf(envScopes.ANTHROPIC_AUTH_TOKEN ?? ClaudeSettingsScope.ProcessEnv);
  const apiKeyRank = SCOPE_PRIORITY.indexOf(envScopes.ANTHROPIC_API_KEY ?? ClaudeSettingsScope.ProcessEnv);
  return apiKeyRank < authRank ? ClaudeCredentialEnvKey.ApiKey : ClaudeCredentialEnvKey.AuthToken;
};

/**
 * Resolves the effective Claude Code config by merging every settings layer.
 * Never writes to disk.
 */
export const resolveClaudeCodeLiveConfig = (
  options: ClaudeCodeLiveConfigOptions = {},
): ClaudeCodeLiveConfig => {
  const layers = collectClaudeSettingsLayers(options);

  const env: Partial<Record<ClaudeEnvKey, string>> = {};
  const envScopes: Partial<Record<ClaudeEnvKey, ClaudeSettingsScope>> = {};
  const appliedKeysByPath = new Map<string, ClaudeCodeLiveConfigSource>();

  const recordApplied = (layer: ClaudeSettingsLayer, key: string): void => {
    const existing = appliedKeysByPath.get(layer.path);
    if (existing) {
      existing.appliedKeys.push(key);
      return;
    }
    appliedKeysByPath.set(layer.path, {
      scope: layer.scope,
      path: layer.path,
      appliedKeys: [key],
    });
  };

  // Layers are ordered highest-precedence first, so the first writer of a key wins.
  for (const layer of layers) {
    for (const key of CLAUDE_ENV_KEYS) {
      const value = layer.env[key];
      if (!value || env[key] !== undefined) continue;
      env[key] = value;
      envScopes[key] = layer.scope;
      recordApplied(layer, key);
    }
  }

  let model = '';
  let modelScope: ClaudeSettingsScope | null = null;
  let modelPath = '';
  for (const key of CLAUDE_MODEL_ENV_KEYS) {
    const value = env[key];
    if (value) {
      model = value;
      modelScope = envScopes[key] ?? null;
      modelPath = layers.find((layer) => layer.scope === modelScope)?.path ?? '';
      break;
    }
  }
  if (!model) {
    for (const layer of layers) {
      const topLevelModel = getString(layer.settings.model);
      if (topLevelModel && !looksLikePlaceholder(topLevelModel)) {
        model = topLevelModel;
        modelScope = layer.scope;
        modelPath = layer.path;
        recordApplied(layer, 'model');
        break;
      }
    }
  }

  const credentialSource = pickCredentialSource(env, envScopes);
  const usesOfficialLogin = !credentialSource
    && fs.existsSync(getClaudeCredentialsPath(options.processEnv ?? process.env));

  const sources = Array.from(appliedKeysByPath.values()).sort(
    (left, right) => SCOPE_PRIORITY.indexOf(left.scope) - SCOPE_PRIORITY.indexOf(right.scope),
  );

  const fallbackLayer = layers[0] ?? null;
  return {
    env,
    envScopes,
    model,
    resolvedModel: resolveClaudeModelAlias(model),
    baseUrl: env.ANTHROPIC_BASE_URL ?? '',
    credentialSource,
    usesOfficialLogin,
    primaryScope: modelScope ?? fallbackLayer?.scope ?? null,
    primarySourcePath: modelPath || fallbackLayer?.path || '',
    sources,
    inspectedPaths: layers.map((layer) => layer.path),
  };
};

/**
 * True when the machine has something Claude Code could actually run with —
 * either explicit settings or an official OAuth login.
 */
export const hasUsableClaudeCodeLiveConfig = (config: ClaudeCodeLiveConfig): boolean => (
  Boolean(config.model || config.baseUrl || config.credentialSource || config.usesOfficialLogin)
);
