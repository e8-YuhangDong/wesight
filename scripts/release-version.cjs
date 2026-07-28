'use strict';

const fs = require('fs');
const path = require('path');

function isNumericIdentifier(value) {
  if (!value) return false;
  return [...value].every(character => character >= '0' && character <= '9');
}

function isSemverIdentifier(value) {
  if (!value) return false;
  return [...value].every(
    character =>
      (character >= '0' && character <= '9') ||
      (character >= 'A' && character <= 'Z') ||
      (character >= 'a' && character <= 'z') ||
      character === '-',
  );
}

function hasValidCoreIdentifiers(core) {
  const identifiers = core.split('.');
  return (
    identifiers.length === 3 &&
    identifiers.every(
      identifier =>
        isNumericIdentifier(identifier) && (identifier === '0' || !identifier.startsWith('0')),
    )
  );
}

function hasValidPrereleaseIdentifiers(prerelease) {
  return prerelease.split('.').every(identifier => {
    if (!isSemverIdentifier(identifier)) return false;
    return !isNumericIdentifier(identifier) || identifier === '0' || !identifier.startsWith('0');
  });
}

function hasValidBuildIdentifiers(build) {
  return build.split('.').every(isSemverIdentifier);
}

function parseReleaseVersion(input) {
  const version = typeof input === 'string' ? input.trim() : '';
  const buildSeparator = version.indexOf('+');
  const hasMultipleBuildSeparators =
    buildSeparator >= 0 && version.indexOf('+', buildSeparator + 1) >= 0;
  const versionWithoutBuild = buildSeparator >= 0 ? version.slice(0, buildSeparator) : version;
  const build = buildSeparator >= 0 ? version.slice(buildSeparator + 1) : undefined;

  const prereleaseSeparator = versionWithoutBuild.indexOf('-');
  const core =
    prereleaseSeparator >= 0
      ? versionWithoutBuild.slice(0, prereleaseSeparator)
      : versionWithoutBuild;
  const prerelease =
    prereleaseSeparator >= 0 ? versionWithoutBuild.slice(prereleaseSeparator + 1) : undefined;

  if (
    hasMultipleBuildSeparators ||
    !hasValidCoreIdentifiers(core) ||
    (prerelease !== undefined && !hasValidPrereleaseIdentifiers(prerelease)) ||
    (build !== undefined && !hasValidBuildIdentifiers(build))
  ) {
    throw new Error(`Release version must be valid SemVer, received: ${input || '<empty>'}`);
  }

  return {
    version,
    tag: `v${version}`,
    prerelease: prerelease !== undefined,
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
