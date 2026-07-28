export const SettingsTab = {
  General: 'general',
  CoworkAgentEngine: 'coworkAgentEngine',
  Model: 'model',
  CoworkMemory: 'coworkMemory',
  CoworkAgent: 'coworkAgent',
  Agents: 'agents',
  Shortcuts: 'shortcuts',
  Im: 'im',
  Email: 'email',
  ScheduledTasks: 'scheduledTasks',
  Mcp: 'mcp',
  ThemeSkin: 'themeSkin',
  About: 'about',
} as const;

export type SettingsTab = typeof SettingsTab[keyof typeof SettingsTab];
