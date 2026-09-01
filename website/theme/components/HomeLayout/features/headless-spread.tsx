import { useI18n } from '@rspress/core/runtime';

import { Frame } from './frame';
import { InlineCode } from './inline-code';

import type I18nJson from 'i18n';
import type { FC } from 'react';

export const HeadlessSpread: FC = () => {
  const t = useI18n<typeof I18nJson>();

  return (
    <article className="home-feature-spread home-feature-spread--reverse">
      <div className="home-feature-spread__visual">
        <Frame>
          <div className="home-diagram" aria-hidden="true">
            <div className="home-diagram__box home-diagram__box--toi">
              <span className="home-diagram__label">{t('home.features.02.diagram.toi')}</span>
              <span className="home-diagram__caption">{t('home.features.02.diagram.toiCaption')}</span>
            </div>
            <div className="home-diagram__divider">
              <span />
            </div>
            <div className="home-diagram__box home-diagram__box--you">
              <span className="home-diagram__label">{t('home.features.02.diagram.you')}</span>
              <span className="home-diagram__caption">{t('home.features.02.diagram.youCaption')}</span>
            </div>
          </div>
        </Frame>
      </div>
      <div className="home-feature-spread__text">
        <span className="home-feature-spread__numeral" aria-hidden="true">
          02
          <span className="home-feature-spread__numeral-kanji">其の二</span>
        </span>
        <h3 className="home-feature-spread__title">{t('home.features.02.title')}</h3>
        <p className="home-feature-spread__body"><InlineCode text={t('home.features.02.body')} /></p>
      </div>
    </article>
  );
};
