import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

import { afterEach, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const {
  PeMachine,
  readPeMachine,
  verifyWindowsArtifact,
} = require('./verify-windows-artifact.cjs');

const temporaryDirectories: string[] = [];

function createPeFile(filePath: string, machine: number) {
  const buffer = Buffer.alloc(128);
  buffer.write('MZ', 0, 'ascii');
  buffer.writeUInt32LE(64, 0x3c);
  buffer.write('PE\u0000\u0000', 64, 'binary');
  buffer.writeUInt16LE(machine, 68);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('reads the x64 machine from a PE executable', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wesight-pe-'));
  temporaryDirectories.push(directory);
  const executablePath = path.join(directory, 'WeSight.exe');
  createPeFile(executablePath, PeMachine.X64);

  expect(readPeMachine(executablePath)).toBe(PeMachine.X64);
});

test('verifies the Windows x64 release artifact set', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wesight-windows-artifact-'));
  temporaryDirectories.push(projectRoot);
  const releaseDirectory = path.join(projectRoot, 'release');
  const installerPath = path.join(releaseDirectory, 'WeSight.Setup.1.0.1.exe');

  createPeFile(path.join(releaseDirectory, 'win-unpacked', 'WeSight.exe'), PeMachine.X64);
  fs.writeFileSync(installerPath, 'installer');
  fs.writeFileSync(`${installerPath}.blockmap`, 'blockmap');
  fs.writeFileSync(path.join(releaseDirectory, 'latest.yml'), 'version: 1.0.1');

  expect(() =>
    verifyWindowsArtifact({
      projectRoot,
      metadata: { version: '1.0.1' },
    }),
  ).not.toThrow();
});
