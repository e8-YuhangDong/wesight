import { createRequire } from 'node:module';

import { describe, expect, test, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  parseReleaseTag,
  parseReleaseVersion,
  resolveReleaseMetadata,
} = require('./release-version.cjs');
const { parseArguments, runReleaseTag } = require('./release-tag.cjs');

interface GitState {
  branch: string;
  dirty: boolean;
  localHead: string;
  remoteHead: string;
  localTag: boolean;
  remoteTag: boolean;
}

function createGit(overrides: Partial<GitState> = {}) {
  const state: GitState = {
    branch: 'main',
    dirty: false,
    localHead: 'abc123',
    remoteHead: 'abc123',
    localTag: false,
    remoteTag: false,
    ...overrides,
  };
  const calls: string[][] = [];

  const git = vi.fn((args: string[]) => {
    calls.push(args);
    const command = args.join(' ');

    if (command === 'branch --show-current') {
      return { status: 0, stdout: `${state.branch}\n`, stderr: '' };
    }
    if (command === 'status --porcelain') {
      return {
        status: 0,
        stdout: state.dirty ? ' M package.json\n' : '',
        stderr: '',
      };
    }
    if (command === 'fetch origin main --no-tags') {
      return { status: 0, stdout: '', stderr: '' };
    }
    if (command === 'rev-parse HEAD') {
      return { status: 0, stdout: `${state.localHead}\n`, stderr: '' };
    }
    if (command === 'rev-parse refs/remotes/origin/main') {
      return { status: 0, stdout: `${state.remoteHead}\n`, stderr: '' };
    }
    if (command === 'tag --list v1.0.1') {
      return {
        status: 0,
        stdout: state.localTag ? 'v1.0.1\n' : '',
        stderr: '',
      };
    }
    if (command.startsWith('ls-remote --tags origin ')) {
      return {
        status: 0,
        stdout: state.remoteTag ? 'abc123\trefs/tags/v1.0.1\n' : '',
        stderr: '',
      };
    }
    if (command.startsWith('tag --annotate v1.0.1')) {
      return { status: 0, stdout: '', stderr: '' };
    }
    if (command.startsWith('push --atomic origin ')) {
      return { status: 0, stdout: '', stderr: '' };
    }

    throw new Error(`Unexpected git command: ${command}`);
  });

  return { calls, git };
}

describe('release version parsing', () => {
  test('parses a stable SemVer version', () => {
    expect(parseReleaseVersion('1.0.1')).toEqual({
      version: '1.0.1',
      tag: 'v1.0.1',
      prerelease: false,
    });
  });

  test('parses a prerelease SemVer tag', () => {
    expect(parseReleaseTag('v1.1.0-rc.1')).toEqual({
      version: '1.1.0-rc.1',
      tag: 'v1.1.0-rc.1',
      prerelease: true,
    });
  });

  test('parses prerelease and build identifiers', () => {
    expect(parseReleaseVersion('1.2.3-alpha.1+build.007')).toEqual({
      version: '1.2.3-alpha.1+build.007',
      tag: 'v1.2.3-alpha.1+build.007',
      prerelease: true,
    });
  });

  test('rejects an invalid SemVer version', () => {
    expect(() => parseReleaseVersion('1.0')).toThrow('Release version must be valid SemVer');
  });

  test.each(['01.0.0', '1.0.0-01', '1.0.0-', '1.0.0+', '1.0.0+build..1'])(
    'rejects invalid SemVer %s',
    version => {
      expect(() => parseReleaseVersion(version)).toThrow('Release version must be valid SemVer');
    },
  );

  test('handles a long invalid prerelease in linear time', () => {
    const version = `0.0.0-0.${'--.'.repeat(10_000)}`;
    expect(() => parseReleaseVersion(version)).toThrow('Release version must be valid SemVer');
  });

  test('rejects a tag that does not match package.json', () => {
    expect(() =>
      resolveReleaseMetadata({
        tag: 'v1.0.2',
        packageVersion: '1.0.1',
      }),
    ).toThrow('does not match package.json version 1.0.1');
  });
});

describe('release tag command', () => {
  test('parses --dry-run after the version', () => {
    expect(parseArguments(['1.0.1', '--dry-run'])).toEqual({
      requestedVersion: '1.0.1',
      dryRun: true,
    });
  });

  test('rejects a version mismatch', () => {
    const { git } = createGit();
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.2',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('does not match package.json version 1.0.1');
  });

  test('rejects a release without prepared Chinese notes', () => {
    const { git } = createGit();
    expect(() =>
      runReleaseTag({
        requestedVersion: '9.9.9',
        packageVersion: '9.9.9',
        git,
      }),
    ).toThrow('No Chinese release notes found for v9.9.9');
  });

  test('rejects a dirty working tree', () => {
    const { git } = createGit({ dirty: true });
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.1',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('clean working tree');
  });

  test('rejects a branch other than main', () => {
    const { git } = createGit({ branch: 'feature/release' });
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.1',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('current branch is feature/release');
  });

  test('rejects a local main that differs from origin/main', () => {
    const { git } = createGit({ remoteHead: 'def456' });
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.1',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('must exactly match origin/main');
  });

  test('rejects an existing local tag', () => {
    const { git } = createGit({ localTag: true });
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.1',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('already exists locally');
  });

  test('rejects an existing remote tag', () => {
    const { git } = createGit({ remoteTag: true });
    expect(() =>
      runReleaseTag({
        requestedVersion: '1.0.1',
        packageVersion: '1.0.1',
        git,
      }),
    ).toThrow('already exists on origin');
  });

  test('performs every check without creating a tag during a dry run', () => {
    const { calls, git } = createGit();
    const result = runReleaseTag({
      requestedVersion: '1.0.1',
      packageVersion: '1.0.1',
      dryRun: true,
      git,
      log: vi.fn(),
    });

    expect(result).toMatchObject({
      version: '1.0.1',
      tag: 'v1.0.1',
      dryRun: true,
    });
    expect(calls.some(args => args[0] === 'tag' && args[1] === '--annotate')).toBe(false);
    expect(calls.some(args => args[0] === 'push')).toBe(false);
  });

  test('creates an annotated tag and pushes it atomically', () => {
    const { calls, git } = createGit();
    const result = runReleaseTag({
      requestedVersion: '1.0.1',
      packageVersion: '1.0.1',
      git,
      log: vi.fn(),
    });

    expect(result.dryRun).toBe(false);
    expect(calls).toContainEqual(['tag', '--annotate', 'v1.0.1', '--message', 'Release v1.0.1']);
    expect(calls).toContainEqual([
      'push',
      '--atomic',
      'origin',
      'refs/tags/v1.0.1:refs/tags/v1.0.1',
    ]);
  });
});
