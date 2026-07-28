#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');

const { resolveReleaseVersion } = require('./release-version.cjs');

const metadata = resolveReleaseVersion();
const electronBuilderCli = require.resolve('electron-builder/cli.js');
const args = [...process.argv.slice(2), `-c.extraMetadata.version=${metadata.version}`];

console.log(`[build] Using release version ${metadata.version}.`);

const result = spawnSync(process.execPath, [electronBuilderCli, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    WESIGHT_RELEASE_VERSION: metadata.version,
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
