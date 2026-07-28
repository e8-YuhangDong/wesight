import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

import { DownloadMenu } from '../components/DownloadMenu';
import { PageMeta } from '../components/PageMeta';
import { RoutePage } from '../components/RoutePage';
import { routeCopy } from '../content/routeCopy';
import { copy, type Language } from '../content/siteCopy';

type NotFoundPageProps = {
  language: Language;
  onToggleLanguage: () => void;
};

export function NotFoundPage({ language, onToggleLanguage }: NotFoundPageProps) {
  const t = routeCopy[language];

  return (
    <RoutePage language={language} onToggleLanguage={onToggleLanguage}>
      <PageMeta
        htmlLang={language === 'en' ? 'en' : 'zh-CN'}
        title={t.notFound.metaTitle}
        description={t.notFound.metaDescription}
      />
      <section className="route-hero not-found">
        <span className="route-eyebrow">{t.notFound.eyebrow}</span>
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.body}</p>
        <div className="route-actions">
          <Link className="primary-button" href="/">
            <ArrowLeft size={18} />
            {t.common.backHome}
          </Link>
          <DownloadMenu
            buttonClassName="secondary-button"
            copy={copy[language].downloadMenu}
            label={t.common.download}
          />
        </div>
      </section>
    </RoutePage>
  );
}
