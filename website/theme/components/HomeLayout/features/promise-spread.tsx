import { toi } from '@praha/toi';
import { useI18n } from '@rspress/core/runtime';
import { useState } from 'react';

import { CodeBlock } from './code-block';
import { ConfirmDialog } from './confirm-dialog';
import { Frame } from './frame';
import { InlineCode } from './inline-code';

import type I18nJson from 'i18n';
import type { FC } from 'react';

export const PromiseSpread: FC = () => {
  const t = useI18n<typeof I18nJson>();
  const [result, setResult] = useState<boolean | null>(null);

  const handleTry = async () => {
    setResult(null);
    const ok = await toi(ConfirmDialog);
    setResult(ok);
  };

  return (
    <article className="home-feature-spread">
      <div className="home-feature-spread__text">
        <span className="home-feature-spread__numeral" aria-hidden="true">
          01
          <span className="home-feature-spread__numeral-kanji">其の一</span>
        </span>
        <h3 className="home-feature-spread__title">{t('home.features.01.title')}</h3>
        <p className="home-feature-spread__body"><InlineCode text={t('home.features.01.body')} /></p>
      </div>
      <div className="home-feature-spread__visual">
        <Frame>
          <CodeBlock>
            <span className="tok-kw">const</span>
            {' ok = '}
            <span className="tok-kw">await</span>
            {' '}
            <span className="tok-fn">toi</span>
            {'(Confirm);\n'}
            {/* oxlint-disable-next-line react/jsx-curly-brace-presence, @stylistic/jsx-curly-brace-presence -- braces are required here so the leading "//" isn't parsed as a JSX comment text node */}
            <span className="tok-comment">{'// ok === true once resolve(true) runs'}</span>
          </CodeBlock>
          <div className="home-toi-demo">
            <button type="button" className="home-toi-demo__trigger" onClick={handleTry}>
              {t('home.features.01.cta')}
            </button>
            {result !== null && (
              <p className="home-toi-demo__result">{t('home.features.01.result', { value: String(result) })}</p>
            )}
          </div>
        </Frame>
      </div>
    </article>
  );
};
