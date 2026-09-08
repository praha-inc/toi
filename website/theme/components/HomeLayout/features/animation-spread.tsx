import { toi } from '@praha/toi';
import { useI18n } from '@rspress/core/runtime';

import { CodeBlock } from './code-block';
import { Frame } from './frame';
import { InlineCode } from './inline-code';
import { Toast } from './toast';

import type I18nJson from 'i18n';
import type { FC } from 'react';

export const AnimationSpread: FC = () => {
  const t = useI18n<typeof I18nJson>();

  return (
    <article className="home-feature-spread">
      <div className="home-feature-spread__text">
        <span className="home-feature-spread__numeral" aria-hidden="true">
          03
          <span className="home-feature-spread__numeral-kanji">其の三</span>
        </span>
        <h3 className="home-feature-spread__title">{t('home.features.03.title')}</h3>
        <p className="home-feature-spread__body"><InlineCode text={t('home.features.03.body')} /></p>
      </div>
      <div className="home-feature-spread__visual">
        <Frame>
          <CodeBlock>
            <span className="tok-fn">resolve</span>
            {'();\n'}
            {/* oxlint-disable-next-line react/jsx-curly-brace-presence, @stylistic/jsx-curly-brace-presence -- braces are required here so the leading "//" isn't parsed as a JSX comment text node */}
            <span className="tok-comment">{'// waits for the exit animation, then unmounts'}</span>
          </CodeBlock>
          <div className="home-toi-demo">
            <button type="button" className="home-toi-demo__trigger" onClick={() => void toi(Toast)}>
              {t('home.features.03.cta')}
            </button>
          </div>
        </Frame>
      </div>
    </article>
  );
};
