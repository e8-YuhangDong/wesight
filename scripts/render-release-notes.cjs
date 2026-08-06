#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const RELEASE_NOTES_PATH = path.join(
  'website',
  'src',
  'content',
  'releaseNotes.json',
);

function normalizeVersion(version) {
  return typeof version === 'string' ? version.trim().replace(/^v/i, '') : '';
}

function readReleaseNotes(projectRoot = path.resolve(__dirname, '..')) {
  const releaseNotesPath = path.join(projectRoot, RELEASE_NOTES_PATH);
  const document = JSON.parse(fs.readFileSync(releaseNotesPath, 'utf8'));

  if (document.schemaVersion !== 1 || !Array.isArray(document.releases)) {
    throw new Error('Release notes must use schema version 1 and include a releases array.');
  }

  return document;
}

function getReleaseNotesEntry(version, document = readReleaseNotes()) {
  const normalizedVersion = normalizeVersion(version);
  const release = document.releases.find(entry => entry.version === normalizedVersion);

  if (!release) {
    throw new Error(
      `No Chinese release notes found for v${normalizedVersion || '<empty>'}. Add the version to ${RELEASE_NOTES_PATH} before publishing.`,
    );
  }

  if (
    !release.title ||
    !release.summary ||
    !release.date ||
    !release.compareUrl ||
    !release.releaseUrl ||
    !Array.isArray(release.sections) ||
    release.sections.length === 0
  ) {
    throw new Error(`Chinese release notes for v${normalizedVersion} are incomplete.`);
  }

  for (const section of release.sections) {
    if (!section.title || !Array.isArray(section.items) || section.items.length === 0) {
      throw new Error(`Chinese release notes for v${normalizedVersion} contain an empty section.`);
    }

    if (section.items.some(item => !item.text || !Array.isArray(item.areas) || item.areas.length === 0)) {
      throw new Error(`Chinese release notes for v${normalizedVersion} contain an invalid item.`);
    }
  }

  return release;
}

function renderReleaseNotes(version, document = readReleaseNotes()) {
  const release = getReleaseNotesEntry(version, document);
  const lines = [
    '> [!WARNING]',
    `> ${document.windowsUnsignedNotice}`,
    '',
    `## WeSight v${release.version} · ${release.title}`,
    '',
    release.summary,
    '',
  ];

  for (const section of release.sections) {
    lines.push(`### ${section.title}`, '');
    for (const item of section.items) {
      lines.push(`- ${item.text}`);
    }
    lines.push('');
  }

  lines.push(`[查看 v${release.version} 的完整代码差异](${release.compareUrl})`, '');
  return lines.join('\n');
}

function main(args = process.argv.slice(2)) {
  if (args.length < 1 || args.length > 2) {
    throw new Error('Usage: node scripts/render-release-notes.cjs <version> [output-file]');
  }

  const output = renderReleaseNotes(args[0]);
  if (args[1]) {
    fs.writeFileSync(path.resolve(args[1]), output, 'utf8');
    return;
  }

  process.stdout.write(output);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[ReleaseNotes] rendering failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  getReleaseNotesEntry,
  main,
  normalizeVersion,
  readReleaseNotes,
  renderReleaseNotes,
};
