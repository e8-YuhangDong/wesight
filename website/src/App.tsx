import { useState } from 'react';
import { Route, Router, Switch } from 'wouter';

import { type Language } from './content/siteCopy';
import { ChangelogPage } from './pages/ChangelogPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PricingPage } from './pages/PricingPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  const [language, setLanguage] = useState<Language>('en');
  const onToggleLanguage = () => {
    setLanguage(current => (current === 'en' ? 'zh' : 'en'));
  };

  return (
    <Router>
      <Switch>
        <Route path="/">
          <HomePage language={language} onToggleLanguage={onToggleLanguage} />
        </Route>
        <Route path="/pricing">
          <PricingPage language={language} onToggleLanguage={onToggleLanguage} />
        </Route>
        <Route path="/changelog">
          <ChangelogPage language={language} onToggleLanguage={onToggleLanguage} />
        </Route>
        <Route path="/profile">
          <ProfilePage language={language} onToggleLanguage={onToggleLanguage} />
        </Route>
        <Route>
          <NotFoundPage language={language} onToggleLanguage={onToggleLanguage} />
        </Route>
      </Switch>
    </Router>
  );
}
