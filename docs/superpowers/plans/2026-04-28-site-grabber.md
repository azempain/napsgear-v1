# Site Grabber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Python CLI that crawls any website using a real Chromium browser, captures all assets via network interception, and produces a fully offline-browsable local folder.

**Architecture:** Playwright Chromium intercepts every network response (regardless of domain) while a BFS crawler follows same-hostname links. After crawling, a post-processor rewrites all absolute URLs to relative paths and inlines SVG sprites. All files stored under `output/<hostname>/<path>`.

**Tech Stack:** Python 3.11+, Playwright (sync API), Click, tqdm, pytest

---

## File Structure

```
grabber/
  grab.py            ← CLI entry point, wires all modules together
  crawler.py         ← BFS queue, visited set, same-host link extraction
  interceptor.py     ← network response handler, url_to_local_path, file writer
  rewriter.py        ← post-process HTML/CSS URL rewriting, SVG inlining
  cookies.py         ← load Chrome JSON cookies for Playwright
  requirements.txt
  tests/
    test_interceptor.py
    test_rewriter.py
    test_cookies.py
    test_crawler.py
```

---

### Task 1: Project setup

**Files:**
- Create: `grabber/requirements.txt`
- Create: `grabber/tests/__init__.py`

- [ ] **Step 1: Create grabber directory and requirements.txt**

```
grabber/requirements.txt
```

```
playwright>=1.43.0
click>=8.1.0
tqdm>=4.66.0
pytest>=8.1.0
```

- [ ] **Step 2: Create empty tests package**

```bash
mkdir -p grabber/tests
touch grabber/tests/__init__.py
```

- [ ] **Step 3: Install dependencies**

```bash
cd grabber
pip install -r requirements.txt
playwright install chromium
```

Expected: `chromium` browser downloaded, no errors.

- [ ] **Step 4: Verify playwright works**

```bash
python -c "from playwright.sync_api import sync_playwright; print('ok')"
```

Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add grabber/
git commit -m "chore: scaffold site grabber project"
```

---

### Task 2: interceptor.py — URL-to-path mapping

**Files:**
- Create: `grabber/interceptor.py`
- Create: `grabber/tests/test_interceptor.py`

- [ ] **Step 1: Write failing tests**

`grabber/tests/test_interceptor.py`:

```python
from pathlib import Path
import pytest
from interceptor import url_to_local_path


def test_root_url_becomes_index():
    result = url_to_local_path("https://example.com/", Path("/out"))
    assert result == Path("/out/example.com/index.html")


def test_bare_domain_becomes_index():
    result = url_to_local_path("https://example.com", Path("/out"))
    assert result == Path("/out/example.com/index.html")


def test_page_without_extension_gets_index():
    result = url_to_local_path("https://example.com/about", Path("/out"))
    assert result == Path("/out/example.com/about/index.html")


def test_page_with_trailing_slash_gets_index():
    result = url_to_local_path("https://example.com/blog/", Path("/out"))
    assert result == Path("/out/example.com/blog/index.html")


def test_asset_with_extension_preserved():
    result = url_to_local_path("https://cdn.example.com/img/logo.png", Path("/out"))
    assert result == Path("/out/cdn.example.com/img/logo.png")


def test_css_with_extension_preserved():
    result = url_to_local_path("https://example.com/templates/css/main.abc123.css", Path("/out"))
    assert result == Path("/out/example.com/templates/css/main.abc123.css")


def test_query_string_stripped():
    result = url_to_local_path("https://example.com/style.css?v=123", Path("/out"))
    assert result == Path("/out/example.com/style.css")


def test_fragment_stripped():
    result = url_to_local_path("https://example.com/page#section", Path("/out"))
    assert result == Path("/out/example.com/page/index.html")


def test_cdn_subdomain_uses_full_hostname():
    result = url_to_local_path("https://cdn.napsgear.org/files/img/photo.jpg", Path("/out"))
    assert result == Path("/out/cdn.napsgear.org/files/img/photo.jpg")
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd grabber
pytest tests/test_interceptor.py -v
```

Expected: `ImportError: No module named 'interceptor'`

- [ ] **Step 3: Implement interceptor.py**

`grabber/interceptor.py`:

```python
import sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import Response


def url_to_local_path(url: str, output_dir: Path) -> Path:
    parsed = urlparse(url)
    path = parsed.path

    if not path or path == "/":
        path = "/index.html"
    elif path.endswith("/"):
        path = path + "index.html"
    elif "." not in Path(path).name:
        path = path + "/index.html"

    return output_dir / parsed.netloc / path.lstrip("/")


class Interceptor:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.saved: set[str] = set()

    def handle_response(self, response: Response) -> None:
        url = response.url
        if url in self.saved:
            return
        if response.status < 200 or response.status >= 400:
            return

        content_type = response.headers.get("content-type", "")
        skip_types = ("text/html",)  # HTML saved separately by crawler
        if any(ct in content_type for ct in skip_types):
            return

        try:
            body = response.body()
        except Exception as e:
            print(f"  [skip] {url}: {e}", file=sys.stderr)
            return

        local_path = url_to_local_path(url, self.output_dir)
        local_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            local_path.write_bytes(body)
            self.saved.add(url)
        except Exception as e:
            print(f"  [write error] {local_path}: {e}", file=sys.stderr)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd grabber
pytest tests/test_interceptor.py -v
```

Expected: all 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add grabber/interceptor.py grabber/tests/test_interceptor.py
git commit -m "feat: add interceptor url_to_local_path and response handler"
```

---

### Task 3: cookies.py — cookie loading

**Files:**
- Create: `grabber/cookies.py`
- Create: `grabber/tests/test_cookies.py`

- [ ] **Step 1: Write failing tests**

`grabber/tests/test_cookies.py`:

```python
import json
import tempfile
from cookies import load_cookies


def test_loads_chrome_export_format():
    data = [
        {
            "name": "cf_clearance",
            "value": "abc123",
            "domain": ".example.com",
            "path": "/",
            "secure": True,
            "httpOnly": False,
            "expirationDate": 1999999999,
        }
    ]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        path = f.name

    result = load_cookies(path)

    assert len(result) == 1
    assert result[0]["name"] == "cf_clearance"
    assert result[0]["value"] == "abc123"
    assert result[0]["domain"] == ".example.com"
    assert result[0]["expires"] == 1999999999


def test_loads_multiple_cookies():
    data = [
        {"name": "a", "value": "1", "domain": "example.com", "path": "/",
         "secure": False, "httpOnly": False},
        {"name": "b", "value": "2", "domain": "example.com", "path": "/",
         "secure": True, "httpOnly": True, "expirationDate": 2000000000},
    ]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        path = f.name

    result = load_cookies(path)
    assert len(result) == 2
    assert result[1]["expires"] == 2000000000


def test_missing_expiration_omitted():
    data = [{"name": "session", "value": "xyz", "domain": "example.com",
             "path": "/", "secure": False, "httpOnly": False}]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        path = f.name

    result = load_cookies(path)
    assert "expires" not in result[0]
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd grabber
pytest tests/test_cookies.py -v
```

Expected: `ImportError: No module named 'cookies'`

- [ ] **Step 3: Implement cookies.py**

`grabber/cookies.py`:

```python
import json
from pathlib import Path


def load_cookies(path: str) -> list[dict]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    cookies = []
    for c in data:
        cookie: dict = {
            "name": c["name"],
            "value": c["value"],
            "domain": c.get("domain", ""),
            "path": c.get("path", "/"),
            "secure": c.get("secure", False),
            "httpOnly": c.get("httpOnly", False),
        }
        expiry = c.get("expirationDate") or c.get("expires")
        if expiry is not None:
            cookie["expires"] = int(expiry)
        cookies.append(cookie)
    return cookies
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd grabber
pytest tests/test_cookies.py -v
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add grabber/cookies.py grabber/tests/test_cookies.py
git commit -m "feat: add cookie loader for Cloudflare/auth bypass"
```

---

### Task 4: crawler.py — BFS queue and link extraction

**Files:**
- Create: `grabber/crawler.py`
- Create: `grabber/tests/test_crawler.py`

- [ ] **Step 1: Write failing tests**

`grabber/tests/test_crawler.py`:

```python
from crawler import Crawler


def test_seed_url_in_initial_queue():
    c = Crawler("https://example.com/")
    item = c.next()
    assert item == ("https://example.com/", 0)


def test_should_visit_same_host():
    c = Crawler("https://example.com/")
    c.next()  # consume seed
    assert c.should_visit("https://example.com/about", 1) is True


def test_should_not_visit_different_host():
    c = Crawler("https://example.com/")
    assert c.should_visit("https://other.com/page", 1) is False


def test_should_not_visit_already_visited():
    c = Crawler("https://example.com/")
    c.next()  # marks seed as visited
    assert c.should_visit("https://example.com/", 0) is False


def test_should_not_visit_beyond_max_depth():
    c = Crawler("https://example.com/", max_depth=2)
    assert c.should_visit("https://example.com/deep", 3) is False
    assert c.should_visit("https://example.com/shallow", 2) is True


def test_should_not_visit_beyond_max_pages():
    c = Crawler("https://example.com/", max_pages=1)
    c.next()  # consume seed (pages_crawled = 1)
    assert c.should_visit("https://example.com/about", 1) is False


def test_exclude_pattern_blocks_url():
    c = Crawler("https://example.com/", exclude_pattern="/cart/*")
    assert c.should_visit("https://example.com/cart/item", 1) is False
    assert c.should_visit("https://example.com/blog/post", 1) is True


def test_include_pattern_gates_url():
    c = Crawler("https://example.com/", include_pattern="/blog/*")
    assert c.should_visit("https://example.com/blog/post", 1) is True
    assert c.should_visit("https://example.com/shop/item", 1) is False


def test_add_links_enqueues_unvisited():
    c = Crawler("https://example.com/")
    c.next()  # consume seed
    c.add_links(["https://example.com/a", "https://example.com/b"], current_depth=0)
    item = c.next()
    assert item is not None
    assert item[0] in ("https://example.com/a", "https://example.com/b")


def test_add_links_skips_already_visited():
    c = Crawler("https://example.com/")
    c.next()  # marks "https://example.com/" visited
    c.add_links(["https://example.com/"], current_depth=0)
    assert c.next() is None
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd grabber
pytest tests/test_crawler.py -v
```

Expected: `ImportError: No module named 'crawler'`

- [ ] **Step 3: Implement crawler.py**

`grabber/crawler.py`:

```python
import re
import sys
from collections import deque
from urllib.parse import urlparse, urljoin
from playwright.sync_api import Page


def _glob_to_regex(pattern: str) -> re.Pattern:
    escaped = re.escape(pattern).replace(r"\*", ".*")
    return re.compile(escaped)


class Crawler:
    def __init__(
        self,
        seed_url: str,
        max_pages: int | None = None,
        max_depth: int | None = None,
        include_pattern: str | None = None,
        exclude_pattern: str | None = None,
    ):
        self.seed_host = urlparse(seed_url).netloc
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.include_re = _glob_to_regex(include_pattern) if include_pattern else None
        self.exclude_re = _glob_to_regex(exclude_pattern) if exclude_pattern else None
        self.visited: set[str] = set()
        self.queue: deque[tuple[str, int]] = deque([(seed_url, 0)])
        self.pages_crawled = 0

    def should_visit(self, url: str, depth: int) -> bool:
        if url in self.visited:
            return False
        if self.max_pages is not None and self.pages_crawled >= self.max_pages:
            return False
        if self.max_depth is not None and depth > self.max_depth:
            return False
        parsed = urlparse(url)
        if parsed.netloc != self.seed_host:
            return False
        if parsed.scheme not in ("http", "https"):
            return False
        if self.include_re and not self.include_re.search(parsed.path):
            return False
        if self.exclude_re and self.exclude_re.search(parsed.path):
            return False
        return True

    def next(self) -> tuple[str, int] | None:
        while self.queue:
            url, depth = self.queue.popleft()
            if self.should_visit(url, depth):
                self.visited.add(url)
                self.pages_crawled += 1
                return url, depth
        return None

    def add_links(self, links: list[str], current_depth: int) -> None:
        for link in links:
            if link not in self.visited:
                self.queue.append((link, current_depth + 1))


def extract_links(page: Page, base_url: str) -> list[str]:
    seed_host = urlparse(base_url).netloc
    try:
        hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
    except Exception as e:
        print(f"  [link extract error] {e}", file=sys.stderr)
        return []

    results = []
    for href in hrefs:
        parsed = urlparse(href)
        if parsed.netloc == seed_host and parsed.scheme in ("http", "https"):
            normalized = parsed._replace(fragment="", query="").geturl()
            results.append(normalized)
    return list(set(results))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd grabber
pytest tests/test_crawler.py -v
```

Expected: all 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add grabber/crawler.py grabber/tests/test_crawler.py
git commit -m "feat: add BFS crawler with depth/page/pattern limits"
```

---

### Task 5: rewriter.py — URL rewriting and SVG inlining

**Files:**
- Create: `grabber/rewriter.py`
- Create: `grabber/tests/test_rewriter.py`

- [ ] **Step 1: Write failing tests**

`grabber/tests/test_rewriter.py`:

```python
import os
from pathlib import Path
from rewriter import make_relative, rewrite_html_urls, rewrite_css_urls, inline_svg_sprites


def test_make_relative_same_host_deeper():
    from_file = Path("/out/example.com/page/index.html")
    to_url = "https://example.com/other/page"
    result = make_relative(from_file, to_url, Path("/out"))
    assert result == os.path.normpath("../other/page/index.html").replace("\\", "/")


def test_make_relative_cdn_asset():
    from_file = Path("/out/example.com/index.html")
    to_url = "https://cdn.example.com/img/logo.png"
    result = make_relative(from_file, to_url, Path("/out"))
    assert result == os.path.normpath("../cdn.example.com/img/logo.png").replace("\\", "/")


def test_rewrite_html_href():
    html = '<a href="https://example.com/about">About</a>'
    from_file = Path("/out/example.com/index.html")
    result = rewrite_html_urls(html, from_file, Path("/out"))
    assert 'href="about/index.html"' in result


def test_rewrite_html_src():
    html = '<img src="https://cdn.example.com/img/logo.png">'
    from_file = Path("/out/example.com/index.html")
    result = rewrite_html_urls(html, from_file, Path("/out"))
    assert 'src="../cdn.example.com/img/logo.png"' in result


def test_rewrite_css_url_double_quotes():
    css = 'background: url("https://cdn.example.com/img/bg.jpg");'
    from_file = Path("/out/example.com/css/style.css")
    result = rewrite_css_urls(css, from_file, Path("/out"))
    assert "cdn.example.com/img/bg.jpg" in result
    assert "https://" not in result


def test_rewrite_css_url_no_quotes():
    css = "background: url(https://cdn.example.com/img/bg.jpg);"
    from_file = Path("/out/example.com/css/style.css")
    result = rewrite_css_urls(css, from_file, Path("/out"))
    assert "https://" not in result


def test_inline_svg_sprites_replaces_use_hrefs(tmp_path):
    svg_content = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none"><symbol id="icon-search" viewBox="0 0 24 24"><path d="M1 1"/></symbol></svg>'
    svg_file = tmp_path / "icons.svg"
    svg_file.write_text(svg_content)

    html = f'<body><svg><use href="{svg_file}#icon-search"></use></svg></body>'
    result = inline_svg_sprites(html, tmp_path)

    assert 'href="#icon-search"' in result
    assert "icon-search" in result
    assert str(svg_file) not in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd grabber
pytest tests/test_rewriter.py -v
```

Expected: `ImportError: No module named 'rewriter'`

- [ ] **Step 3: Implement rewriter.py**

`grabber/rewriter.py`:

```python
import os
import re
import sys
from pathlib import Path

from interceptor import url_to_local_path

_ABS_URL_RE = re.compile(r'https?://[^\s"\'>)]+')


def make_relative(from_file: Path, to_url: str, output_dir: Path) -> str:
    to_path = url_to_local_path(to_url, output_dir)
    try:
        rel = os.path.relpath(to_path, from_file.parent)
    except ValueError:
        return str(to_path)
    return rel.replace("\\", "/")


def rewrite_html_urls(html: str, from_file: Path, output_dir: Path) -> str:
    def replace_attr(match: re.Match) -> str:
        url = match.group(0)
        if not url.startswith("http"):
            return url
        return make_relative(from_file, url, output_dir)

    # Replace href="..." and src="..." absolute URLs
    html = re.sub(
        r'(?<=href=")[^"]*https?://[^"]*(?=")',
        replace_attr,
        html,
    )
    html = re.sub(
        r'(?<=src=")[^"]*https?://[^"]*(?=")',
        replace_attr,
        html,
    )
    return html


def rewrite_css_urls(css: str, from_file: Path, output_dir: Path) -> str:
    def replace_url(match: re.Match) -> str:
        url = match.group(1).strip("\"'")
        if not url.startswith("http"):
            return match.group(0)
        rel = make_relative(from_file, url, output_dir)
        return f"url({rel})"

    return re.sub(r"url\(([^)]+)\)", replace_url, css)


def inline_svg_sprites(html: str, html_dir: Path) -> str:
    # Find all unique .svg file paths referenced in <use href="...#symbol">
    sprite_re = re.compile(r'href="([^"]+\.svg)#([^"]+)"')
    svg_files: dict[str, str] = {}

    for match in sprite_re.finditer(html):
        svg_path_str = match.group(1)
        svg_path = Path(svg_path_str)
        if not svg_path.is_absolute():
            svg_path = html_dir / svg_path

        if str(svg_path) not in svg_files and svg_path.exists():
            svg_files[str(svg_path)] = svg_path.read_text(encoding="utf-8")

    if not svg_files:
        return html

    # Rewrite all <use href="path/to/sprite.svg#id"> → <use href="#id">
    def strip_path(match: re.Match) -> str:
        symbol_id = match.group(2)
        return f'href="#{symbol_id}"'

    html = sprite_re.sub(strip_path, html)

    # Inject all SVG sprites inline at start of <body>
    inline_block = "\n".join(svg_files.values())
    html = re.sub(r"(<body[^>]*>)", rf"\1\n{inline_block}", html, count=1)

    return html


def rewrite_all(output_dir: Path) -> None:
    html_files = list(output_dir.rglob("*.html"))
    css_files = list(output_dir.rglob("*.css"))

    print(f"Rewriting URLs in {len(html_files)} HTML and {len(css_files)} CSS files...")

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding="utf-8", errors="replace")
            rewritten = rewrite_css_urls(content, css_file, output_dir)
            css_file.write_text(rewritten, encoding="utf-8")
        except Exception as e:
            print(f"  [rewrite error] {css_file}: {e}", file=sys.stderr)

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8", errors="replace")
            rewritten = rewrite_html_urls(content, html_file, output_dir)
            rewritten = inline_svg_sprites(rewritten, html_file.parent)
            html_file.write_text(rewritten, encoding="utf-8")
        except Exception as e:
            print(f"  [rewrite error] {html_file}: {e}", file=sys.stderr)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd grabber
pytest tests/test_rewriter.py -v
```

Expected: all 7 tests PASS

- [ ] **Step 5: Run all tests together**

```bash
cd grabber
pytest tests/ -v
```

Expected: all 29 tests PASS

- [ ] **Step 6: Commit**

```bash
git add grabber/rewriter.py grabber/tests/test_rewriter.py
git commit -m "feat: add URL rewriter and SVG sprite inliner"
```

---

### Task 6: grab.py — CLI entry point

**Files:**
- Create: `grabber/grab.py`

- [ ] **Step 1: Implement grab.py**

`grabber/grab.py`:

```python
import sys
from pathlib import Path

import click
from playwright.sync_api import sync_playwright
from tqdm import tqdm

from cookies import load_cookies
from crawler import Crawler, extract_links
from interceptor import Interceptor, url_to_local_path
from rewriter import rewrite_all


@click.command()
@click.argument("url")
@click.option("--output", default="./output", show_default=True, help="Output directory")
@click.option("--max-pages", default=None, type=int, help="Stop after N pages")
@click.option("--depth", default=None, type=int, help="Max link depth from seed URL")
@click.option(
    "--wait-for",
    "wait_for",
    default="idle",
    show_default=True,
    help="'idle' (network idle) or milliseconds to wait after load",
)
@click.option("--cookies", "cookies_file", default=None, help="Path to cookies.json")
@click.option("--concurrency", default=1, show_default=True, type=int, help="Parallel tabs")
@click.option("--include", default=None, help="Only follow URLs matching glob (e.g. /blog/*)")
@click.option("--exclude", default=None, help="Skip URLs matching glob (e.g. /cart/*)")
def main(url, output, max_pages, depth, wait_for, cookies_file, concurrency, include, exclude):
    output_dir = Path(output)
    output_dir.mkdir(parents=True, exist_ok=True)

    crawler = Crawler(
        url,
        max_pages=max_pages,
        max_depth=depth,
        include_pattern=include,
        exclude_pattern=exclude,
    )
    interceptor = Interceptor(output_dir)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )

        if cookies_file:
            context.add_cookies(load_cookies(cookies_file))

        page = context.new_page()
        page.on("response", interceptor.handle_response)

        bar = tqdm(desc="Crawling", unit="pages", file=sys.stdout)

        while True:
            item = crawler.next()
            if item is None:
                break
            current_url, current_depth = item
            bar.set_postfix({"url": current_url[:60], "queued": len(crawler.queue)})

            try:
                if wait_for == "idle":
                    page.goto(current_url, wait_until="networkidle", timeout=30000)
                else:
                    page.goto(current_url, wait_until="load", timeout=30000)
                    page.wait_for_timeout(int(wait_for))

                # Save the rendered HTML (after JS execution)
                local_path = url_to_local_path(current_url, output_dir)
                local_path.parent.mkdir(parents=True, exist_ok=True)
                local_path.write_text(page.content(), encoding="utf-8")

                links = extract_links(page, url)
                crawler.add_links(links, current_depth)
                bar.update(1)

            except Exception as e:
                print(f"\n[error] {current_url}: {e}", file=sys.stderr)

        bar.close()
        browser.close()

    print(f"\nPost-processing {crawler.pages_crawled} pages...")
    rewrite_all(output_dir)

    seed_host = crawler.seed_host
    entry = output_dir / seed_host / "index.html"
    print(f"\nDone! Open: {entry}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify CLI help works**

```bash
cd grabber
python grab.py --help
```

Expected output:
```
Usage: grab.py [OPTIONS] URL
...
Options:
  --output TEXT
  --max-pages INTEGER
  --depth INTEGER
  --wait-for TEXT
  --cookies TEXT
  --concurrency INTEGER
  --include TEXT
  --exclude TEXT
  --help
```

- [ ] **Step 3: Smoke test against a simple static site**

```bash
cd grabber
python grab.py https://example.com --output ./test-output --max-pages 1
```

Expected:
- Progress bar shows 1 page crawled
- `test-output/example.com/index.html` exists and contains rendered HTML
- `Done! Open: test-output/example.com/index.html`

- [ ] **Step 4: Verify the output file is valid HTML**

```bash
head -5 grabber/test-output/example.com/index.html
```

Expected: starts with `<!doctype html>` or `<html`

- [ ] **Step 5: Clean up test output and commit**

```bash
rm -rf grabber/test-output
git add grabber/grab.py
git commit -m "feat: add grab.py CLI entry point"
```

---

### Task 7: End-to-end smoke test with a multi-page site

**Files:** None modified

- [ ] **Step 1: Crawl a small real multi-page site**

```bash
cd grabber
python grab.py https://quotes.toscrape.com --output ./smoke-output --max-pages 5
```

Expected:
- 5 pages crawled
- `smoke-output/quotes.toscrape.com/index.html` exists
- Multiple subdirectory pages saved

- [ ] **Step 2: Check assets were captured**

```bash
ls grabber/smoke-output/quotes.toscrape.com/
find grabber/smoke-output -name "*.css" | head -5
```

Expected: CSS files present, directory structure mirrors site URLs

- [ ] **Step 3: Verify no absolute URLs remain in HTML**

```bash
grep -r "https://quotes.toscrape.com" grabber/smoke-output/ | wc -l
```

Expected: `0` (all rewritten to relative)

- [ ] **Step 4: Open offline in browser**

Open `grabber/smoke-output/quotes.toscrape.com/index.html` in browser with network disconnected. Page should render with full styling.

- [ ] **Step 5: Clean up smoke output and commit**

```bash
rm -rf grabber/smoke-output
git add grabber/
git commit -m "chore: verified end-to-end crawl with quotes.toscrape.com"
```
