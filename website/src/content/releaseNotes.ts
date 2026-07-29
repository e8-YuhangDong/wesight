import releaseNotesData from './releaseNotes.json';

export const ReleaseArea = {
  All: 'all',
  Desktop: 'desktop',
  Website: 'website',
  Release: 'release',
} as const;

export type ReleaseArea = (typeof ReleaseArea)[keyof typeof ReleaseArea];
export type ReleaseItemArea = Exclude<ReleaseArea, typeof ReleaseArea.All>;

export const ReleaseSectionKind = {
  Feature: 'feature',
  Fix: 'fix',
  Improvement: 'improvement',
} as const;

export type ReleaseSectionKind =
  (typeof ReleaseSectionKind)[keyof typeof ReleaseSectionKind];

export type ReleaseNoteItem = {
  text: string;
  areas: ReleaseItemArea[];
};

export type ReleaseNoteSection = {
  kind: ReleaseSectionKind;
  title: string;
  items: ReleaseNoteItem[];
};

export type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  summary: string;
  compareUrl: string;
  releaseUrl: string;
  sections: ReleaseNoteSection[];
};

type ReleaseNotesDocument = {
  schemaVersion: number;
  windowsUnsignedNotice: string;
  releases: ReleaseNote[];
};

export const releaseNotes = releaseNotesData as ReleaseNotesDocument;
