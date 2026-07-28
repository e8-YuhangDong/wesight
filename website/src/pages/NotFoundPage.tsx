import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'wouter';

import { PageMeta } from '../components/PageMeta';
import { RoutePage } from '../components/RoutePage';
import { routeCopy } from '../content/routeCopy';
import { type Language, releaseUrl } from '../content/siteCopy';

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
          <a className="secondary-button" href={releaseUrl}>
            <Download size={18} />
            {t.common.download}
          </a>
        </div>
      </section>
    </RoutePage>
  );
}
