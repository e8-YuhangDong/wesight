import { ArrowLeft, Download, KeyRound, Mail, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

import { PageMeta } from '../components/PageMeta';
import { RoutePage } from '../components/RoutePage';
import { routeCopy } from '../content/routeCopy';
import { type Language, releaseUrl } from '../content/siteCopy';

type PricingPageProps = {
  language: Language;
  onToggleLanguage: () => void;
};

export function PricingPage({ language, onToggleLanguage }: PricingPageProps) {
  const t = routeCopy[language];

  return (
    <RoutePage language={language} onToggleLanguage={onToggleLanguage}>
      <PageMeta
        htmlLang={language === 'en' ? 'en' : 'zh-CN'}
        title={t.pricing.metaTitle}
        description={t.pricing.metaDescription}
      />
      <section className="route-hero">
        <span className="route-eyebrow">{t.pricing.eyebrow}</span>
        <h1>{t.pricing.title}</h1>
        <p>{t.pricing.body}</p>
        <span className="status-pill">
          <Sparkles size={15} />
          {t.pricing.status}
        </span>
        <div className="route-actions">
          <a className="primary-button" href={releaseUrl}>
            <Download size={18} />
            {t.common.download}
          </a>
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
      <section className="route-card-grid">
        {t.pricing.cards.map(card => (
          <article key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>
      <section className="guide-panel">
        <div className="guide-heading">
          <KeyRound size={24} />
          <div>
            <h2>{t.pricing.guideTitle}</h2>
            <p>{t.pricing.guideBody}</p>
          </div>
        </div>
        <ol>
          {t.pricing.steps.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </RoutePage>
  );
}
