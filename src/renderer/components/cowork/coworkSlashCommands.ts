import { CoworkAgentEngine } from '@shared/cowork/constants';
import {
  ClaudeCodeNativeSlashCommand,
  CoworkGraphicalSlashCommand,
} from '@shared/cowork/slashCommands';

export interface CoworkSlashCommandEntry {
  command: string;
  descriptionKey: string;
}

export const WESIGHT_SLASH_COMMANDS: CoworkSlashCommandEntry[] = [
  { command: CoworkGraphicalSlashCommand.Model, descriptionKey: 'coworkSlashCommandModel' },
  { command: CoworkGraphicalSlashCommand.Context, descriptionKey: 'coworkSlashCommandContext' },
  { command: CoworkGraphicalSlashCommand.Status, descriptionKey: 'coworkSlashCommandStatus' },
  { command: CoworkGraphicalSlashCommand.Help, descriptionKey: 'coworkSlashCommandHelp' },
  { command: CoworkGraphicalSlashCommand.Clear, descriptionKey: 'coworkSlashCommandClear' },
  { command: CoworkGraphicalSlashCommand.New, descriptionKey: 'coworkSlashCommandNew' },
  { command: CoworkGraphicalSlashCommand.Config, descriptionKey: 'coworkSlashCommandConfig' },
  { command: CoworkGraphicalSlashCommand.Permissions, descriptionKey: 'coworkSlashCommandPermissions' },
  { command: CoworkGraphicalSlashCommand.Mcp, descriptionKey: 'coworkSlashCommandMcp' },
  { command: CoworkGraphicalSlashCommand.Agents, descriptionKey: 'coworkSlashCommandAgents' },
  { command: CoworkGraphicalSlashCommand.Skills, descriptionKey: 'coworkSlashCommandSkills' },
  { command: CoworkGraphicalSlashCommand.Memory, descriptionKey: 'coworkSlashCommandMemory' },
];

export const CLAUDE_CODE_NATIVE_SLASH_COMMANDS: CoworkSlashCommandEntry[] = [
  { command: ClaudeCodeNativeSlashCommand.Goal, descriptionKey: 'coworkSlashCommandGoal' },
  { command: ClaudeCodeNativeSlashCommand.Compact, descriptionKey: 'coworkSlashCommandCompact' },
  { command: ClaudeCodeNativeSlashCommand.Init, descriptionKey: 'coworkSlashCommandInit' },
  { command: ClaudeCodeNativeSlashCommand.ReloadSkills, descriptionKey: 'coworkSlashCommandReloadSkills' },
  { command: ClaudeCodeNativeSlashCommand.Review, descriptionKey: 'coworkSlashCommandReview' },
  { command: ClaudeCodeNativeSlashCommand.SecurityReview, descriptionKey: 'coworkSlashCommandSecurityReview' },
  { command: ClaudeCodeNativeSlashCommand.Usage, descriptionKey: 'coworkSlashCommandUsage' },
  { command: ClaudeCodeNativeSlashCommand.Insights, descriptionKey: 'coworkSlashCommandInsights' },
  { command: ClaudeCodeNativeSlashCommand.Recap, descriptionKey: 'coworkSlashCommandRecap' },
  { command: ClaudeCodeNativeSlashCommand.Design, descriptionKey: 'coworkSlashCommandDesign' },
  { command: ClaudeCodeNativeSlashCommand.TeamOnboarding, descriptionKey: 'coworkSlashCommandTeamOnboarding' },
];

export const getCoworkSlashCommandsForEngine = (
  engine: CoworkAgentEngine | undefined,
): CoworkSlashCommandEntry[] => (
  engine === CoworkAgentEngine.ClaudeCode
    ? [...WESIGHT_SLASH_COMMANDS, ...CLAUDE_CODE_NATIVE_SLASH_COMMANDS]
    : WESIGHT_SLASH_COMMANDS
);
