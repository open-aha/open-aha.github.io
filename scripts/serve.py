"""Static dev server with caching disabled (so edited ES modules always reload).

Page addresses such as /courses/ratios/ have no file in the source tree, so they get index.html
and the app draws the page. A built site (_site/, from scripts/build-site.mjs) is served the way
GitHub Pages serves it: a missing page gets 404.html with status 404.
Usage: python3 scripts/serve.py [port] [folder]
"""
import functools, http.server, os, sys, urllib.parse


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass

    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)):
            not_found = os.path.join(self.directory, "404.html")
            if os.path.exists(not_found):
                f = open(not_found, "rb")
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(os.fstat(f.fileno()).st_size))
                self.end_headers()
                return f
            if not os.path.splitext(urllib.parse.urlsplit(self.path).path)[1]:
                self.path = "/index.html"
        return super().send_head()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
folder = sys.argv[2] if len(sys.argv) > 2 else "."
handler = functools.partial(NoCache, directory=os.path.abspath(folder))
http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
