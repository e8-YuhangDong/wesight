import {
  ArrowUpRight,
  CircleDot,
  GitPullRequest,
  Globe2,
  Monitor,
  PackageCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { DownloadMenu } from '../components/DownloadMenu';
import { PageMeta } from '../components/PageMeta';
import { RoutePage } from '../components/RoutePage';
import {
  ReleaseArea,
  type ReleaseArea as ReleaseAreaValue,
  type ReleaseNote,
  releaseNotes,
  type ReleaseNoteSection,
  ReleaseSectionKind,
} from '../content/releaseNotes';
import { copy, type Language } from '../content/siteCopy';

type ChangelogPageProps = {
  language: Language;
  onToggleLanguage: () => void;
};

const sectionIcons = {
  [ReleaseSectionKind.Feature]: Sparkles,
  [ReleaseSectionKind.Fix]: Wrench,
  [ReleaseSectionKind.Improvement]: PackageCheck,
};

function filterRelease(release: ReleaseNote, area: ReleaseAreaValue): ReleaseNote | null {
  if (area === ReleaseArea.All) {
    return release;
  }

  const sections = release.sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.areas.includes(area)),
    }))
    .filter(section => section.items.length > 0);

  return sections.length > 0 ? { ...release, sections } : null;
}

function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${date}T00:00:00`));
}

function ReleaseSection({ section }: { section: ReleaseNoteSection }) {
  const Icon = sectionIcons[section.kind];

  return (
    <section className="release-section">
      <h3>
        <Icon size={18} />
        {section.title}
      </h3>
      <ul>
        {section.items.map(item => (
          <li key={item.text}>{item.text}</li>
        ))}
      </ul>
    </section>
  );
}

export function ChangelogPage({ language, onToggleLanguage }: ChangelogPageProps) {
  const siteCopy = copy[language];
  const t = copy.zh.changelog;
  const [activeArea, setActiveArea] = useState<ReleaseAreaValue>(ReleaseArea.All);
  const latestRelease = releaseNotes.releases[0];
  const visibleReleases = useMemo(
    () =>
      releaseNotes.releases
        .map(release => filterRelease(release, activeArea))
        .filter((release): release is ReleaseNote => release !== null),
    [activeArea],
  );
  const filters = [
    { value: ReleaseArea.All, label: t.filters.all, icon: GitPullRequest },
    { value: ReleaseArea.Desktop, label: t.filters.desktop, icon: Monitor },
    { value: ReleaseArea.Website, label: t.filters.website, icon: Globe2 },
    { value: ReleaseArea.Release, label: t.filters.release, icon: PackageCheck },
  ];

  return (
    <RoutePage language={language} onToggleLanguage={onToggleLanguage}>
      <PageMeta
        htmlLang="zh-CN"
        title={t.metaTitle}
        description={t.metaDescription}
      />
      <div className="changelog-frame">
        <section className="changelog-hero">
          <div className="changelog-heading">
            <span className="route-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.body}</p>
          </div>
          <div className="changelog-latest">
            <span>{t.latest}</span>
            <strong>v{latestRelease.version}</strong>
            <time dateTime={latestRelease.date}>
              {formatReleaseDate(latestRelease.date)}
            </time>
          </div>
          <div className="changelog-actions">
            <DownloadMenu
              buttonClassName="primary-button"
              copy={siteCopy.downloadMenu}
              label={t.download}
            />
            <a className="secondary-button" href={latestRelease.releaseUrl}>
              {t.githubRelease}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section className="release-log" aria-labelledby="release-log-heading">
          <h2 className="sr-only" id="release-log-heading">
            {t.title}
          </h2>
          <div
            className="release-filters"
            aria-label={t.filterLabel}
            role="tablist"
          >
            {filters.map(filter => {
              const Icon = filter.icon;
              const isActive = filter.value === activeArea;

              return (
                <button
                  key={filter.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? 'is-active' : ''}
                  onClick={() => setActiveArea(filter.value)}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="release-list">
            {visibleReleases.map(release => (
              <article className="release-entry" id={`v${release.version}`} key={release.version}>
                <div className="release-meta">
                  <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
                  <a href={release.releaseUrl}>
                    <CircleDot size={13} />
                    {t.versionLabel} {release.version}
                  </a>
                </div>
                <div className="release-content">
                  <h2>{release.title}</h2>
                  <p>{release.summary}</p>
                  {release.sections.map(section => (
                    <ReleaseSection
                      key={`${release.version}-${section.kind}-${section.title}`}
                      section={section}
                    />
                  ))}
                  <a className="release-detail-link" href={release.releaseUrl}>
                    {t.viewRelease}
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </RoutePage>
  );
}
