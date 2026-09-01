import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
// import pluginOg from 'rspress-plugin-og';

const require = createRequire(import.meta.url);

const siteUrl = 'https://praha-inc.github.io/toi';

export default defineConfig({
  title: 'toi',
  base: '/toi/',
  description: 'A tiny headless React utility for building imperative dialogs/toasts.',
  // icon: '/waving-hand.png',
  // logo: '/waving-hand.png',
  logoText: 'toi',
  llms: true,
  plugins: [
    pluginPreview({
      iframeOptions: {
        builderConfig: {
          source: {
            preEntry: [
              require.resolve('@rspress/core/dist/theme/styles/vars/base-vars.css'),
              require.resolve('@rspress/core/dist/theme/styles/vars/brand-vars.css'),
              fileURLToPath(new URL('theme/preview-theme-sync.ts', import.meta.url)),
              fileURLToPath(new URL('theme/preview.css', import.meta.url)),
            ],
          },
        },
      },
    }),
    pluginSitemap({ siteUrl }),
    // pluginOg({
    //   domain: siteUrl,
    //   maxTitleSizePerLine: 20,
    // }),
  ],
  markdown: {
    shiki: {
      langs: ['tsx', 'ts', 'js', 'json'],
    },
  },
  lang: 'en',
  languageParity: {
    enabled: true,
    exclude: ['api'],
  },
  locales: [
    {
      lang: 'en',
      label: 'English',
    },
    {
      lang: 'ja',
      label: '日本語',
    },
  ],
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    lastUpdated: true,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/praha-inc/toi',
      },
    ],
    editLink: {
      docRepoBaseUrl: 'https://github.com/praha-inc/toi/tree/main/website/docs',
    },
    footer: {
      message: `© ${new Date().getFullYear()} PrAha, Inc.`,
    },
  },
  builderConfig: {
    plugins: [
      pluginOpenGraph({
        url: siteUrl,
        twitter: {
          card: 'summary_large_image',
        },
      }),
    ],
  },
});
