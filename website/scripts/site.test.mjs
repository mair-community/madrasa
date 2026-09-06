import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { buildCatalog } from '../web/js/data.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root,p), 'utf8');
const programs = JSON.parse(read('../catalog/education_programs.json'));
const structures = JSON.parse(read('../catalog/research_structures.json'));
const catalog = buildCatalog(programs, structures);
const routes = JSON.parse(read('dist/routes.json'));

test('published catalog is byte-for-byte the root catalog', () => {
  for (const file of ['education_programs.json','research_structures.json']) assert.equal(read(`dist/catalog/${file}`), read(`../catalog/${file}`));
  assert.equal(routes.length, 6 + catalog.entries.length + catalog.institutions.length);
});
test('all pages have crawlable content, canonical metadata and valid local links', () => {
  for (const route of routes) {
    const dom = new JSDOM(read(`dist/${route.path || 'index'}.html`), {url:'https://madrasa.mair.ma/'});
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('main h1').length,1,route.path);
    assert.ok(doc.querySelector('main').textContent.trim().length > 80,route.path);
    assert.equal(doc.querySelector('link[rel="canonical"]').href, `https://madrasa.mair.ma/${route.path}`);
    assert.ok(doc.querySelector('meta[name="description"]').content.length>30);
    assert.equal(doc.querySelector('meta[property="og:image"]').content, 'https://madrasa.mair.ma/assets/logo.png');
    for (const a of doc.querySelectorAll('a[href],img[src],script[src],link[rel="stylesheet"]')) {
      const url = new URL(a.getAttribute('href') || a.getAttribute('src'), 'https://madrasa.mair.ma/');
      if (url.origin !== 'https://madrasa.mair.ma') continue;
      const path = decodeURIComponent(url.pathname).replace(/^\//,'');
      assert.ok(existsSync(resolve(root,'dist',path || 'index.html')) || existsSync(resolve(root,'dist',`${path}.html`)), `${route.path}: ${path}`);
    }
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) assert.doesNotThrow(()=>JSON.parse(script.textContent));
    dom.window.close();
  }
});
test('sitemap lists only real canonical routes and excludes the submission form', () => {
  const xml = read('dist/sitemap.xml');
  assert.equal((xml.match(/<loc>/g)||[]).length,routes.length-1);
  assert.ok(!xml.includes('/submit<'));
  for(const i of catalog.institutions) assert.ok(xml.includes(`/institutions/${i.slug}<`));
});
