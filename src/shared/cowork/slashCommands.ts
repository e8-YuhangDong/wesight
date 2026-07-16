export const CoworkGraphicalSlashCommand = {
  Model: '/model',
  Context: '/context',
  Status: '/status',
  Help: '/help',
  Clear: '/clear',
  New: '/new',
  Config: '/config',
  Permissions: '/permissions',
  Mcp: '/mcp',
  Agent: '/agent',
  Agents: '/agents',
  Skills: '/skills',
  Memory: '/memory',
} as const;

export const ClaudeCodeNativeSlashCommand = {
  Goal: '/goal',
  Compact: '/compact',
  Init: '/init',
  ReloadSkills: '/reload-skills',
  Review: '/review',
  SecurityReview: '/security-review',
  Usage: '/usage',
  Insights: '/insights',
  Recap: '/recap',
  Design: '/design',
  TeamOnboarding: '/team-onboarding',
} as const;

const CLAUDE_CODE_SLASH_INPUT_PATTERN = /^\/[^\s/]+(?:\s|$)/;

export const isClaudeCodeSlashInput = (value: string): boolean => (
  CLAUDE_CODE_SLASH_INPUT_PATTERN.test(value.trim())
);
