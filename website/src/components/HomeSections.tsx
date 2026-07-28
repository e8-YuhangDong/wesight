import {
  Bot,
  Boxes,
  Check,
  Download,
  FileText,
  Github,
  MessageSquareText,
  Play,
  RefreshCcw,
  TerminalSquare,
} from 'lucide-react';
import { Link } from 'wouter';

import {
  type Copy,
  docsUrl,
  engines,
  heroStats,
  type Language,
  logoUrl,
  productImages,
  releaseUrl,
  repoUrl,
} from '../content/siteCopy';

export function Header({
  t,
  language,
  onToggleLanguage,
}: {
  t: Copy;
  language: Language;
  onToggleLanguage: () => void;
}) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="WeSight home">
        <BrandLogo />
        <span>WeSight</span>
      </Link>
      <nav aria-label="Primary navigation">
        <a href="/#product">{t.header.nav.product}</a>
        <a href="/#studio">{t.header.nav.studio}</a>
        <a href="/#workflows">{t.header.nav.workflows}</a>
        <a href="/#engines">{t.header.nav.engines}</a>
        <a href="/#skills">{t.header.nav.skills}</a>
        <a href="/#open-source">{t.header.nav.openSource}</a>
        <a href={docsUrl}>{t.header.nav.docs}</a>
      </nav>
      <div className="header-actions">
        <button
          className="language-toggle"
          type="button"
          onClick={onToggleLanguage}
          aria-label={t.languageLabel}
        >
          {t.languageToggle}
        </button>
        <a
          className="header-cta"
          href={releaseUrl}
          aria-label={language === 'en' ? 'Download WeSight' : '下载 WeSight'}
        >
          <Download size={16} />
          {t.header.download}
        </a>
      </div>
    </header>
  );
}

export function Hero({ t }: { t: Copy }) {
  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <BrandLogo className="hero-brand" />
        <h1>
          {t.hero.title.map(line => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p>{t.hero.body}</p>
        <div className="hero-actions">
          <a className="primary-button" href={releaseUrl}>
            <Download size={18} />
            {t.hero.primaryCta}
          </a>
          <a className="secondary-button" href={repoUrl}>
            <Github size={18} />
            {t.hero.secondaryCta}
          </a>
        </div>
        <div className="hero-meta">
          {heroStats.map(item => {
            const Icon = item.icon;
            return (
              <span key={item.label}>
                <Icon size={16} />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="command-dock" aria-hidden="true">
        {t.hero.commandHints.map(hint => (
          <span key={hint}>{hint}</span>
        ))}
      </div>
    </section>
  );
}

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`.trim()}>
      <img src={logoUrl} alt="" aria-hidden="true" />
    </span>
  );
}

export function ProductStage({
  t,
  stageNotes,
}: {
  t: Copy;
  stageNotes: Array<{ icon: typeof TerminalSquare; title: string; body: string }>;
}) {
  return (
    <section className="product-stage" id="product">
      <SectionIntro eyebrow={t.product.eyebrow} title={t.product.title} body={t.product.body} />
      <div className="stage-wrap">
        <div className="window-frame hero-window">
          <WindowChrome title={t.product.chromeTitle} />
          <img src={productImages.workspace} alt="WeSight welcome workspace" />
        </div>
        <div className="stage-card stage-card-one">
          <FileText size={18} />
          <span>{t.product.stageCards[0].label}</span>
          <strong>{t.product.stageCards[0].title}</strong>
        </div>
        <div className="stage-card stage-card-two">
          <Bot size={18} />
          <span>{t.product.stageCards[1].label}</span>
          <strong>{t.product.stageCards[1].title}</strong>
        </div>
      </div>
      <div className="stage-notes">
        {stageNotes.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function StudioSection({ t }: { t: Copy }) {
  return (
    <section className="studio-section" id="studio">
      <div className="studio-grid">
        <div className="studio-copy">
          <SectionIntro eyebrow={t.studio.eyebrow} title={t.studio.title} body={t.studio.body} />
          <div className="studio-points">
            {t.studio.points.map(point => (
              <span key={point}>
                <Check size={14} />
                {point}
              </span>
            ))}
          </div>
        </div>
        <div className="window-frame studio-window">
          <WindowChrome title={t.studio.chatTitle} />
          <img src={productImages.conversation} alt={t.studio.chatTitle} />
        </div>
        <article className="pet-feature">
          <div>
            <h3>{t.studio.petTitle}</h3>
            <p>{t.studio.petBody}</p>
          </div>
          <img src={productImages.pet} alt={t.studio.petTitle} />
        </article>
        <article className="studio-note">
          <h3>{t.studio.chatTitle}</h3>
          <p>{t.studio.chatBody}</p>
        </article>
      </div>
    </section>
  );
}

export function WorkflowSection({
  t,
  workflowCards,
}: {
  t: Copy;
  workflowCards: Array<{
    icon: typeof MessageSquareText;
    title: string;
    body: string;
    rows: string[];
  }>;
}) {
  return (
    <section className="workflow-section" id="workflows">
      <SectionIntro
        eyebrow={t.workflows.eyebrow}
        title={t.workflows.title}
        body={t.workflows.body}
      />
      <div className="workflow-grid">
        {workflowCards.map(card => {
          const Icon = card.icon;
          return (
            <article className="workflow-card" key={card.title}>
              <Icon size={24} />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <div>
                {card.rows.map(row => (
                  <span key={row}>
                    <Check size={14} />
                    {row}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function EngineSection({ t }: { t: Copy }) {
  return (
    <section className="engine-section" id="engines">
      <div className="engine-copy">
        <SectionIntro eyebrow={t.engines.eyebrow} title={t.engines.title} body={t.engines.body} />
        <div className="engine-list" aria-label={t.engines.aria}>
          {engines.map(engine => (
            <span key={engine}>{engine}</span>
          ))}
        </div>
      </div>
      <div className="engine-showcase">
        {t.engines.panels.map(panel => (
          <article className="image-panel" key={panel.title}>
            <div className="window-frame compact-window">
              <WindowChrome title={panel.title} />
              <img src={panel.image} alt={panel.title} />
            </div>
            <h3>{panel.title}</h3>
            <p>{panel.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SkillsSection({ t }: { t: Copy }) {
  return (
    <section className="skills-section" id="skills">
      <div className="skills-copy">
        <SectionIntro eyebrow={t.skills.eyebrow} title={t.skills.title} body={t.skills.body} />
        <div className="skill-list">
          {t.skills.items.map(item => (
            <article key={item.name}>
              <Boxes size={18} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.body}</p>
              </div>
              <Play size={14} />
            </article>
          ))}
        </div>
      </div>
      <div className="window-frame skills-window">
        <WindowChrome title={t.skills.chromeTitle} />
        <img src={productImages.skills} alt="WeSight skills list" />
      </div>
    </section>
  );
}

export function TrustSection({
  t,
  trustItems,
}: {
  t: Copy;
  trustItems: Array<{ icon: typeof Github; title: string; body: string }>;
}) {
  return (
    <section className="trust-section" id="open-source">
      <SectionIntro eyebrow={t.trust.eyebrow} title={t.trust.title} body={t.trust.body} />
      <div className="trust-grid">
        {trustItems.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={28} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function FinalCta({ t }: { t: Copy }) {
  return (
    <section className="final-section">
      <div className="final-panel">
        <div>
          <BrandLogo className="final-logo" />
          <h2>{t.final.title}</h2>
          <p>{t.final.body}</p>
        </div>
        <div className="final-actions">
          <a className="primary-button" href={releaseUrl}>
            <Download size={18} />
            {t.final.primaryCta}
          </a>
          <a className="secondary-button" href={repoUrl}>
            <Github size={18} />
            {t.final.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ t }: { t: Copy }) {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand" href="/" aria-label="WeSight home">
          <BrandLogo />
          <span>WeSight</span>
        </Link>
        <p>{t.final.footerBody}</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/#product">{t.final.footerNav.product}</a>
        <a href="/#workflows">{t.final.footerNav.workflows}</a>
        <Link href="/pricing">{t.final.footerNav.pricing}</Link>
        <Link href="/profile">{t.final.footerNav.profile}</Link>
        <a href={docsUrl}>{t.final.footerNav.docs}</a>
        <a href={releaseUrl}>{t.final.footerNav.releases}</a>
        <a href={repoUrl}>{t.final.footerNav.github}</a>
        <a href="mailto:hello@wesight.ai">{t.final.footerNav.contact}</a>
      </nav>
    </footer>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="section-intro">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export function WindowChrome({ title }: { title: string }) {
  return (
    <div className="window-chrome">
      <i />
      <i />
      <i />
      <strong>{title}</strong>
      <RefreshCcw size={13} />
    </div>
  );
}
