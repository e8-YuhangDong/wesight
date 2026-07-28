'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MacArtifactTarget = {
  X64: 'mac-x64',
  Arm64: 'mac-arm64',
};

const NativeArchToken = {
  [MacArtifactTarget.X64]: 'x86_64',
  [MacArtifactTarget.Arm64]: 'arm64',
};

const NativeTargetPathToken = {
  [MacArtifactTarget.X64]: ['x64-darwin', 'darwin-x64'],
  [MacArtifactTarget.Arm64]: ['arm64-darwin', 'darwin-arm64'],
};

const PackagedNativePathToken = [
  ...Object.values(NativeTargetPathToken).flat(),
  'x64-linux',
  'linux-x64',
  'arm64-linux',
  'linux-arm64',
  'x64-win32',
  'win32-x64',
  'arm64-win32',
  'win32-arm64',
];

const rootDir = path.resolve(__dirname, '..');
const target = (process.argv[2] || '').trim();

function fail(message) {
  console.error(`[verify-mac-artifact] ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[verify-mac-artifact] ${message}`);
}

if (!Object.values(MacArtifactTarget).includes(target)) {
  fail(`Usage: node scripts/verify-mac-artifact.cjs ${MacArtifactTarget.X64}|${MacArtifactTarget.Arm64}`);
}

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      visitor(fullPath, entry);
      walk(fullPath, visitor);
    } else {
      visitor(fullPath, entry);
    }
  }
}

function findPackagedApps() {
  const releaseDir = path.join(rootDir, 'release');
  const apps = [];
  walk(releaseDir, (candidate, entry) => {
    if (entry.isDirectory() && candidate.endsWith('.app')) {
      apps.push(candidate);
    }
  });
  return apps.sort();
}

function runFile(filePath) {
  const result = runCommand('file', [filePath]);
  return (result.stdout || '').trim();
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    fail(
      `${command} failed: ${
        result.stderr || result.stdout || result.error?.message || 'unknown error'
      }`,
    );
  }
  return result;
}

function selectApp(apps, expectedToken) {
  const matching = apps.find((appPath) => {
    const executablePath = path.join(appPath, 'Contents', 'MacOS', 'WeSight');
    return fs.existsSync(executablePath) && runFile(executablePath).includes(expectedToken);
  });
  if (matching) return matching;
  return apps[0] || null;
}

function assertFileHasArch(filePath, expectedToken) {
  const output = runFile(filePath);
  if (!output.includes(expectedToken)) {
    fail(`Expected ${filePath} to include ${expectedToken}, got: ${output}`);
  }
  log(output);
}

function findDmg(expectedArch) {
  const releaseDir = path.join(rootDir, 'release');
  if (!fs.existsSync(releaseDir)) return null;

  const matching = fs
    .readdirSync(releaseDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(`.mac.${expectedArch}.dmg`),
    )
    .map((entry) => path.join(releaseDir, entry.name))
    .sort(
      (left, right) =>
        fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs,
    );

  return matching[0] || null;
}

function assertAppleDistributionReady(appPath, expectedArch) {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!teamId) {
    fail('APPLE_TEAM_ID is required for Apple distribution verification.');
  }

  runCommand('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath]);
  const signature = runCommand('codesign', ['-dv', '--verbose=4', appPath]);
  const signatureDetails = `${signature.stdout || ''}\n${signature.stderr || ''}`;
  if (!signatureDetails.includes('Authority=Developer ID Application:')) {
    fail('The packaged app is not signed with a Developer ID Application certificate.');
  }
  if (!signatureDetails.includes(`TeamIdentifier=${teamId}`)) {
    fail(`The packaged app signature does not use Apple team ${teamId}.`);
  }

  runCommand('xcrun', ['stapler', 'validate', '-v', appPath]);
  runCommand('spctl', ['--assess', '--type', 'execute', '--verbose=4', appPath]);

  const dmgPath = findDmg(expectedArch);
  if (!dmgPath) {
    fail(`No ${expectedArch} DMG was found under ${path.join(rootDir, 'release')}.`);
  }

  runCommand('codesign', ['--verify', '--strict', '--verbose=2', dmgPath]);
  runCommand('xcrun', ['stapler', 'validate', '-v', dmgPath]);
  runCommand('spctl', [
    '--assess',
    '--type',
    'open',
    '--context',
    'context:primary-signature',
    '--verbose=4',
    dmgPath,
  ]);

  log(`Verified Developer ID signing and notarization for ${dmgPath}.`);
}

function shouldInspectNativeModule(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const targetPathTokens = NativeTargetPathToken[target];
  const pathSegments = normalizedPath.split('/');
  const hasTargetToken = (tokens) =>
    tokens.some((token) =>
      pathSegments.some(
        (segment) =>
          segment === token ||
          segment.startsWith(`${token}-`) ||
          segment.includes(`-${token}`),
      ),
    );

  if (hasTargetToken(targetPathTokens)) {
    return true;
  }

  return !hasTargetToken(PackagedNativePathToken);
}

const apps = findPackagedApps();
const expectedArchToken = NativeArchToken[target];
const appPath = selectApp(apps, expectedArchToken);
if (!appPath) {
  fail(`No packaged .app found under ${path.join(rootDir, 'release')}`);
}

const executablePath = path.join(appPath, 'Contents', 'MacOS', 'WeSight');

log(`Checking ${appPath}`);

if (!fs.existsSync(executablePath)) {
  fail(`Packaged app executable is missing: ${executablePath}`);
}
assertFileHasArch(executablePath, expectedArchToken);

const nativeModules = [];
const skippedNativeModules = [];
walk(appPath, (candidate, entry) => {
  if (!entry.isFile() || !candidate.endsWith('.node')) {
    return;
  }

  if (shouldInspectNativeModule(candidate)) {
    nativeModules.push(candidate);
  } else {
    skippedNativeModules.push(candidate);
  }
});

if (nativeModules.length === 0) {
  fail('No native .node modules were found in the packaged app.');
}

for (const nativeModule of nativeModules.sort()) {
  assertFileHasArch(nativeModule, expectedArchToken);
}

log(`Verified ${nativeModules.length} native module(s).`);
if (skippedNativeModules.length > 0) {
  log(`Skipped ${skippedNativeModules.length} non-target vendor native module(s).`);
}

if (process.env.WESIGHT_REQUIRE_APPLE_NOTARIZATION === 'true') {
  const artifactArch = target === MacArtifactTarget.X64 ? 'x64' : 'arm64';
  assertAppleDistributionReady(appPath, artifactArch);
}
