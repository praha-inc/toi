import { useFrontmatter, useI18n } from '@rspress/core/runtime';

import type I18nJson from 'i18n';
import type { JSX } from 'react';

const FEATURE_KEYS = ['01', '02', '03'] as const;

/**
 * Rspress renders each doc page's markdown/llms.txt export by re-running the
 * theme in an `SSG_MD` pass; the default `HomeLayout` handles it by emitting
 * an equivalent markdown outline instead of the React tree. This mirrors
 * that so `toi`'s llms.txt and per-page `.md` export keep working. The
 * features section is hardcoded rather than frontmatter-driven (see
 * `../features`), so its text is pulled from the same i18n source instead.
 */
export const HomeLayoutMarkdown = (): JSX.Element => {
  const { frontmatter } = useFrontmatter();
  const t = useI18n<typeof I18nJson>();
  const hero = frontmatter?.hero;

  const lines: string[] = [];
  if (hero) {
    if (hero.name) {
      lines.push(`# ${hero.name}`, '');
    }
    if (hero.text) {
      lines.push(hero.text, '');
    }
    if (hero.tagline) {
      lines.push(`> ${hero.tagline}`, '');
    }
    if (hero.actions && hero.actions.length > 0) {
      lines.push(hero.actions.map((action) => `[${action.text}](${action.link})`).join(' | '), '');
    }
  }

  lines.push(`## ${t('home.features.kicker')}`, '');
  for (const key of FEATURE_KEYS) {
    lines.push(`- **${t(`home.features.${key}.title`)}**: ${t(`home.features.${key}.body`)}`);
  }
  lines.push('');

  return <>{lines.join('\n')}</>;
};
