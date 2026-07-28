#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');

const { parseReleaseVersion, readPackageVersion } = require('./release-version.cjs');

function parseArguments(args) {
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(argument => argument !== '--dry-run');
  const unknownOption = positional.find(argument => argument.startsWith('-'));

  if (unknownOption || positional.length !== 1) {
    throw new Error('Usage: npm run release:tag -- <version> [--dry-run]');
  }

  return {
    dryRun,
    requestedVersion: positional[0],
  };
}

function runGit(args, { cwd, allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !allowFailure) {
    const details = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed${details ? `: ${details}` : '.'}`);
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function runReleaseTag({
  requestedVersion,
  dryRun = false,
  projectRoot = process.cwd(),
  git = (args, options) => runGit(args, { cwd: projectRoot, ...options }),
  packageVersion = readPackageVersion(projectRoot),
  log = message => console.log(`[release:tag] ${message}`),
} = {}) {
  const metadata = parseReleaseVersion(requestedVersion);
  const normalizedPackageVersion = parseReleaseVersion(packageVersion).version;

  if (metadata.version !== normalizedPackageVersion) {
    throw new Error(
      `Requested version ${metadata.version} does not match package.json version ${normalizedPackageVersion}.`,
    );
  }

  const branch = git(['branch', '--show-current']).stdout.trim();
  if (branch !== 'main') {
    throw new Error(
      `Release tags must be created from main; current branch is ${branch || '<detached>'}.`,
    );
  }

  const worktreeStatus = git(['status', '--porcelain']).stdout.trim();
  if (worktreeStatus) {
    throw new Error('Release tags require a clean working tree.');
  }

  const localTag = git(['tag', '--list', metadata.tag]).stdout.trim();
  if (localTag) {
    throw new Error(`Tag ${metadata.tag} already exists locally.`);
  }

  log('Fetching origin/main.');
  git(['fetch', 'origin', 'main', '--no-tags']);

  const localHead = git(['rev-parse', 'HEAD']).stdout.trim();
  const remoteHead = git(['rev-parse', 'refs/remotes/origin/main']).stdout.trim();
  if (!localHead || localHead !== remoteHead) {
    throw new Error('Local main must exactly match origin/main before creating a release tag.');
  }

  const remoteTag = git([
    'ls-remote',
    '--tags',
    'origin',
    `refs/tags/${metadata.tag}`,
    `refs/tags/${metadata.tag}^{}`,
  ]).stdout.trim();
  if (remoteTag) {
    throw new Error(`Tag ${metadata.tag} already exists on origin.`);
  }

  if (dryRun) {
    log(`Dry run passed. ${metadata.tag} is ready to be created from ${localHead}.`);
    return {
      ...metadata,
      dryRun: true,
      head: localHead,
    };
  }

  git(['tag', '--annotate', metadata.tag, '--message', `Release ${metadata.tag}`]);

  try {
    git(['push', '--atomic', 'origin', `refs/tags/${metadata.tag}:refs/tags/${metadata.tag}`]);
  } catch (error) {
    git(['tag', '--delete', metadata.tag], { allowFailure: true });
    throw error;
  }

  log(`Pushed ${metadata.tag}. GitHub Actions will build and publish all release assets.`);
  return {
    ...metadata,
    dryRun: false,
    head: localHead,
  };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  runReleaseTag(options);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[release:tag] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  parseArguments,
  runReleaseTag,
};
