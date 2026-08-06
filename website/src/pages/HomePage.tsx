import { useMemo } from 'react';

import {
  EngineSection,
  FinalCta,
  Header,
  Hero,
  ObsidianSection,
  ProductStage,
  SiteFooter,
  SkillsSection,
  StudioSection,
  TrustSection,
  WorkflowSection,
} from '../components/HomeSections';
import { PageMeta } from '../components/PageMeta';
import {
  copy,
  type Language,
  stageNoteIcons,
  trustIcons,
  workflowIcons,
} from '../content/siteCopy';

type HomePageProps = {
  language: Language;
  onToggleLanguage: () => void;
};

export function HomePage({ language, onToggleLanguage }: HomePageProps) {
  const t = copy[language];
  const localized = useMemo(
    () => ({
      stageNotes: t.product.notes.map((item, index) => ({ ...item, icon: stageNoteIcons[index] })),
      workflowCards: t.workflows.cards.map((item, index) => ({
        ...item,
        icon: workflowIcons[index],
      })),
      trustItems: t.trust.items.map((item, index) => ({ ...item, icon: trustIcons[index] })),
    }),
    [t],
  );

  return (
    <div className="site-shell">
      <PageMeta htmlLang={t.htmlLang} title={t.metaTitle} description={t.metaDescription} />
      <Header t={t} onToggleLanguage={onToggleLanguage} />
      <main>
        <Hero t={t} />
        <ProductStage t={t} stageNotes={localized.stageNotes} />
        <StudioSection t={t} />
        <WorkflowSection t={t} workflowCards={localized.workflowCards} />
        <ObsidianSection t={t} />
        <EngineSection t={t} />
        <SkillsSection t={t} />
        <TrustSection t={t} trustItems={localized.trustItems} />
        <FinalCta t={t} />
      </main>
      <SiteFooter t={t} />
    </div>
  );
}
