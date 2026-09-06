/**
 * Bundles the two optional enhancement layers into `web/dist/`.
 *
 * The MADRASA site is plain ES modules with no build step. Two things need one,
 * and each is bundled separately so a page pays only for what it mounts:
 *
 *   islands.js  react + react-select, loaded when a page mounts a select
 *   motion.js   gsap + lenis, loaded once unless the visitor prefers reduced motion
 *
 *   node scripts/build_bundles.mjs           # production build
 *   node scripts/build_bundles.mjs --watch   # rebuild on change
 *   node scripts/build_bundles.mjs --check   # fail if a bundle is missing
 */
import { build, context } from 'esbuild';
import { stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = resolve(ROOT, 'web/dist');

const BUNDLES = [
  { name: 'islands', entry: 'web/react/index.jsx' },
  { name: 'motion', entry: 'web/motion/index.js' },
];

const watch = process.argv.includes('--watch');
const check = process.argv.includes('--check');

const outfile = ({ name }) => resolve(OUTDIR, `${name}.js`);

/** @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome111', 'firefox121', 'safari16.4'],
  jsx: 'automatic',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
  logLevel: 'info',
};

async function sizeOf(path) {
  return `${((await stat(path)).size / 1024).toFixed(1)} KB`;
}

if (check) {
  const missing = BUNDLES.filter((bundle) => !existsSync(outfile(bundle)));
  if (missing.length) {
    console.error(`Missing ${missing.map((b) => `web/dist/${b.name}.js`).join(', ')}. Run: npm ci && npm run build`);
    process.exit(1);
  }
  for (const bundle of BUNDLES) {
    console.log(`web/dist/${bundle.name}.js present (${await sizeOf(outfile(bundle))}).`);
  }
  process.exit(0);
}

await mkdir(OUTDIR, { recursive: true });

for (const bundle of BUNDLES) {
  const options = { ...common, entryPoints: [resolve(ROOT, bundle.entry)], outfile: outfile(bundle) };
  if (watch) {
    const ctx = await context(options);
    await ctx.watch();
  } else {
    await build(options);
    console.log(`Built web/dist/${bundle.name}.js (${await sizeOf(outfile(bundle))}).`);
  }
}

if (watch) console.log(`Watching ${BUNDLES.map((b) => b.entry).join(' and ')}. Ctrl+C to stop.`);
