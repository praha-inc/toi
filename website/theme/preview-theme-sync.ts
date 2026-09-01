/*
 * @rspress/plugin-preview's iframe toggles a `dark` class on <html> to mirror
 * the parent site's theme (see its injected theme-change script), but the
 * `--rp-c-*` variables we import from @rspress/core key off `rp-dark`
 * instead. This keeps the two in sync so those variables actually switch.
 */

const html = document.documentElement;

const sync = () => {
  html.classList.toggle('rp-dark', html.classList.contains('dark'));
};

sync();
new MutationObserver(sync).observe(html, {
  attributes: true,
  attributeFilter: ['class'],
});
