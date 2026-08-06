import { ArrowLeft, Laptop, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';

import { DownloadMenu } from '../components/DownloadMenu';
import { PageMeta } from '../components/PageMeta';
import { RoutePage } from '../components/RoutePage';
import { routeCopy } from '../content/routeCopy';
import { copy, type Language } from '../content/siteCopy';

type ProfilePageProps = {
  language: Language;
  onToggleLanguage: () => void;
};

export function ProfilePage({ language, onToggleLanguage }: ProfilePageProps) {
  const t = routeCopy[language];

  return (
    <RoutePage language={language} onToggleLanguage={onToggleLanguage}>
      <PageMeta
        htmlLang={language === 'en' ? 'en' : 'zh-CN'}
        title={t.profile.metaTitle}
        description={t.profile.metaDescription}
      />
      <section className="route-hero">
        <span className="route-eyebrow">{t.profile.eyebrow}</span>
        <h1>{t.profile.title}</h1>
        <p>{t.profile.body}</p>
        <div className="route-actions">
          <DownloadMenu
            buttonClassName="primary-button"
            copy={copy[language].downloadMenu}
            label={t.common.download}
          />
          <a className="secondary-button" href="mailto:hello@wesight.ai">
            <Mail size={18} />
            {t.common.contact}
          </a>
          <Link className="text-link" href="/">
            <ArrowLeft size={16} />
            {t.common.backHome}
          </Link>
        </div>
      </section>
      <section className="notice-panel">
        <ShieldCheck size={24} />
        <div>
          <h2>{t.profile.noticeTitle}</h2>
          <p>{t.profile.noticeBody}</p>
        </div>
      </section>
      <section className="route-card-grid">
        {t.profile.cards.map((card, index) => (
          <article key={card.title}>
            {index === 0 && <Laptop size={22} />}
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>
    </RoutePage>
  );
}
