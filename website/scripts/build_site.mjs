/** Render the existing page components as crawlable HTML using the root catalog. */
import { JSDOM } from 'jsdom';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(root, '..');
const out = resolve(root, 'dist');
const origin = 'https://madrasa.mair.ma';
const shell = await readFile(resolve(root, 'index.html'), 'utf8');
const dom = new JSDOM(shell, { url: `${origin}/` });
const { window } = dom;
for (const key of ['window', 'document', 'Node', 'HTMLElement', 'location', 'history', 'FormData']) globalThis[key] = key === 'window' ? window : window[key];
window.matchMedia = () => ({matches: true, addEventListener() {}, removeEventListener() {}});
globalThis.matchMedia = window.matchMedia;
globalThis.requestAnimationFrame = () => 0;

const { buildCatalog } = await import('../web/js/data.js');
const programs = JSON.parse(await readFile(resolve(repo, 'catalog/education_programs.json'), 'utf8'));
const structures = JSON.parse(await readFile(resolve(repo, 'catalog/research_structures.json'), 'utf8'));
const catalog = buildCatalog(programs, structures);
const { default: home } = await import('../web/js/pages/home.js');
const { default: explore } = await import('../web/js/pages/explore.js');
const { institutionsIndex, institutionPage } = await import('../web/js/pages/institutions.js');
const { default: entryPage } = await import('../web/js/pages/entry.js');
const { default: contribute } = await import('../web/js/pages/contribute.js');
const { default: submit } = await import('../web/js/pages/submit.js');
const { default: about } = await import('../web/js/pages/about.js');
const { notFoundState } = await import('../web/js/components.js');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// Publish only browser assets, never build tools, prompts or node_modules.
for (const dir of ['css', 'js', 'dist']) await cp(resolve(root, 'web', dir), resolve(out, 'web', dir), { recursive: true });
for (const dir of ['catalog', 'api', 'assets']) await cp(resolve(repo, dir), resolve(out, dir), { recursive: true });
await cp(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });

const routes = [
  ['', home], ['explore', explore], ['institutions', institutionsIndex],
  ['contribute', contribute], ['submit', submit], ['about', about],
  ...catalog.institutions.map(i => [`institutions/${i.slug}`, institutionPage, { slug: i.slug }]),
  ...catalog.entries.map(e => [e.href, entryPage, { kind: e.kind, id: e.id }]),
];
const manifest = [];
for (const [path, render, params = {}] of routes) {
  dom.reconfigure({ url: `${origin}/${path}` });
  const page = render(catalog, params);
  if (page.status === 404) throw new Error(`Unresolved catalog route: ${path}`);
  const doc = document;
  doc.querySelector('#main').replaceChildren(page.node);
  doc.querySelectorAll('[data-reveal]').forEach(n => n.removeAttribute('data-reveal'));
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(n => {
    if (n.closest('main')) n.textContent = n.textContent.replaceAll('<', '\\u003c');
  });
  doc.title = page.title;
  const description = page.description || 'Explore Morocco’s AI education programs, research laboratories and institutions in the community-maintained MADRASA catalog.';
  const url = `${origin}/${path}`;
  function meta(key, value, property = false) {
    const attr = property ? 'property' : 'name';
    let node = doc.querySelector(`meta[${attr}="${key}"]`);
    if (!node) { node = doc.createElement('meta'); node.setAttribute(attr, key); doc.head.append(node); }
    node.content = value;
  }
  meta('description', description);
  meta('og:title', page.title, true); meta('og:description', description, true);
  meta('og:url', url, true); meta('og:image', `${origin}/assets/logo.png`, true);
  meta('og:image:alt', 'MAIR, Moroccan Artificial Intelligence Research', true);
  meta('twitter:title', page.title); meta('twitter:description', description);
  meta('twitter:image', `${origin}/assets/logo.png`);
  meta('robots', path === 'submit' ? 'noindex,follow' : 'index,follow');
  let canonical = doc.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = doc.createElement('link'); canonical.rel = 'canonical'; doc.head.append(canonical); }
  canonical.href = url;
  doc.querySelector('#footer-meta').textContent = `${catalog.stats.entries} entries · last verified ${catalog.stats.lastChecked}`;
  for (const a of doc.querySelectorAll('#site-nav a[data-nav]')) {
    const section = path.split('/')[0];
    const active = a.dataset.nav === section || (a.dataset.nav === 'explore' && ['program','structure'].includes(section)) || (a.dataset.nav === 'contribute' && section === 'submit');
    if (active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  }
  let html = dom.serialize();
  for (const name of ['islands','motion']) html = html.replace(`<meta name="madrasa-${name}" content="">`, `<meta name="madrasa-${name}" content="web/dist/${name}.js">`);
  const target = path ? resolve(out, `${path}.html`) : resolve(out, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
  manifest.push({ path, title: page.title, description });
  page.onLeave?.();
}

// A real 404 response for unknown URLs, while existing routes have their own HTML.
document.querySelector('#main').replaceChildren(notFoundState('This page is not in the Madrasa catalog.'));
document.title = 'Page not found · MADRASA';
document.querySelector('meta[name="robots"]').content = 'noindex,follow';
document.querySelector('link[rel="canonical"]').remove();
await writeFile(resolve(out, '404.html'), dom.serialize());
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${manifest.filter(r=>r.path !== 'submit').map(r=>`  <url><loc>${escape(`${origin}/${r.path}`)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(resolve(out, 'routes.json'), JSON.stringify(manifest, null, 2));
await writeFile(resolve(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: public, max-age=0, must-revalidate\n/catalog/*\n  Cache-Control: no-cache\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n`);
console.log(`Rendered ${routes.length} pages from ${catalog.stats.entries} root catalog entries and ${catalog.institutions.length} institutions.`);
window.close();
