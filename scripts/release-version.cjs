'use strict';

const fs = require('fs');
const path = require('path');

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function parseReleaseVersion(input) {
  const version = typeof input === 'string' ? input.trim() : '';
  const match = semverPattern.exec(version);

  if (!match) {
    throw new Error(`Release version must be valid SemVer, received: ${input || '<empty>'}`);
  }

  return {
    version,
    tag: `v${version}`,
    prerelease: Boolean(match[4]),
  };
}

function parseReleaseTag(input) {
  const tag = typeof input === 'string' ? input.trim() : '';
  if (!tag.startsWith('v')) {
    throw new Error(`Release tag must start with v, received: ${input || '<empty>'}`);
  }

  const metadata = parseReleaseVersion(tag.slice(1));
  return {
    ...metadata,
    tag,
  };
}

function readPackageVersion(projectRoot = path.resolve(__dirname, '..')) {
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return parseReleaseVersion(packageJson.version).version;
}

function resolveReleaseVersion({
  environment = process.env,
  packageVersion = readPackageVersion(),
} = {}) {
  const requestedVersion = environment.WESIGHT_RELEASE_VERSION?.trim() || packageVersion;
  return parseReleaseVersion(requestedVersion);
}

function resolveReleaseMetadata({ tag, packageVersion = readPackageVersion() } = {}) {
  const packageMetadata = parseReleaseVersion(packageVersion);
  const releaseMetadata = tag ? parseReleaseTag(tag) : packageMetadata;

  if (releaseMetadata.version !== packageMetadata.version) {
    throw new Error(
      `Tag ${releaseMetadata.tag} does not match package.json version ${packageMetadata.version}.`,
    );
  }

  return releaseMetadata;
}

module.exports = {
  parseReleaseTag,
  parseReleaseVersion,
  readPackageVersion,
  resolveReleaseMetadata,
  resolveReleaseVersion,
};
