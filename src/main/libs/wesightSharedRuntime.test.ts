import path from 'path';
import { expect, test } from 'vitest';

import {
  getSharedAgentSkillsRoot,
  getWesightLarkCliBinDir,
  getWesightSharedHome,
  prependWesightSharedRuntimeBin,
} from './wesightSharedRuntime';

test('resolves the shared lark-cli runtime from WESIGHT_HOME', () => {
  const env = {
    WESIGHT_HOME: '/tmp/wesight-shared',
    PATH: '/usr/bin',
  } as NodeJS.ProcessEnv;
  expect(getWesightSharedHome(env, '/tmp/home')).toBe('/tmp/wesight-shared');
  expect(getWesightLarkCliBinDir(env, '/tmp/home')).toBe(
    '/tmp/wesight-shared/runtimes/lark-cli/node_modules/.bin',
  );
});

test('prepends the shared runtime once and exposes the shared skills root', () => {
  const env: Record<string, string | undefined> = {
    PATH: ['/usr/bin', '/bin'].join(path.delimiter),
  };
  prependWesightSharedRuntimeBin(env, '/tmp/home');
  prependWesightSharedRuntimeBin(env, '/tmp/home');
  const entries = env.PATH?.split(path.delimiter) ?? [];
  expect(entries[0]).toBe('/tmp/home/.wesight/runtimes/lark-cli/node_modules/.bin');
  expect(entries.filter(entry => entry.includes('runtimes/lark-cli'))).toHaveLength(1);
  expect(getSharedAgentSkillsRoot('/tmp/home')).toBe('/tmp/home/.agents/skills');
});
