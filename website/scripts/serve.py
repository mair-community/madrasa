#!/usr/bin/env python3
"""Serve the MADRASA site locally.

The site uses clean URLs (`/explore`, `/structure/<id>`), so unknown paths must
fall back to `index.html`, the same thing GitHub Pages does via `404.html`.

    python scripts/serve.py            # http://localhost:8000
    python scripts/serve.py --port 3000
"""
from __future__ import annotations

import argparse
import http.server
import io
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent

# Anything with an extension is a real file request; everything else is a route.
FILE_LIKE = {".json", ".js", ".css", ".png", ".svg", ".ico", ".md", ".txt", ".xml", ".webmanifest", ".woff2"}

# Optional enhancement bundles. Each is announced to the page through a meta
# tag, which stays empty while the bundle has not been built.
BUNDLES = {
    "madrasa-islands": "web/dist/islands.js",
    "madrasa-motion": "web/dist/motion.js",
}


def enable_bundles(html: str) -> str:
    """Point each meta marker at its bundle, for the bundles that exist."""
    for marker, path in BUNDLES.items():
        if (ROOT / path).exists():
            html = html.replace(
                f'<meta name="{marker}" content="">',
                f'<meta name="{marker}" content="{path}">',
                1,
            )
    return html


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        # Preview the real repository catalog without keeping a second copy.
        from urllib.parse import urlparse, unquote
        relative = unquote(urlparse(path).path).lstrip('/')
        if relative.startswith(('catalog/', 'api/', 'assets/')):
            shared = (REPO / relative).resolve()
            if shared.is_relative_to(REPO) and shared.is_file():
                return str(shared)
        resolved = Path(super().translate_path(path))
        if resolved.is_dir() and (resolved / "index.html").exists():
            return str(resolved)
        if not resolved.exists() and resolved.suffix.lower() not in FILE_LIKE:
            return str(ROOT / "index.html")
        return str(resolved)

    def send_head(self):
        """Serve the app shell from memory so the bundle markers can be set."""
        target = Path(self.translate_path(self.path))
        if target.is_dir():
            target = target / "index.html"
        if target != ROOT / "index.html":
            return super().send_head()

        body = enable_bundles(target.read_text(encoding="utf-8")).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def end_headers(self) -> None:
        # Local preview should always reflect the file on disk.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("  %s\n" % (fmt % args))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="localhost")
    args = parser.parse_args()

    missing = [path for path in BUNDLES.values() if not (ROOT / path).exists()]
    if missing:
        print(
            f"Note: {', '.join(missing)} not built, so the sort control falls back to a\n"
            "      native <select> and scroll reveals use the CSS-only path. Run\n"
            "      `npm ci && npm run build` for the react-select and GSAP versions.\n"
            "      Everything else works either way.\n"
        )

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), SPAHandler) as httpd:
        print(f"MADRASA is running at http://{args.host}:{args.port}/  (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
