#!/usr/bin/env python3
"""Локальный сервер зеркала: http://localhost:8080/  (порт можно передать аргументом)."""
import http.server
import sys
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".webp": "image/webp", ".avif": "image/avif",
                      ".woff": "font/woff", ".woff2": "font/woff2", ".svg": "image/svg+xml"}

    def end_headers(self):
        # без кэша — правки в custom/ видны сразу после F5
        self.send_header("Cache-Control", "no-store")
        # сервер слушает только 127.0.0.1; CORS нужен, чтобы редактор Тильды мог забрать tools/zero-gen/out/*.json
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()


if __name__ == "__main__":
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT)))
    print(f"Зеркало: http://localhost:{PORT}/   (Ctrl+C — остановить)")
    srv.serve_forever()
