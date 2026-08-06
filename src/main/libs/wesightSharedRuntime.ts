import os from 'os';
import path from 'path';

function expandHome(value: string, home: string): string {
  if (value === '~') return home;
  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(home, value.slice(2));
  }
  return value;
}

export function getWesightSharedHome(
  env: NodeJS.ProcessEnv = process.env,
  home: string = os.homedir(),
): string {
  const configured = env.WESIGHT_HOME?.trim();
  return configured ? expandHome(configured, home) : path.join(home, '.wesight');
}

export function getWesightLarkCliBinDir(
  env: NodeJS.ProcessEnv = process.env,
  home: string = os.homedir(),
): string {
  return path.join(
    getWesightSharedHome(env, home),
    'runtimes',
    'lark-cli',
    'node_modules',
    '.bin',
  );
}

export function getSharedAgentSkillsRoot(home: string = os.homedir()): string {
  return path.join(home, '.agents', 'skills');
}

export function prependWesightSharedRuntimeBin(
  env: Record<string, string | undefined>,
  home: string = os.homedir(),
): void {
  const current = env.PATH ?? '';
  const sharedBin = getWesightLarkCliBinDir(env as NodeJS.ProcessEnv, home);
  const entries = current.split(path.delimiter).filter(Boolean);
  if (!entries.includes(sharedBin)) {
    env.PATH = [sharedBin, ...entries].join(path.delimiter);
  }
}
