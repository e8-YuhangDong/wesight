import { type ReactNode } from 'react';

import { copy, type Language } from '../content/siteCopy';
import { Header, SiteFooter } from './HomeSections';

type RoutePageProps = {
  children: ReactNode;
  language: Language;
  onToggleLanguage: () => void;
};

export function RoutePage({ children, language, onToggleLanguage }: RoutePageProps) {
  const t = copy[language];

  return (
    <div className="site-shell route-shell">
      <Header t={t} language={language} onToggleLanguage={onToggleLanguage} />
      <main className="route-page">{children}</main>
      <div className="route-footer">
        <SiteFooter t={t} />
      </div>
    </div>
  );
}
