#!/usr/bin/env node
'use strict';

const { readPackageVersion, resolveReleaseMetadata } = require('./release-version.cjs');

function parseArguments(args) {
  if (args.length === 0) {
    return {};
  }

  if (args.length === 2 && args[0] === '--tag') {
    return { tag: args[1] };
  }

  throw new Error('Usage: node scripts/release-metadata.cjs [--tag v1.0.1]');
}

function main() {
  const { tag } = parseArguments(process.argv.slice(2));
  const metadata = resolveReleaseMetadata({
    tag,
    packageVersion: readPackageVersion(),
  });

  process.stdout.write(
    [
      `version=${metadata.version}`,
      `tag=${metadata.tag}`,
      `prerelease=${metadata.prerelease}`,
      '',
    ].join('\n'),
  );
}

try {
  main();
} catch (error) {
  console.error(`[release-metadata] ${error.message}`);
  process.exitCode = 1;
}
