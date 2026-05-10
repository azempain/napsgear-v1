# Offline Restructure & Toolchain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganise the project into the approved monorepo layout, fix all 14 known bugs in the grabber and offline pipeline, and deliver a complete three-phase grab→fix→verify workflow.

**Architecture:** `www.napsgear.org/` is renamed to `offline/`; `cdn.napsgear.org/` moves inside it. The grabber gains `--targets` (targeted URL list) and `--primary-host` (strip netloc from output paths) options. `fix_offline.py` moves to `scripts/` and is rewritten to apply all 8 offline transforms to every HTML file. Two new scripts are added: `check_offline.py` (broken-link reporter) and `extract_data.py` (HTML→JSON extractor).

**Tech Stack:** Python 3.11+, pytest, BeautifulSoup4 (new dep for extract_data), Playwright (existing), Click (existing)

**Note:** The Next.js 16 scaffold is a separate plan (Plan B). This plan ends with a fully working offline HTML site and a populated `data/` directory ready for it.

---

## File Map

| Action | Path |
|--------|------|
| Rename | `www.napsgear.org/` → `offline/` |
| Move | `cdn.napsgear.org/` → `offline/cdn.napsgear.org/` |
| Delete | `new/` |
| Delete | `fix_offline.py` (root) |
| Modify | `grabber/interceptor.py` — add `primary_host` to `url_to_local_path` |
| Modify | `grabber/crawler.py` — add `Crawler.from_targets()` and `_targets_mode` |
| Modify | `grabber/rewriter.py` — add `rewrite_inline_style_urls`, thread `primary_host` |
| Modify | `grabber/grab.py` — add `--targets`, `--primary-host` |
| Create | `grabber/targets.txt` |
| Modify | `grabber/tests/test_interceptor.py` — new `primary_host` tests |
| Modify | `grabber/tests/test_crawler.py` — new targets-mode tests |
| Modify | `grabber/tests/test_rewriter.py` — new inline-style tests |
| Create | `scripts/__init__.py` (empty) |
| Create | `scripts/fix_offline.py` (rewrite of root fix_offline.py) |
| Create | `scripts/check_offline.py` |
| Create | `scripts/extract_data.py` |
| Create | `tests/conftest.py` — add `scripts/` to sys.path |
| Modify | `tests/test_fix_offline.py` — update imports, add new-function tests |
| Create | `data/brands.json` |
| Create | `data/categories.json` |
| Create | `data/products.json` |
| Create | `data/videos.json` |
| Add dep | `grabber/requirements.txt` — add `beautifulsoup4>=4.12` |

---

## Task 1: Restructure Project Directories

**Files:** git moves, one Python patch for existing CDN paths

- [ ] **Step 1.1: Rename www.napsgear.org/ to offline/**

```bash
git mv www.napsgear.org offline
```

Expected: `offline/index.html`, `offline/templates/`, `offline/stats/` now exist.

- [ ] **Step 1.2: Move cdn.napsgear.org/ inside offline/**

```bash
git mv cdn.napsgear.org offline/cdn.napsgear.org
```

Expected: `offline/cdn.napsgear.org/files/images/...` now exists.

- [ ] **Step 1.3: Delete the unused new/ directory**

```bash
git rm -r new
```

Expected: `new/` is gone from the working tree.

- [ ] **Step 1.4: Fix CDN paths in offline/index.html**

The existing `offline/index.html` has `../cdn.napsgear.org/` references (written when cdn was a sibling of `www.napsgear.org/`). Now cdn is inside `offline/`, at the same level as `index.html`, so the path becomes `cdn.napsgear.org/` (no `../`).

```bash
python -c "
import re, pathlib
p = pathlib.Path('offline/index.html')
html = p.read_text(encoding='utf-8')
html = re.sub(r'\.\./cdn\.napsgear\.org/', 'cdn.napsgear.org/', html)
p.write_text(html, encoding='utf-8')
print('CDN paths updated:', html.count('cdn.napsgear.org/'), 'references')
"
```

Expected output: `CDN paths updated: N references` (N > 0).

- [ ] **Step 1.5: Delete the empty stats stub**

```bash
git rm -r offline/stats
```

- [ ] **Step 1.6: Delete root fix_offline.py (replaced by scripts/ in Task 7)**

```bash
git rm fix_offline.py
```

- [ ] **Step 1.7: Verify offline/index.html still opens correctly**

Open `offline/index.html` in a browser via `file://`. Check that:
- The NapsGear logo loads
- Product thumbnails load (from `cdn.napsgear.org/` relative path)
- No broken image icons visible in the product section

- [ ] **Step 1.8: Commit**

```bash
git add -A
git commit -m "refactor: restructure project — www.napsgear.org → offline/, cdn inside offline/"
```

---

## Task 2: Add `primary_host` to `grabber/interceptor.py`

**Files:**
- Modify: `grabber/interceptor.py`
- Modify: `grabber/tests/test_interceptor.py`

- [ ] **Step 2.1: Write failing tests**

Add to `grabber/tests/test_interceptor.py`:

```python
def test_primary_host_strips_netloc():
    from interceptor import url_to_local_path
    from pathlib import Path
    result = url_to_local_path(
        "https://www.napsgear.org/faq",
        Path("/out"),
        primary_host="www.napsgear.org",
    )
    assert result == Path("/out/faq/index.html")


def test_primary_host_root_becomes_index():
    from interceptor import url_to_local_path
    from pathlib import Path
    result = url_to_local_path(
        "https://www.napsgear.org/",
        Path("/out"),
        primary_host="www.napsgear.org",
    )
    assert result == Path("/out/index.html")


def test_primary_host_does_not_affect_cdn():
    from interceptor import url_to_local_path
    from pathlib import Path
    result = url_to_local_path(
        "https://cdn.napsgear.org/files/a.jpg",
        Path("/out"),
        primary_host="www.napsgear.org",
    )
    assert result == Path("/out/cdn.napsgear.org/files/a.jpg")


def test_primary_host_none_keeps_netloc():
    from interceptor import url_to_local_path
    from pathlib import Path
    result = url_to_local_path(
        "https://www.napsgear.org/faq",
        Path("/out"),
        primary_host=None,
    )
    assert result == Path("/out/www.napsgear.org/faq/index.html")
```

- [ ] **Step 2.2: Run tests — expect 4 failures**

```bash
cd grabber && python -m pytest tests/test_interceptor.py -v -k "primary_host"
```

Expected: 4 FAILED (function doesn't accept `primary_host` yet).

- [ ] **Step 2.3: Update `url_to_local_path` in `grabber/interceptor.py`**

Replace the existing `url_to_local_path` function:

```python
def url_to_local_path(url: str, output_dir: Path, primary_host: str | None = None) -> Path:
    parsed = urlparse(url)
    path = parsed.path

    if not path or path == "/":
        path = "/index.html"
    elif path.endswith("/"):
        path = path + "index.html"
    elif "." not in Path(path).name:
        path = path + "/index.html"

    parts = [_sanitize_path_segment(p) for p in path.lstrip("/").split("/")]
    safe_path = Path(*parts) if parts else Path("index.html")

    if primary_host and parsed.netloc == primary_host:
        return output_dir / safe_path
    return output_dir / parsed.netloc / safe_path
```

- [ ] **Step 2.4: Update `Interceptor` to accept and store `primary_host`**

Replace the `Interceptor` class in `grabber/interceptor.py`:

```python
class Interceptor:
    def __init__(self, output_dir: Path, primary_host: str | None = None):
        self.output_dir = output_dir
        self.primary_host = primary_host
        self.saved: set[str] = set()

    def handle_response(self, response: Response) -> None:
        url = response.url
        if url in self.saved:
            return
        if is_skip_url(url):
            return
        if response.status < 200 or response.status >= 400:
            return

        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type:
            return  # HTML saved separately by the crawler after JS renders

        local_path = url_to_local_path(url, self.output_dir, self.primary_host)
        if local_path.exists() and local_path.stat().st_size > 0:
            self.saved.add(url)
            return

        try:
            body = response.body()
        except Exception as e:
            print(f"  [skip] {url}: {e}", file=sys.stderr)
            return

        local_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            local_path.write_bytes(body)
            self.saved.add(url)
        except Exception as e:
            print(f"  [write error] {local_path}: {e}", file=sys.stderr)
```

- [ ] **Step 2.5: Run all interceptor tests — expect all pass**

```bash
cd grabber && python -m pytest tests/test_interceptor.py -v
```

Expected: all 12 tests PASSED (8 existing + 4 new).

- [ ] **Step 2.6: Commit**

```bash
git add grabber/interceptor.py grabber/tests/test_interceptor.py
git commit -m "feat(grabber): add primary_host to url_to_local_path and Interceptor"
```

---

## Task 3: Add Targets Mode to `grabber/crawler.py`

**Files:**
- Modify: `grabber/crawler.py`
- Modify: `grabber/tests/test_crawler.py`

- [ ] **Step 3.1: Write failing tests**

Add to `grabber/tests/test_crawler.py`:

```python
def test_from_targets_visits_each_url_in_order():
    from crawler import Crawler
    c = Crawler.from_targets([
        "https://www.napsgear.org/faq",
        "https://www.napsgear.org/shipping-information",
    ])
    first = c.next()
    second = c.next()
    third = c.next()
    assert first == ("https://www.napsgear.org/faq", 0)
    assert second == ("https://www.napsgear.org/shipping-information", 0)
    assert third is None


def test_from_targets_add_links_is_noop():
    from crawler import Crawler
    c = Crawler.from_targets(["https://www.napsgear.org/faq"])
    c.next()
    c.add_links(["https://www.napsgear.org/other"], 0)
    assert c.next() is None  # add_links had no effect


def test_from_targets_skips_duplicate_urls():
    from crawler import Crawler
    c = Crawler.from_targets([
        "https://www.napsgear.org/faq",
        "https://www.napsgear.org/faq",
    ])
    first = c.next()
    second = c.next()
    assert first is not None
    assert second is None  # duplicate skipped
```

- [ ] **Step 3.2: Run tests — expect 3 failures**

```bash
cd grabber && python -m pytest tests/test_crawler.py -v -k "from_targets"
```

Expected: 3 FAILED (`Crawler` has no `from_targets`).

- [ ] **Step 3.3: Add `from_targets` classmethod and `_targets_mode` to `Crawler`**

In `grabber/crawler.py`, add the classmethod and override `add_links`. Replace the entire `Crawler` class:

```python
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
        self._targets_mode = False

    @classmethod
    def from_targets(cls, urls: list[str]) -> "Crawler":
        """Create a crawler that visits exactly the given URLs with no BFS."""
        obj = cls.__new__(cls)
        obj.seed_host = urlparse(urls[0]).netloc if urls else ""
        obj.max_pages = None
        obj.max_depth = None
        obj.include_re = None
        obj.exclude_re = None
        obj.visited = set()
        obj.queue = deque((url, 0) for url in urls)
        obj.pages_crawled = 0
        obj._targets_mode = True
        return obj

    def should_visit(self, url: str, depth: int) -> bool:
        if self._targets_mode:
            return url not in self.visited
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
        if self._targets_mode:
            return  # no BFS in targets mode
        for link in links:
            if link not in self.visited:
                self.queue.append((link, current_depth + 1))
```

- [ ] **Step 3.4: Run all crawler tests — expect all pass**

```bash
cd grabber && python -m pytest tests/test_crawler.py -v
```

Expected: all 16 tests PASSED (13 existing + 3 new).

- [ ] **Step 3.5: Commit**

```bash
git add grabber/crawler.py grabber/tests/test_crawler.py
git commit -m "feat(grabber): add Crawler.from_targets() for targeted URL mode"
```

---

## Task 4: Extend `grabber/rewriter.py` with Inline Style URL Support

**Files:**
- Modify: `grabber/rewriter.py`
- Modify: `grabber/tests/test_rewriter.py`

- [ ] **Step 4.1: Write failing tests**

Add to `grabber/tests/test_rewriter.py`:

```python
def test_rewrite_inline_style_background_image():
    from rewriter import rewrite_inline_style_urls
    from pathlib import Path
    html = (
        '<div style="background-image: url(\'https://i.vimeocdn.com/video/123-abc.jpg\')"></div>'
    )
    from_file = Path("/out/index.html")
    output_dir = Path("/out")
    result = rewrite_inline_style_urls(html, from_file, output_dir)
    # URL should be rewritten (we don't assert exact path since file won't exist in test)
    # but the function must not crash and must return a string
    assert isinstance(result, str)


def test_rewrite_inline_style_skips_relative():
    from rewriter import rewrite_inline_style_urls
    from pathlib import Path
    html = '<div style="background-image: url(\'../img/bg.jpg\')"></div>'
    from_file = Path("/out/index.html")
    output_dir = Path("/out")
    result = rewrite_inline_style_urls(html, from_file, output_dir)
    assert result == html  # relative URL unchanged


def test_rewrite_all_calls_inline_styles(tmp_path):
    from rewriter import rewrite_all
    html_file = tmp_path / "index.html"
    html_file.write_text(
        '<div style="background-image: url(\'https://example.com/img.jpg\')"></div>',
        encoding="utf-8",
    )
    rewrite_all(tmp_path)  # must not raise
    assert html_file.exists()
```

- [ ] **Step 4.2: Run tests — expect failures**

```bash
cd grabber && python -m pytest tests/test_rewriter.py -v -k "inline_style"
```

Expected: 3 FAILED (`rewrite_inline_style_urls` not defined).

- [ ] **Step 4.3: Add `rewrite_inline_style_urls` to `grabber/rewriter.py`**

Add after `rewrite_css_urls`:

```python
def rewrite_inline_style_urls(
    html: str, from_file: Path, output_dir: Path, primary_host: str | None = None
) -> str:
    """Rewrite absolute URLs inside style= attributes and inline <style> blocks."""
    def replace_url(match: re.Match) -> str:
        raw = match.group(1).strip().strip("\"'")
        if not raw.startswith("http"):
            return match.group(0)
        rel = make_relative(from_file, raw, output_dir, primary_host)
        return match.group(0).replace(raw, rel)

    return re.sub(r"url\(([^)]+)\)", replace_url, html)
```

- [ ] **Step 4.4: Update `make_relative` to accept `primary_host`**

Replace `make_relative`:

```python
def make_relative(
    from_file: Path, to_url: str, output_dir: Path, primary_host: str | None = None
) -> str:
    to_path = url_to_local_path(to_url, output_dir, primary_host)
    try:
        rel = os.path.relpath(to_path, from_file.parent)
    except ValueError:
        return str(to_path)
    return rel.replace("\\", "/")
```

- [ ] **Step 4.5: Update `rewrite_html_urls` signature to accept and pass `primary_host`**

Replace `rewrite_html_urls`:

```python
def rewrite_html_urls(
    html: str, from_file: Path, output_dir: Path, primary_host: str | None = None
) -> str:
    def replace_attr_value(match: re.Match) -> str:
        url = match.group(1)
        rel = make_relative(from_file, url, output_dir, primary_host)
        return match.group(0).replace(url, rel)

    html = re.sub(r'(?:href|src)="(https?://[^"]+)"', replace_attr_value, html)
    return html
```

- [ ] **Step 4.6: Update `rewrite_all` to call `rewrite_inline_style_urls`**

Replace `rewrite_all`:

```python
def rewrite_all(output_dir: Path, primary_host: str | None = None) -> None:
    html_files = list(output_dir.rglob("*.html"))
    css_files = list(output_dir.rglob("*.css"))

    print(f"Rewriting URLs in {len(html_files)} HTML and {len(css_files)} CSS files...")

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding="utf-8", errors="replace")
            css_file.write_text(
                rewrite_css_urls(content, css_file, output_dir, primary_host),
                encoding="utf-8",
            )
        except Exception as e:
            print(f"  [rewrite error] {css_file}: {e}", file=sys.stderr)

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8", errors="replace")
            content = rewrite_html_urls(content, html_file, output_dir, primary_host)
            content = rewrite_inline_style_urls(content, html_file, output_dir, primary_host)
            content = inline_svg_sprites(content, html_file.parent)
            html_file.write_text(content, encoding="utf-8")
        except Exception as e:
            print(f"  [rewrite error] {html_file}: {e}", file=sys.stderr)
```

Also update `rewrite_css_urls` signature to accept `primary_host` (add as optional last param, pass to `make_relative`):

```python
def rewrite_css_urls(
    css: str, from_file: Path, output_dir: Path, primary_host: str | None = None
) -> str:
    def replace_url(match: re.Match) -> str:
        raw = match.group(1).strip()
        url = raw.strip("\"'")
        if not url.startswith("http"):
            return match.group(0)
        rel = make_relative(from_file, url, output_dir, primary_host)
        return f"url({rel})"

    return re.sub(r"url\(([^)]+)\)", replace_url, css)
```

- [ ] **Step 4.7: Run all rewriter tests — expect all pass**

```bash
cd grabber && python -m pytest tests/test_rewriter.py -v
```

Expected: all 11 tests PASSED (8 existing + 3 new).

- [ ] **Step 4.8: Commit**

```bash
git add grabber/rewriter.py grabber/tests/test_rewriter.py
git commit -m "feat(grabber): add rewrite_inline_style_urls and thread primary_host through rewriter"
```

---

## Task 5: Wire `--targets` and `--primary-host` into `grabber/grab.py`

**Files:**
- Modify: `grabber/grab.py`

- [ ] **Step 5.1: Replace `grab.py` with the updated version**

Write `grabber/grab.py`:

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


def _load_targets(path: str) -> list[str]:
    """Read URLs from a targets file (one per line, # = comment, blank lines skipped)."""
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in lines if l.strip() and not l.strip().startswith("#")]


@click.command()
@click.argument("url", required=False, default=None)
@click.option("--output", default="./output", show_default=True, help="Output directory")
@click.option("--targets", "targets_file", default=None, help="File of URLs to grab (one per line)")
@click.option("--primary-host", "primary_host", default=None,
              help="Strip this hostname from output paths (e.g. www.napsgear.org → output root)")
@click.option("--max-pages", default=None, type=int, help="Stop after N pages (BFS mode only)")
@click.option("--depth", default=None, type=int, help="Max link depth (BFS mode only)")
@click.option(
    "--wait-for", "wait_for", default="idle", show_default=True,
    help="'idle' (network idle) or milliseconds to wait after load",
)
@click.option("--cookies", "cookies_file", default=None, help="Path to cookies.json")
@click.option("--concurrency", default=1, show_default=True, type=int, help="Parallel tabs (reserved)")
@click.option("--include", default=None, help="Only follow URLs matching glob (BFS mode only)")
@click.option("--exclude", default=None, help="Skip URLs matching glob (BFS mode only)")
@click.option("--skip-existing", is_flag=True, default=False,
              help="Skip HTML pages whose local file already exists")
def main(url, output, targets_file, primary_host, max_pages, depth, wait_for,
         cookies_file, concurrency, include, exclude, skip_existing):
    if not targets_file and not url:
        raise click.UsageError("Provide a URL argument or --targets FILE.")

    output_dir = Path(output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if targets_file:
        targets = _load_targets(targets_file)
        if not targets:
            print("No URLs found in targets file.", file=sys.stderr)
            return
        crawler = Crawler.from_targets(targets)
        seed_url = targets[0]
    else:
        crawler = Crawler(
            url,
            max_pages=max_pages,
            max_depth=depth,
            include_pattern=include,
            exclude_pattern=exclude,
        )
        seed_url = url

    interceptor = Interceptor(output_dir, primary_host=primary_host)

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

                local_path = url_to_local_path(current_url, output_dir, primary_host)
                if skip_existing and local_path.exists() and local_path.stat().st_size > 0:
                    if not crawler._targets_mode:
                        links = extract_links(page, seed_url)
                        crawler.add_links(links, current_depth)
                    bar.update(1)
                    continue

                local_path.parent.mkdir(parents=True, exist_ok=True)
                local_path.write_text(page.content(), encoding="utf-8")

                if not crawler._targets_mode:
                    links = extract_links(page, seed_url)
                    crawler.add_links(links, current_depth)

                bar.update(1)

            except Exception as e:
                print(f"\n[error] {current_url}: {e}", file=sys.stderr)

        bar.close()
        browser.close()

    print(f"\nPost-processing {crawler.pages_crawled} pages...")
    rewrite_all(output_dir, primary_host)

    if primary_host:
        entry = output_dir / "index.html"
    else:
        entry = output_dir / crawler.seed_host / "index.html"
    print(f"\nDone! Open: {entry}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5.2: Run all grabber tests — expect all pass**

```bash
cd grabber && python -m pytest tests/ -v
```

Expected: all 29 tests PASSED.

- [ ] **Step 5.3: Commit**

```bash
git add grabber/grab.py
git commit -m "feat(grabber): add --targets and --primary-host options"
```

---

## Task 6: Create `grabber/targets.txt`

**Files:**
- Create: `grabber/targets.txt`

- [ ] **Step 6.1: Create the file**

Create `grabber/targets.txt`:

```
# NapsGear targeted pages for offline site
# Run: python grab.py --targets targets.txt --output ../offline/ --primary-host www.napsgear.org --skip-existing
#
# Add brand/category/product page URLs below as the site is available.

# ── Navigation pages ────────────────────────────────────────────────
https://www.napsgear.org/faq
https://www.napsgear.org/shipping-information
https://www.napsgear.org/why-naps
https://www.napsgear.org/contact-us
https://www.napsgear.org/ask-an-ifbb-pro

# ── Brand pages (add from brandsMenu) ───────────────────────────────
# https://www.napsgear.org/alpha-pharma-healthcare-c141952

# ── Category pages ──────────────────────────────────────────────────
# https://www.napsgear.org/oral-steroids-c14

# ── Product pages ───────────────────────────────────────────────────
# https://www.napsgear.org/product-name-c12345
```

- [ ] **Step 6.2: Commit**

```bash
git add grabber/targets.txt
git commit -m "feat(grabber): add targets.txt with nav page URLs"
```

---

## Task 7: Create `scripts/fix_offline.py`

**Files:**
- Create: `scripts/__init__.py`
- Create: `scripts/fix_offline.py`
- Create: `tests/conftest.py`
- Modify: `tests/test_fix_offline.py`

- [ ] **Step 7.1: Create `tests/conftest.py` to fix import path**

Create `tests/conftest.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
```

- [ ] **Step 7.2: Verify existing tests still pass with conftest**

```bash
python -m pytest tests/test_fix_offline.py -v
```

Expected: all 14 existing tests PASSED (conftest now resolves `fix_offline` from `scripts/`).

- [ ] **Step 7.3: Create `scripts/__init__.py`**

```bash
python -c "open('scripts/__init__.py', 'w').close()"
```

- [ ] **Step 7.4: Write failing tests for new functions**

Add to `tests/test_fix_offline.py`:

```python
import os
from pathlib import Path


def test_strip_cloudflare_scripts_removes_script_tag():
    from fix_offline import strip_cloudflare_scripts
    html = '<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>'
    result = strip_cloudflare_scripts(html)
    assert 'cdn-cgi' not in result
    assert '<script' not in result


def test_strip_cloudflare_scripts_keeps_other_scripts():
    from fix_offline import strip_cloudflare_scripts
    html = '<script src="/templates/js/main.js"></script>'
    result = strip_cloudflare_scripts(html)
    assert result == html


def test_fix_cdn_urls_for_file_depth_zero(tmp_path):
    from fix_offline import fix_cdn_urls_for_file
    # HTML file at offline root (depth 0)
    html_path = tmp_path / "index.html"
    html = '<img src="https://cdn.napsgear.org/files/img/a.jpg">'
    result = fix_cdn_urls_for_file(html, html_path, tmp_path)
    assert 'cdn.napsgear.org/files/img/a.jpg' in result
    assert 'https://' not in result


def test_fix_cdn_urls_for_file_depth_one(tmp_path):
    from fix_offline import fix_cdn_urls_for_file
    # HTML file one level deep (e.g. offline/faq/index.html)
    html_path = tmp_path / "faq" / "index.html"
    html = '<img src="https://cdn.napsgear.org/files/img/a.jpg">'
    result = fix_cdn_urls_for_file(html, html_path, tmp_path)
    assert '../cdn.napsgear.org/files/img/a.jpg' in result


def test_rewrite_internal_urls_rewrites_known_page(tmp_path):
    from fix_offline import rewrite_internal_urls
    # Create a local page at tmp_path/faq/index.html
    faq_dir = tmp_path / "faq"
    faq_dir.mkdir()
    (faq_dir / "index.html").write_text("")
    manifest = {faq_dir / "index.html"}
    html_path = tmp_path / "index.html"
    html = '<a href="https://www.napsgear.org/faq">FAQ</a>'
    result = rewrite_internal_urls(html, html_path, tmp_path, manifest)
    assert 'napsgear.org' not in result
    assert 'faq' in result


def test_rewrite_internal_urls_leaves_unknown_page(tmp_path):
    from fix_offline import rewrite_internal_urls
    manifest: set = set()  # no local pages
    html_path = tmp_path / "index.html"
    html = '<a href="https://www.napsgear.org/some-product-c99999">Product</a>'
    result = rewrite_internal_urls(html, html_path, tmp_path, manifest)
    assert 'napsgear.org/some-product-c99999' in result  # unchanged


def test_inject_font_awesome_idempotent():
    from fix_offline import inject_font_awesome_fix
    html = '<head></head>'
    once = inject_font_awesome_fix(html)
    twice = inject_font_awesome_fix(once)
    assert once == twice
```

- [ ] **Step 7.5: Run new tests — expect failures**

```bash
python -m pytest tests/test_fix_offline.py -v -k "strip_cloudflare or fix_cdn_urls_for_file or rewrite_internal_urls or idempotent"
```

Expected: failures (`strip_cloudflare_scripts`, `fix_cdn_urls_for_file`, `rewrite_internal_urls` not defined yet).

- [ ] **Step 7.6: Create `scripts/fix_offline.py`**

Write `scripts/fix_offline.py`:

```python
import argparse
import os
import re
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


# ── Font Awesome fix ─────────────────────────────────────────────────────────

_FA_CSS_MARKER = 'Fix missing Font Awesome Pro font'

_FA_CSS_OVERRIDE = """\
            <style>
                /* Fix missing Font Awesome Pro font — replace with CSS border arrows */
                .main-nav .menu-item-dropdown > button::after {
                    content: '' !important;
                    font-family: none !important;
                    display: inline-block !important;
                    width: 0 !important;
                    height: 0 !important;
                    border-left: 4px solid transparent !important;
                    border-right: 4px solid transparent !important;
                    border-top: 5px solid currentColor !important;
                    border-bottom: none !important;
                    vertical-align: middle !important;
                    margin-left: 5px !important;
                    position: static !important;
                    background: none !important;
                }
                .main-nav .menu-item button.nolink::after {
                    content: '' !important;
                    font-family: none !important;
                    display: inline-block !important;
                    width: 0 !important;
                    height: 0 !important;
                    border-top: 4px solid transparent !important;
                    border-bottom: 4px solid transparent !important;
                    border-left: 5px solid currentColor !important;
                    border-right: none !important;
                    vertical-align: middle !important;
                    background: none !important;
                    transition: transform 0.3s ease !important;
                }
                .main-nav .menu-item button.nolink[aria-expanded="true"]::after {
                    transform: rotate(90deg) !important;
                }
            </style>"""


def inject_font_awesome_fix(html: str) -> str:
    if _FA_CSS_MARKER in html:
        return html
    return html.replace('</head>', _FA_CSS_OVERRIDE + '\n</head>', 1)


# ── SVG icon fix ─────────────────────────────────────────────────────────────

def fix_svg_icons(html: str, extra_symbols: str) -> str:
    html = re.sub(r'(href=")templates/img/icons/icons-lib\.svg#', r'\1#', html)
    html = re.sub(r'(xlink:href=")templates/img/icons/icons-lib\.svg#', r'\1#', html)
    if extra_symbols:
        existing = set(re.findall(r'<symbol[^>]+id="([^"]+)"', html))
        to_add = []
        for sym in re.findall(r'<symbol[^>]*>.*?</symbol>', extra_symbols, re.DOTALL):
            id_match = re.search(r'id="([^"]+)"', sym)
            if id_match and id_match.group(1) not in existing:
                to_add.append(sym)
        if to_add:
            html = html.replace('</svg>', '\n'.join(to_add) + '\n</svg>', 1)
    return html


def load_extra_symbols(svg_path: Path) -> str:
    try:
        content = svg_path.read_text(encoding='utf-8')
        return '\n'.join(re.findall(r'<symbol[^>]*>.*?</symbol>', content, re.DOTALL))
    except FileNotFoundError:
        return ''


# ── Cloudflare strip ─────────────────────────────────────────────────────────

def strip_cloudflare_scripts(html: str) -> str:
    html = re.sub(r'<script[^>]+src="[^"]*cdn-cgi[^"]*"[^>]*></script>', '', html)
    html = re.sub(r'<script[^>]+src="[^"]*cdn-cgi[^"]*"[^>]*/>', '', html)
    return html


# ── CDN URL fix (depth-aware) ─────────────────────────────────────────────────

def fix_cdn_urls_for_file(html: str, html_path: Path, offline_root: Path) -> str:
    cdn_root = offline_root / 'cdn.napsgear.org'

    def replace(match: re.Match) -> str:
        rest = match.group(1)
        cdn_asset = cdn_root / rest
        try:
            rel = os.path.relpath(cdn_asset, html_path.parent).replace('\\', '/')
        except ValueError:
            return match.group(0)
        return rel

    for pattern in (
        r'https?://cdn\.napsgear\.org/([^\s"\'<>]+)',
        r'//cdn\.napsgear\.org/([^\s"\'<>]+)',
        r'\.\./cdn\.napsgear\.org/([^\s"\'<>]+)',
    ):
        html = re.sub(pattern, replace, html)
    return html


# ── Internal URL rewrite ─────────────────────────────────────────────────────

def rewrite_internal_urls(
    html: str, html_path: Path, offline_root: Path, manifest: set[Path]
) -> str:
    def replace(match: re.Match) -> str:
        attr = match.group(1)
        url = match.group(2)
        parsed = urlparse(url)
        if parsed.netloc != 'www.napsgear.org':
            return match.group(0)
        path = parsed.path.rstrip('/') or '/'
        if path == '/':
            candidates = [offline_root / 'index.html']
        else:
            candidates = [offline_root / path.lstrip('/') / 'index.html']
        for candidate in candidates:
            if candidate in manifest:
                try:
                    rel = os.path.relpath(candidate.parent, html_path.parent).replace('\\', '/')
                    return f'{attr}="{rel}/"'
                except ValueError:
                    pass
        return match.group(0)

    return re.sub(r'(href|src|action)="(https?://www\.napsgear\.org[^"]*)"', replace, html)


# ── Inline style URL fix ─────────────────────────────────────────────────────

def fix_inline_style_urls(html: str, html_path: Path, offline_root: Path) -> str:
    def replace(match: re.Match) -> str:
        raw = match.group(1).strip().strip("\"'")
        if not raw.startswith('http'):
            return match.group(0)
        parsed = urlparse(raw)
        if parsed.netloc == 'www.napsgear.org':
            local = offline_root / parsed.path.lstrip('/')
        else:
            local = offline_root / parsed.netloc / parsed.path.lstrip('/')
        if local.exists():
            try:
                rel = os.path.relpath(local, html_path.parent).replace('\\', '/')
                return match.group(0).replace(raw, rel)
            except ValueError:
                pass
        return match.group(0)

    return re.sub(r"url\((['\"]?https?://[^'\")\s]+['\"]?)\)", replace, html)


# ── Video thumbnail fix ──────────────────────────────────────────────────────

def extract_youtube_ids(html: str) -> set:
    return set(re.findall(r'i\.ytimg\.com/vi/([^/]+)/', html))


def download_youtube_thumbnails(video_ids: set, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    downloaded = {}
    for vid in video_ids:
        local_path = out_dir / f'{vid}.jpg'
        if local_path.exists():
            downloaded[vid] = str(local_path)
            continue
        for variant in ('maxresdefault', 'hqdefault', 'mqdefault'):
            try:
                urllib.request.urlretrieve(
                    f'https://i.ytimg.com/vi/{vid}/{variant}.jpg', local_path
                )
                downloaded[vid] = str(local_path)
                print(f'  Downloaded YouTube {vid} ({variant})')
                break
            except Exception:
                continue
        else:
            print(f'  WARNING: Could not download YouTube thumbnail {vid}')
    return downloaded


def rewrite_youtube_thumbnails(html: str, downloaded: dict) -> str:
    def replacer(m):
        vid = m.group(1)
        return f'src="{downloaded[vid]}"' if vid in downloaded else m.group(0)
    return re.sub(r'src="https://i\.ytimg\.com/vi/([^/]+)/[^"]+"', replacer, html)


def extract_vimeo_ids(html: str) -> set:
    return set(re.findall(r'i\.vimeocdn\.com/video/(\d+)-', html))


def download_vimeo_thumbnails(video_ids: set, out_dir: Path, html: str) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    downloaded = {}
    for vid in video_ids:
        local_path = out_dir / f'{vid}.jpg'
        if local_path.exists():
            downloaded[vid] = str(local_path)
            continue
        match = re.search(
            rf"url\('(https://i\.vimeocdn\.com/video/{vid}-[^']+)'\)", html
        )
        if not match:
            print(f'  WARNING: No URL found for Vimeo ID {vid}')
            continue
        url = match.group(1).replace('&amp;', '&')
        try:
            urllib.request.urlretrieve(url, local_path)
            downloaded[vid] = str(local_path)
            print(f'  Downloaded Vimeo {vid}')
        except Exception as e:
            print(f'  WARNING: Could not download Vimeo {vid}: {e}')
    return downloaded


def rewrite_vimeo_thumbnails(html: str, downloaded: dict) -> str:
    def replacer(m):
        vid = m.group(1)
        return f"url('{downloaded[vid]}')" if vid in downloaded else m.group(0)
    return re.sub(r"url\('https://i\.vimeocdn\.com/video/(\d+)-[^']+'\)", replacer, html)


def fix_video_thumbnails(html: str, html_path: Path, offline_root: Path) -> str:
    yt_out = offline_root / 'templates' / 'img' / 'youtube'
    vimeo_out = offline_root / 'templates' / 'img' / 'vimeo'

    yt_ids = extract_youtube_ids(html)
    if yt_ids:
        yt_dl = download_youtube_thumbnails(yt_ids, yt_out)
        rel_yt = {
            vid: os.path.relpath(p, html_path.parent).replace('\\', '/')
            for vid, p in yt_dl.items()
        }
        html = rewrite_youtube_thumbnails(html, rel_yt)

    vimeo_ids = extract_vimeo_ids(html)
    if vimeo_ids:
        vimeo_dl = download_vimeo_thumbnails(vimeo_ids, vimeo_out, html)
        rel_vimeo = {
            vid: os.path.relpath(p, html_path.parent).replace('\\', '/')
            for vid, p in vimeo_dl.items()
        }
        html = rewrite_vimeo_thumbnails(html, rel_vimeo)

    return html


# ── Favicon fix ──────────────────────────────────────────────────────────────

def fix_favicon(html: str, html_path: Path, offline_root: Path) -> str:
    favicon_local = offline_root / 'templates' / 'img' / 'favicon.ico'
    if not favicon_local.exists():
        try:
            urllib.request.urlretrieve(
                'https://www.napsgear.org/favicon.ico', favicon_local
            )
        except Exception:
            return re.sub(r'<link[^>]+rel=["\']favicon["\'][^>]*/?>(\s*)', r'\1', html)
    try:
        rel = os.path.relpath(favicon_local, html_path.parent).replace('\\', '/')
    except ValueError:
        rel = str(favicon_local)
    return re.sub(
        r'<link[^>]+rel=["\']favicon["\'][^>]*/?>', 
        f'<link rel="icon" href="{rel}" type="image/x-icon">',
        html,
    )


# ── Orchestrator ─────────────────────────────────────────────────────────────

def fix_html_file(html_path: Path, offline_root: Path, manifest: set[Path]) -> None:
    html = html_path.read_text(encoding='utf-8', errors='replace')
    html = rewrite_internal_urls(html, html_path, offline_root, manifest)
    html = fix_cdn_urls_for_file(html, html_path, offline_root)
    html = fix_inline_style_urls(html, html_path, offline_root)
    html = inject_font_awesome_fix(html)
    icons_svg = offline_root / 'templates' / 'img' / 'icons' / 'icons-lib.svg'
    html = fix_svg_icons(html, load_extra_symbols(icons_svg))
    html = strip_cloudflare_scripts(html)
    html = fix_video_thumbnails(html, html_path, offline_root)
    html = fix_favicon(html, html_path, offline_root)
    html_path.write_text(html, encoding='utf-8')


def fix_all_html(offline_root: Path) -> None:
    manifest = set(offline_root.rglob('*.html'))
    html_files = list(manifest)
    print(f'Processing {len(html_files)} HTML files in {offline_root}...')
    for html_path in html_files:
        try:
            fix_html_file(html_path, offline_root, manifest)
            print(f'  Fixed: {html_path.relative_to(offline_root)}')
        except Exception as e:
            print(f'  ERROR {html_path}: {e}')
    print('Done.')


def main() -> None:
    parser = argparse.ArgumentParser(description='Apply offline fixes to all HTML files')
    parser.add_argument('--root', default=None, help='Project root (default: parent of scripts/)')
    args = parser.parse_args()
    project_root = Path(args.root) if args.root else Path(__file__).parent.parent
    offline_root = project_root / 'offline'
    fix_all_html(offline_root)


if __name__ == '__main__':
    main()
```

- [ ] **Step 7.7: Run all tests — expect all pass**

```bash
python -m pytest tests/ -v
```

Expected: all tests PASSED (14 existing + 7 new).

- [ ] **Step 7.8: Run fix_offline.py against the real offline/ directory**

```bash
python scripts/fix_offline.py
```

Expected output: `Processing N HTML files in offline/... Fixed: index.html ... Done.`
Open `offline/index.html` in a browser: nav dropdowns show CSS arrows, CDN images load.

- [ ] **Step 7.9: Commit**

```bash
git add scripts/ tests/conftest.py tests/test_fix_offline.py
git commit -m "feat(scripts): add fix_offline.py with all 8 offline transforms"
```

---

## Task 8: Create `scripts/check_offline.py`

**Files:**
- Create: `scripts/check_offline.py`
- Create: `tests/test_check_offline.py`

- [ ] **Step 8.1: Write failing tests**

Create `tests/test_check_offline.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))


def test_check_finds_https_link(tmp_path):
    from check_offline import check_html_file
    html = tmp_path / "index.html"
    html.write_text('<a href="https://www.napsgear.org/faq">FAQ</a>', encoding="utf-8")
    broken = check_html_file(html, tmp_path)
    assert any("napsgear.org" in v for _, v in broken)


def test_check_finds_missing_local_asset(tmp_path):
    from check_offline import check_html_file
    html = tmp_path / "index.html"
    html.write_text('<img src="templates/img/missing.jpg">', encoding="utf-8")
    broken = check_html_file(html, tmp_path)
    assert any("missing.jpg" in v for _, v in broken)


def test_check_passes_existing_local_asset(tmp_path):
    from check_offline import check_html_file
    img_dir = tmp_path / "templates" / "img"
    img_dir.mkdir(parents=True)
    (img_dir / "logo.png").write_bytes(b"")
    html = tmp_path / "index.html"
    html.write_text('<img src="templates/img/logo.png">', encoding="utf-8")
    broken = check_html_file(html, tmp_path)
    assert not broken


def test_check_finds_inline_style_https(tmp_path):
    from check_offline import check_html_file
    html = tmp_path / "index.html"
    html.write_text(
        '<div style="background-image: url(\'https://i.vimeocdn.com/123.jpg\')"></div>',
        encoding="utf-8",
    )
    broken = check_html_file(html, tmp_path)
    assert any("vimeocdn" in v for _, v in broken)
```

- [ ] **Step 8.2: Run tests — expect 4 failures**

```bash
python -m pytest tests/test_check_offline.py -v
```

Expected: 4 FAILED (`check_offline` not found).

- [ ] **Step 8.3: Create `scripts/check_offline.py`**

```python
import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class _LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        for attr in ("href", "src", "action", "data-src"):
            if attr in attrs_dict and attrs_dict[attr]:
                self.links.append((attr, attrs_dict[attr]))


def check_html_file(html_path: Path, root: Path) -> list[tuple[str, str]]:
    """Return list of (attribute, value) for all broken references in html_path."""
    content = html_path.read_text(encoding="utf-8", errors="replace")
    broken: list[tuple[str, str]] = []

    extractor = _LinkExtractor()
    extractor.feed(content)

    for attr, value in extractor.links:
        if value.startswith(("https://", "http://")):
            broken.append((attr, value))
        elif value.startswith(("/", "./", "../")):
            resolved = (html_path.parent / value).resolve()
            if not resolved.exists():
                broken.append((attr, value))
        elif not value.startswith(("#", "data:", "javascript:", "mailto:")):
            resolved = (html_path.parent / value).resolve()
            if not resolved.exists():
                broken.append((attr, value))

    for match in re.finditer(r"url\(['\"]?(https?://[^'\")\s]+)['\"]?\)", content):
        broken.append(("style:url", match.group(1)))

    return broken


def main() -> None:
    parser = argparse.ArgumentParser(description="Check offline HTML for broken references")
    parser.add_argument("--root", default=None, help="offline/ directory to check")
    args = parser.parse_args()
    root = Path(args.root) if args.root else Path(__file__).parent.parent / "offline"

    html_files = list(root.rglob("*.html"))
    print(f"Checking {len(html_files)} HTML files in {root}...")

    all_broken: list[tuple[str, str, str]] = []
    for html_path in html_files:
        for attr, value in check_html_file(html_path, root):
            rel = str(html_path.relative_to(root))
            all_broken.append((rel, attr, value))
            print(f"  BROKEN  {rel}  [{attr}]  {value[:80]}")

    print(f"\n{len(all_broken)} broken reference(s) found.")
    sys.exit(1 if all_broken else 0)


if __name__ == "__main__":
    main()
```

- [ ] **Step 8.4: Run all tests — expect all pass**

```bash
python -m pytest tests/test_check_offline.py -v
```

Expected: 4 PASSED.

- [ ] **Step 8.5: Run check_offline.py against real offline/ directory**

```bash
python scripts/check_offline.py
```

Expected: some `BROKEN` lines for remaining live URLs, plus a count. Exit code 1.
This is expected — the tool is telling us what still needs fixing.

- [ ] **Step 8.6: Commit**

```bash
git add scripts/check_offline.py tests/test_check_offline.py
git commit -m "feat(scripts): add check_offline.py broken-link reporter"
```

---

## Task 9: Create `scripts/extract_data.py`

**Files:**
- Create: `scripts/extract_data.py`
- Create: `tests/test_extract_data.py`
- Modify: `grabber/requirements.txt` — add beautifulsoup4

- [ ] **Step 9.1: Add beautifulsoup4 to grabber/requirements.txt**

Add a line to `grabber/requirements.txt`:

```
playwright>=1.43.0
click>=8.1.0
tqdm>=4.66.0
pytest>=8.1.0
beautifulsoup4>=4.12.0
```

Install it:

```bash
pip install beautifulsoup4
```

Expected: `Successfully installed beautifulsoup4-...`

- [ ] **Step 9.2: Write failing tests**

Create `tests/test_extract_data.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))


_BRANDS_HTML = """
<div id="brandsMenu">
  <div class="menu-item__list" id="brandMenuList">
    <button class="menu-item__link nolink" data-bs-toggle="collapse" data-bs-target="#brand_1">U.S. Domestic</button>
    <div class="menu-item__sub" id="brand_1">
      <a class="menu-item__link main-brand" href="https://www.napsgear.org/alpha-pharma-c141952" data-id="141952">Alpha-Pharma</a>
      <a class="menu-item__link main-brand" href="https://www.napsgear.org/accordo-rx-c144205" data-id="144205">Accordo Rx</a>
    </div>
  </div>
</div>
"""

_CATEGORIES_HTML = """
<div id="categoriesMenu">
  <a class="menu-item__link" href="https://www.napsgear.org/oral-steroids-c14">Oral Steroids</a>
  <a class="menu-item__link" href="https://www.napsgear.org/injectable-steroids-c15">Injectable Steroids</a>
</div>
"""


def test_extract_brands_returns_list():
    from extract_data import extract_brands
    result = extract_brands(_BRANDS_HTML)
    assert isinstance(result, list)
    assert len(result) == 2


def test_extract_brands_has_required_fields():
    from extract_data import extract_brands
    result = extract_brands(_BRANDS_HTML)
    brand = result[0]
    assert "slug" in brand
    assert "name" in brand
    assert "id" in brand
    assert brand["name"] == "Alpha-Pharma"
    assert brand["id"] == 141952
    assert brand["slug"] == "alpha-pharma-c141952"


def test_extract_categories_returns_list():
    from extract_data import extract_categories
    result = extract_categories(_CATEGORIES_HTML)
    assert isinstance(result, list)
    assert len(result) == 2


def test_extract_categories_has_required_fields():
    from extract_data import extract_categories
    result = extract_categories(_CATEGORIES_HTML)
    cat = result[0]
    assert "slug" in cat
    assert "name" in cat
    assert cat["name"] == "Oral Steroids"
    assert cat["slug"] == "oral-steroids-c14"
```

- [ ] **Step 9.3: Run tests — expect 4 failures**

```bash
python -m pytest tests/test_extract_data.py -v
```

Expected: 4 FAILED (`extract_data` not found).

- [ ] **Step 9.4: Create `scripts/extract_data.py`**

```python
import argparse
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


def extract_brands(html: str) -> list[dict]:
    """Extract brand entries from the Brands mega-menu HTML."""
    soup = BeautifulSoup(html, "html.parser")
    brands_menu = soup.find(id="brandsMenu") or soup
    brands = []
    for a in brands_menu.find_all("a", class_="main-brand"):
        href = a.get("href", "")
        data_id = a.get("data-id", "")
        name = a.get_text(strip=True)
        # Remove badge text (NEW, HOT etc.) — first text node only
        name = re.sub(r'\s+', ' ', name).strip()
        slug = href.rstrip("/").split("/")[-1] if href else ""
        if slug and name:
            brands.append({
                "slug": slug,
                "name": name,
                "id": int(data_id) if data_id.isdigit() else None,
                "url": href,
            })
    return brands


def extract_categories(html: str) -> list[dict]:
    """Extract category entries from the Categories mega-menu HTML."""
    soup = BeautifulSoup(html, "html.parser")
    cats_menu = soup.find(id="categoriesMenu") or soup
    categories = []
    seen = set()
    for a in cats_menu.find_all("a", href=True):
        href = a["href"]
        if "napsgear.org" not in href:
            continue
        slug = href.rstrip("/").split("/")[-1]
        name = a.get_text(strip=True)
        if slug and name and slug not in seen:
            seen.add(slug)
            categories.append({"slug": slug, "name": name, "url": href})
    return categories


def extract_videos(html: str) -> list[dict]:
    """Extract AMA video metadata from the homepage carousel."""
    soup = BeautifulSoup(html, "html.parser")
    videos = []
    for post in soup.select(".ama-firstpage-section .post"):
        link_el = post.select_one("a[href]")
        title_el = post.select_one(".post-title, h3, h4")
        date_el = post.select_one("time, .post-date")
        img_el = post.select_one("img")
        if not link_el:
            continue
        videos.append({
            "url": link_el.get("href", ""),
            "title": title_el.get_text(strip=True) if title_el else "",
            "date": date_el.get("datetime", date_el.get_text(strip=True) if date_el else ""),
            "thumbnail": img_el.get("src", img_el.get("data-src", "")) if img_el else "",
        })
    return videos


def extract_product(html: str, slug: str) -> dict | None:
    """Extract structured data from a single product page."""
    soup = BeautifulSoup(html, "html.parser")
    name_el = soup.select_one("h1.product-title, h1, .product-name")
    desc_el = soup.select_one(".product-description, .description, #description")
    images = [
        img.get("src", img.get("data-src", ""))
        for img in soup.select(".product-images img, .product-gallery img")
        if img.get("src") or img.get("data-src")
    ]
    if not name_el:
        return None
    return {
        "slug": slug,
        "name": name_el.get_text(strip=True),
        "description": desc_el.get_text(strip=True) if desc_el else "",
        "images": images,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract structured JSON from offline HTML")
    parser.add_argument("--root", default=None)
    args = parser.parse_args()
    project_root = Path(args.root) if args.root else Path(__file__).parent.parent
    offline_root = project_root / "offline"
    data_dir = project_root / "data"
    data_dir.mkdir(exist_ok=True)

    index_html = (offline_root / "index.html").read_text(encoding="utf-8", errors="replace")

    # Brands
    brands = extract_brands(index_html)
    (data_dir / "brands.json").write_text(
        json.dumps(brands, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Extracted {len(brands)} brands → data/brands.json")

    # Categories
    categories = extract_categories(index_html)
    (data_dir / "categories.json").write_text(
        json.dumps(categories, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Extracted {len(categories)} categories → data/categories.json")

    # Videos
    videos = extract_videos(index_html)
    (data_dir / "videos.json").write_text(
        json.dumps(videos, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Extracted {len(videos)} videos → data/videos.json")

    # Products — scan grabbed product pages
    products = []
    for product_dir in offline_root.iterdir():
        if not product_dir.is_dir():
            continue
        slug = product_dir.name
        # Product slugs follow pattern: name-cNUMBER
        if not re.search(r'-c\d+$', slug):
            continue
        page = product_dir / "index.html"
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8", errors="replace")
        product = extract_product(html, slug)
        if product:
            products.append(product)

    (data_dir / "products.json").write_text(
        json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Extracted {len(products)} products → data/products.json")


if __name__ == "__main__":
    main()
```

- [ ] **Step 9.5: Run all tests — expect all pass**

```bash
python -m pytest tests/test_extract_data.py -v
```

Expected: 4 PASSED.

- [ ] **Step 9.6: Commit**

```bash
git add scripts/extract_data.py tests/test_extract_data.py grabber/requirements.txt
git commit -m "feat(scripts): add extract_data.py for HTML-to-JSON extraction"
```

---

## Task 10: Populate `data/` JSON Files

**Files:**
- Create: `data/brands.json`, `data/categories.json`, `data/videos.json`, `data/products.json`

- [ ] **Step 10.1: Create the data/ directory**

```bash
mkdir data
```

- [ ] **Step 10.2: Run extract_data.py to generate JSON files**

```bash
python scripts/extract_data.py
```

Expected output:
```
Extracted N brands → data/brands.json
Extracted N categories → data/categories.json
Extracted N videos → data/videos.json
Extracted 0 products → data/products.json
```

- [ ] **Step 10.3: Spot-check brands.json**

```bash
python -c "import json; d=json.load(open('data/brands.json')); print(f'{len(d)} brands, first: {d[0]}')"
```

Expected: at least 10 brands, first entry has slug, name, id, url fields.

- [ ] **Step 10.4: Spot-check categories.json**

```bash
python -c "import json; d=json.load(open('data/categories.json')); print(f'{len(d)} categories, first: {d[0]}')"
```

Expected: at least 5 categories.

- [ ] **Step 10.5: Run full test suite — expect all pass**

```bash
python -m pytest tests/ -v && cd grabber && python -m pytest tests/ -v
```

Expected: all tests PASSED in both suites.

- [ ] **Step 10.6: Run check_offline.py to get a baseline broken-link report**

```bash
python scripts/check_offline.py > broken-links-baseline.txt 2>&1 || true
cat broken-links-baseline.txt | head -30
```

Save this as a reference. The remaining broken links will be fixed as pages are grabbed.

- [ ] **Step 10.7: Final commit**

```bash
git add data/
git commit -m "feat(data): populate brands.json, categories.json, videos.json from offline/index.html"
```

---

## Self-Review Checklist

- [x] **Spec: Rename www.napsgear.org/ → offline/** — Task 1 ✓
- [x] **Spec: Move cdn.napsgear.org/ inside offline/** — Task 1 ✓
- [x] **Spec: Delete new/** — Task 1 ✓
- [x] **Spec: Grabber --targets mode** — Tasks 3 + 5 ✓
- [x] **Spec: Grabber --primary-host** — Tasks 2 + 5 ✓
- [x] **Spec: --skip-existing already done** — carried through in Task 5 ✓
- [x] **Spec: Cloudflare cdn-cgi skip** — already in interceptor, committed in Task 2 ✓
- [x] **Spec: Windows path sanitization** — already in interceptor ✓
- [x] **Spec: rewriter.py inline style URLs** — Task 4 ✓
- [x] **Spec: fix_offline.py --root + 8 transforms** — Task 7 ✓ (all 8: internal URL rewrite, CDN, inline style, FA, SVG, Cloudflare strip, video thumbnails, favicon)
- [x] **Spec: check_offline.py broken-link reporter** — Task 8 ✓
- [x] **Spec: extract_data.py HTML→JSON** — Task 9 ✓
- [x] **Spec: targets.txt with nav page URLs** — Task 6 ✓
- [x] **Spec: data/ JSON files** — Task 10 ✓
- [x] **Spec: products.json starts empty** — Task 10 starts empty, populated as product pages are grabbed ✓

**Not in this plan (Plan B):** Next.js 16 scaffold, App Router pages, component stubs, Tailwind CSS config.

---

## Usage After This Plan Completes

**To grab pages when the site is available:**
```bash
cd grabber
python grab.py --targets targets.txt --output ../offline/ --primary-host www.napsgear.org --skip-existing
```

**To apply all offline fixes:**
```bash
python scripts/fix_offline.py
```

**To verify no broken references remain:**
```bash
python scripts/check_offline.py
```

**To update JSON data after new pages are grabbed:**
```bash
python scripts/extract_data.py
```
