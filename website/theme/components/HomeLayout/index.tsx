import { ToiHost } from '@praha/toi';
import { useFrontmatter, useSite } from '@rspress/core/runtime';
import { Button, HomeBackground, renderHtmlOrText } from '@rspress/core/theme-original';

import { HomeMark } from './backdrop/home-mark';
import { InkField } from './backdrop/ink-field';
import { Features } from './features';
import { HomeLayoutMarkdown } from './markdown';
import { Rail } from './rail';
import { Mark } from '../Mark';

import './index.scss';

import type { JSX } from 'react';

const HomeLayout = (): JSX.Element => {
  const { frontmatter } = useFrontmatter();
  const { site } = useSite();

  if (import.meta.env.SSG_MD) {
    return <HomeLayoutMarkdown />;
  }

  const hero = frontmatter?.hero;
  const footerMessage = site.themeConfig.footer?.message;

  const headlines = hero?.text
    ? hero.text.toString().split(/\n/g).filter((line) => line !== '')
    : [];

  return (
    <div className="home">
      <HomeBackground />
      <InkField />
      <HomeMark />
      <Rail />
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-hero__lockup">
            <Mark className="home-hero__mark" />
            <div className="home-hero__wordmark">
              <span className="home-hero__kana" aria-hidden="true">とい</span>
              <span className="home-hero__en" {...renderHtmlOrText(hero?.name)} />
            </div>
          </div>
          <div className="home-hero__headlines">
            {headlines.map((line) => (
              // oxlint-disable-next-line jsx-a11y/heading-has-content -- content comes from the `renderHtmlOrText` spread (children or dangerouslySetInnerHTML), the same pattern Rspress's own HomeHero uses
              <h1 key={line} className="home-hero__headline" {...renderHtmlOrText(line)} />
            ))}
          </div>
          {hero?.tagline && (
            <p className="home-hero__tagline" {...renderHtmlOrText(hero.tagline)} />
          )}
          {hero?.actions && hero.actions.length > 0 && (
            <div className="home-hero__actions">
              {hero.actions.map((action) => (
                <Button
                  key={action.link}
                  type="a"
                  href={action.link}
                  theme={action.theme}
                  className="home-hero__action"
                  {...renderHtmlOrText(action.text)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <Features />
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__lockup" aria-hidden="true">
            <Mark className="home-footer__mark" />
            <span className="home-footer__wordmark">toi</span>
          </div>
          <span className="home-footer__rule" aria-hidden="true" />
          {footerMessage && (
            <p className="home-footer__message" {...renderHtmlOrText(footerMessage)} />
          )}
        </div>
      </footer>
      <ToiHost />
    </div>
  );
};

export { HomeLayout };
