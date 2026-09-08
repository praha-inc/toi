import { useI18n } from '@rspress/core/runtime';

import { AnimationSpread } from './animation-spread';
import { HeadlessSpread } from './headless-spread';
import { PromiseSpread } from './promise-spread';

import type I18nJson from 'i18n';
import type { FC } from 'react';

export const Features: FC = () => {
  const t = useI18n<typeof I18nJson>();

  return (
    <section className="home-features">
      <div className="home-features__header">
        <span className="home-features__kicker">{t('home.features.kicker')}</span>
        <span className="home-features__rule" aria-hidden="true" />
      </div>
      <p className="home-features__lead">{t('home.features.lead')}</p>
      <div className="home-features__list">
        <PromiseSpread />
        <HeadlessSpread />
        <AnimationSpread />
      </div>
    </section>
  );
};
