# Madrasa website

Production: https://madrasa.mair.ma/

The website uses the repository's `../catalog/*.json` as its only catalog source.
Do not copy or edit data inside `website/`. Edit the root catalog and push to
`main`; Cloudflare Pages builds and publishes the new dataset and HTML together.
Updates become visible after the deployment succeeds, normally within a few
minutes. Reload an already-open page to load the latest published catalog.

## Local development

```sh
cd website
npm ci
npm run build
npm test
npm run dev
```

The preview serves root `catalog/`, `api/` and shared `assets/` directly. The
publishable output is `website/dist/`, which is generated and not committed.

## Cloudflare Pages

- Git repository: `mair-community/madrasa`
- Production branch: `main`
- Root directory: repository root (leave blank)
- Build command: `python3 scripts/validate_catalog.py && npm ci --prefix website && npm run build --prefix website && npm test --prefix website`
- Output directory: `website/dist`
- Node version: `22`
- Build watch paths: all files, including root `catalog/**`
- Custom domain: `madrasa.mair.ma`

Cloudflare Git integration handles deployment; no Cloudflare token is stored in
GitHub. Invalid catalog data or failed website checks prevent publication.

## SEO and data

Build-only JSDOM renders the same components used by the browser. Every canonical
route has its own HTML, title, description and social metadata. Institution URLs
and sitemap entries use the same canonicalisation as the application. Catalog
JSON is copied byte-for-byte into deployment output and revalidated by browsers.
Unknown paths return a real 404. The submission form is excluded from indexing.

## Submissions

`web/js/submissions.js` contains the dedicated MADRASA public Web3Forms key.
Recipient configuration remains in Web3Forms. Proposals require maintainer
review and never modify the catalog automatically. Only send live test emails
when authorized; ordinary tests should mock the delivery API.
