#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { resolveReleaseVersion } = require('./release-version.cjs');

const PeMachine = {
  X64: 0x8664,
};

function fail(message) {
  throw new Error(`[verify-windows-artifact] ${message}`);
}

function assertNonEmptyFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(`Missing required file: ${filePath}`);
  }

  if (fs.statSync(filePath).size === 0) {
    fail(`Required file is empty: ${filePath}`);
  }
}

function readPeMachine(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 64 || buffer.toString('ascii', 0, 2) !== 'MZ') {
    fail(`${filePath} is not a valid PE executable.`);
  }

  const peHeaderOffset = buffer.readUInt32LE(0x3c);
  if (
    peHeaderOffset + 6 > buffer.length ||
    buffer.toString('binary', peHeaderOffset, peHeaderOffset + 4) !== 'PE\u0000\u0000'
  ) {
    fail(`${filePath} has an invalid PE header.`);
  }

  return buffer.readUInt16LE(peHeaderOffset + 4);
}

function verifyWindowsArtifact({
  projectRoot = path.resolve(__dirname, '..'),
  metadata = resolveReleaseVersion(),
} = {}) {
  const releaseDir = path.join(projectRoot, 'release');
  const executablePath = path.join(releaseDir, 'win-unpacked', 'WeSight.exe');
  const installerPath = path.join(releaseDir, `WeSight.Setup.${metadata.version}.exe`);
  const blockmapPath = `${installerPath}.blockmap`;
  const updateMetadataPath = path.join(releaseDir, 'latest.yml');

  for (const filePath of [executablePath, installerPath, blockmapPath, updateMetadataPath]) {
    assertNonEmptyFile(filePath);
  }

  const machine = readPeMachine(executablePath);
  if (machine !== PeMachine.X64) {
    fail(
      `${executablePath} must use x64 PE machine 0x${PeMachine.X64.toString(16)}, received 0x${machine.toString(16)}.`,
    );
  }

  console.log(
    `[verify-windows-artifact] Verified x64 executable and installer ${path.basename(installerPath)}.`,
  );
}

if (require.main === module) {
  try {
    verifyWindowsArtifact();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  PeMachine,
  readPeMachine,
  verifyWindowsArtifact,
};
