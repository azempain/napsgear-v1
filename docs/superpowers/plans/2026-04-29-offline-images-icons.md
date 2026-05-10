# NapsGear Offline — Images, Icons & YouTube Thumbnails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `www.napsgear.org/index.html` display all product images, SVG icons, and video thumbnails correctly when opened from the local filesystem with no internet connection.

**Architecture:** A single Python module `fix_offline.py` at the project root holds three pure text-transform functions (testable, no I/O) plus a download helper and a `main()` that applies all fixes to `index.html` in sequence. Task 1 rewrites CDN image URLs from absolute to relative. Task 2 fixes SVG `<use>` references to resolve against the inline symbol block already in the HTML. Task 3 downloads YouTube thumbnails locally and rewrites their src attributes.

**Tech Stack:** Python 3, pytest, `urllib.request` (stdlib), `re`, `pathlib` — no new dependencies.

---

### Task 1: CDN URL Rewrite

**Files:**
- Create: `tests/test_fix_offline.py`
- Create: `fix_offline.py`

- [ ] **Step 1: Create tests directory and write failing tests**

```bash
mkdir -p c:/Users/azemc/OneDrive/Documents/Github/napsgear/tests
```

Create `tests/test_fix_offline.py`:

```python
def test_fix_cdn_urls_https():
    from fix_offline import fix_cdn_urls
    html = '<img src="https://cdn.napsgear.org/files/images/product.jpg">'
    assert fix_cdn_urls(html) == '<img src="../cdn.napsgear.org/files/images/product.jpg">'

def test_fix_cdn_urls_http():
    from fix_offline import fix_cdn_urls
    html = '<img src="http://cdn.napsgear.org/files/images/product.jpg">'
    assert fix_cdn_urls(html) == '<img src="../cdn.napsgear.org/files/images/product.jpg">'

def test_fix_cdn_urls_protocol_relative():
    from fix_offline import fix_cdn_urls
    html = '<img src="//cdn.napsgear.org/files/images/product.jpg">'
    assert fix_cdn_urls(html) == '<img src="../cdn.napsgear.org/files/images/product.jpg">'

def test_fix_cdn_urls_no_match():
    from fix_offline import fix_cdn_urls
    html = '<img src="templates/css/main.css">'
    assert fix_cdn_urls(html) == '<img src="templates/css/main.css">'
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
python -m pytest tests/test_fix_offline.py -v
```

Expected: `ModuleNotFoundError: No module named 'fix_offline'`

- [ ] **Step 3: Implement fix_cdn_urls**

Create `fix_offline.py`:

```python
import re
import urllib.request
from pathlib import Path


def fix_cdn_urls(html: str) -> str:
    """Rewrite absolute cdn.napsgear.org URLs to relative ../cdn.napsgear.org/ paths."""
    html = re.sub(r'https?://cdn\.napsgear\.org/', '../cdn.napsgear.org/', html)
    html = re.sub(r'//cdn\.napsgear\.org/', '../cdn.napsgear.org/', html)
    return html
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
python -m pytest tests/test_fix_offline.py -v
```

Expected: 4 PASSED

- [ ] **Step 5: Commit**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
git add fix_offline.py tests/test_fix_offline.py
git commit -m "feat: add fix_cdn_urls with tests"
```

---

### Task 2: SVG Icon Reference Repair

**Files:**
- Modify: `fix_offline.py`
- Modify: `tests/test_fix_offline.py`

The HTML already contains all icon symbols as `<symbol>` elements in an inline `<svg style="display:none">` block. The □ rendering happens because some `<use>` elements reference the external file `templates/img/icons/icons-lib.svg#icon-name` — browsers block cross-document SVG `<use>` on `file://`. The fix rewrites those references to `#icon-name` (same document). Additionally, any symbols in `icons-lib.svg` not already inline are appended to the inline block.

- [ ] **Step 1: Add failing tests**

Append to `tests/test_fix_offline.py`:

```python
def test_fix_svg_icons_href():
    from fix_offline import fix_svg_icons
    html = '<use href="templates/img/icons/icons-lib.svg#icon-chevron-down"/>'
    assert fix_svg_icons(html, extra_symbols='') == '<use href="#icon-chevron-down"/>'

def test_fix_svg_icons_xlink_href():
    from fix_offline import fix_svg_icons
    html = '<use xlink:href="templates/img/icons/icons-lib.svg#icon-cart"/>'
    assert fix_svg_icons(html, extra_symbols='') == '<use xlink:href="#icon-cart"/>'

def test_fix_svg_icons_injects_extra_symbols():
    from fix_offline import fix_svg_icons
    html = '<svg style="display:none"><symbol id="icon-bars"></symbol></svg>'
    extra = '<symbol id="icon-star"><path d="M12 2l3 7h7l-5 4 2 7-7-4-7 4 2-7-5-4h7z"/></symbol>'
    result = fix_svg_icons(html, extra_symbols=extra)
    assert 'id="icon-star"' in result
    assert result.index('id="icon-star"') < result.index('</svg>')

def test_fix_svg_icons_no_duplicate_symbols():
    from fix_offline import fix_svg_icons
    html = '<svg style="display:none"><symbol id="icon-bars"></symbol></svg>'
    extra = '<symbol id="icon-bars"><path d="M4 6l16 0"/></symbol>'
    result = fix_svg_icons(html, extra_symbols=extra)
    assert result.count('id="icon-bars"') == 1
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
python -m pytest tests/test_fix_offline.py::test_fix_svg_icons_href tests/test_fix_offline.py::test_fix_svg_icons_xlink_href tests/test_fix_offline.py::test_fix_svg_icons_injects_extra_symbols tests/test_fix_offline.py::test_fix_svg_icons_no_duplicate_symbols -v
```

Expected: `AttributeError: module 'fix_offline' has no attribute 'fix_svg_icons'`

- [ ] **Step 3: Implement fix_svg_icons**

Append to `fix_offline.py`:

```python
def fix_svg_icons(html: str, extra_symbols: str) -> str:
    """
    1. Rewrite <use href="icons-lib.svg#..."> to <use href="#...">
    2. Inject extra_symbols (not already present) before </svg> of the inline block.
    """
    html = re.sub(
        r'(href=")templates/img/icons/icons-lib\.svg#',
        r'\1#',
        html,
    )
    html = re.sub(
        r'(xlink:href=")templates/img/icons/icons-lib\.svg#',
        r'\1#',
        html,
    )
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
python -m pytest tests/test_fix_offline.py -v
```

Expected: 8 PASSED

- [ ] **Step 5: Commit**

```bash
git add fix_offline.py tests/test_fix_offline.py
git commit -m "feat: add fix_svg_icons with tests"
```

---

### Task 3: YouTube Thumbnail Download & Rewrite

**Files:**
- Modify: `fix_offline.py`
- Modify: `tests/test_fix_offline.py`

- [ ] **Step 1: Add failing tests**

Append to `tests/test_fix_offline.py`:

```python
def test_extract_youtube_ids():
    from fix_offline import extract_youtube_ids
    html = '''
        <img src="https://i.ytimg.com/vi/abc123/hqdefault.jpg">
        <img src="https://i.ytimg.com/vi/def456/maxresdefault.jpg">
        <img src="https://i.ytimg.com/vi/abc123/mqdefault.jpg">
    '''
    assert extract_youtube_ids(html) == {'abc123', 'def456'}

def test_rewrite_youtube_thumbnails():
    from fix_offline import rewrite_youtube_thumbnails
    html = '<img src="https://i.ytimg.com/vi/abc123/hqdefault.jpg">'
    result = rewrite_youtube_thumbnails(html, {'abc123': 'templates/img/youtube/abc123.jpg'})
    assert result == '<img src="templates/img/youtube/abc123.jpg">'

def test_rewrite_youtube_thumbnails_all_variants():
    from fix_offline import rewrite_youtube_thumbnails
    html = (
        '<img src="https://i.ytimg.com/vi/abc123/maxresdefault.jpg">'
        '<img src="https://i.ytimg.com/vi/abc123/mqdefault.jpg">'
    )
    result = rewrite_youtube_thumbnails(html, {'abc123': 'templates/img/youtube/abc123.jpg'})
    assert result.count('templates/img/youtube/abc123.jpg') == 2
    assert 'i.ytimg.com' not in result

def test_rewrite_youtube_thumbnails_skips_missing():
    from fix_offline import rewrite_youtube_thumbnails
    html = '<img src="https://i.ytimg.com/vi/xyz999/hqdefault.jpg">'
    result = rewrite_youtube_thumbnails(html, {})
    assert 'i.ytimg.com/vi/xyz999' in result
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
python -m pytest tests/test_fix_offline.py::test_extract_youtube_ids tests/test_fix_offline.py::test_rewrite_youtube_thumbnails tests/test_fix_offline.py::test_rewrite_youtube_thumbnails_all_variants tests/test_fix_offline.py::test_rewrite_youtube_thumbnails_skips_missing -v
```

Expected: `AttributeError: module 'fix_offline' has no attribute 'extract_youtube_ids'`

- [ ] **Step 3: Implement YouTube functions**

Append to `fix_offline.py`:

```python
def extract_youtube_ids(html: str) -> set:
    """Return the set of YouTube video IDs found in i.ytimg.com URLs."""
    return set(re.findall(r'i\.ytimg\.com/vi/([^/]+)/', html))


def rewrite_youtube_thumbnails(html: str, downloaded: dict) -> str:
    """Replace ytimg src URLs with local paths. downloaded: {video_id: local_path}"""
    def replacer(m):
        vid = m.group(1)
        if vid in downloaded:
            return f'src="{downloaded[vid]}"'
        return m.group(0)
    return re.sub(
        r'src="https://i\.ytimg\.com/vi/([^/]+)/[^"]+"',
        replacer,
        html,
    )


def download_youtube_thumbnails(video_ids: set, out_dir: Path) -> dict:
    """
    Download thumbnails for each video ID. Tries maxresdefault then hqdefault then mqdefault.
    Returns {video_id: local_absolute_path} for each successfully downloaded ID.
    Skips IDs whose file already exists locally.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    downloaded = {}
    for vid in video_ids:
        local_path = out_dir / f'{vid}.jpg'
        if local_path.exists():
            downloaded[vid] = str(local_path)
            continue
        for variant in ('maxresdefault', 'hqdefault', 'mqdefault'):
            url = f'https://i.ytimg.com/vi/{vid}/{variant}.jpg'
            try:
                urllib.request.urlretrieve(url, local_path)
                downloaded[vid] = str(local_path)
                print(f'  Downloaded {vid} ({variant})')
                break
            except Exception:
                continue
        else:
            print(f'  WARNING: Could not download thumbnail for {vid}')
    return downloaded
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
python -m pytest tests/test_fix_offline.py -v
```

Expected: 12 PASSED

- [ ] **Step 5: Commit**

```bash
git add fix_offline.py tests/test_fix_offline.py
git commit -m "feat: add YouTube thumbnail extract/download/rewrite with tests"
```

---

### Task 4: Wire Up main() and Apply All Fixes

**Files:**
- Modify: `fix_offline.py`

- [ ] **Step 1: Implement load_extra_symbols and main()**

Append to `fix_offline.py`:

```python
def load_extra_symbols(svg_path: Path) -> str:
    """Read all <symbol> elements from an SVG file as a raw string."""
    try:
        content = svg_path.read_text(encoding='utf-8')
        return '\n'.join(re.findall(r'<symbol[^>]*>.*?</symbol>', content, re.DOTALL))
    except FileNotFoundError:
        return ''


def main():
    root = Path(__file__).parent
    html_path = root / 'www.napsgear.org' / 'index.html'
    icons_svg = root / 'www.napsgear.org' / 'templates' / 'img' / 'icons' / 'icons-lib.svg'
    yt_out_dir = root / 'www.napsgear.org' / 'templates' / 'img' / 'youtube'

    print('Reading index.html...')
    html = html_path.read_text(encoding='utf-8')

    print('Fix 1: Rewriting CDN URLs...')
    html = fix_cdn_urls(html)

    print('Fix 2: Repairing SVG icon references...')
    html = fix_svg_icons(html, load_extra_symbols(icons_svg))

    print('Fix 3: Downloading and rewriting YouTube thumbnails...')
    video_ids = extract_youtube_ids(html)
    print(f'  Found {len(video_ids)} unique video IDs')
    downloaded_ids = download_youtube_thumbnails(video_ids, yt_out_dir)
    rel_downloaded = {vid: f'templates/img/youtube/{vid}.jpg' for vid in downloaded_ids}
    html = rewrite_youtube_thumbnails(html, rel_downloaded)

    print('Writing patched index.html...')
    html_path.write_text(html, encoding='utf-8')
    print('Done.')


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run the script (requires internet for YouTube thumbnails)**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
python fix_offline.py
```

Expected output (exact video IDs will vary):
```
Reading index.html...
Fix 1: Rewriting CDN URLs...
Fix 2: Repairing SVG icon references...
Fix 3: Downloading and rewriting YouTube thumbnails...
  Found N unique video IDs
  Downloaded <id> (hqdefault)
  ...
Writing patched index.html...
Done.
```

- [ ] **Step 3: Verify CDN URL fix**

```bash
python -c "
import re
html = open('www.napsgear.org/index.html', encoding='utf-8').read()
abs_count = len(re.findall(r'https?://cdn\.napsgear\.org/', html))
rel_count = len(re.findall(r'\.\./cdn\.napsgear\.org/', html))
print('Absolute CDN refs remaining:', abs_count)
print('Relative CDN refs:', rel_count)
"
```

Expected: `Absolute CDN refs remaining: 0`, `Relative CDN refs: N` (positive number)

- [ ] **Step 4: Verify SVG icon fix**

```bash
python -c "
import re
html = open('www.napsgear.org/index.html', encoding='utf-8').read()
ext = len(re.findall(r'icons-lib\.svg#', html))
print('External SVG icon refs remaining:', ext)
"
```

Expected: `External SVG icon refs remaining: 0`

- [ ] **Step 5: Verify YouTube thumbnail fix**

```bash
python -c "
import re
html = open('www.napsgear.org/index.html', encoding='utf-8').read()
yt = len(re.findall(r'i\.ytimg\.com', html))
local = len(re.findall(r'templates/img/youtube/', html))
print('ytimg refs remaining:', yt)
print('Local thumbnail refs:', local)
"
```

Expected: `ytimg refs remaining: 0`, `Local thumbnail refs: N` (positive number)

- [ ] **Step 6: Verify thumbnail files on disk**

```bash
ls www.napsgear.org/templates/img/youtube/
```

Expected: one `.jpg` file per video ID found in the HTML

- [ ] **Step 7: Commit**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
git add fix_offline.py www.napsgear.org/index.html
git add www.napsgear.org/templates/img/youtube/
git commit -m "fix: apply all offline fixes — CDN URLs, SVG icons, YouTube thumbnails"
```

---

### Task 5: Final Offline Verification

**Files:** None modified.

- [ ] **Step 1: Run full test suite**

```bash
cd c:/Users/azemc/OneDrive/Documents/Github/napsgear
python -m pytest tests/test_fix_offline.py -v
```

Expected: 12 PASSED, 0 failed

- [ ] **Step 2: Open site offline and visually verify**

Open `www.napsgear.org/index.html` in a browser with DevTools Network set to "Offline" (or physically disconnect). Check each of these:

- [ ] Product-of-the-week carousel shows a product image (no white box)
- [ ] Nav dropdown arrows render as chevron shapes (not □)
- [ ] Customer images section shows gear photos
- [ ] Q&A video series section shows video thumbnail images
- [ ] No console 404 errors for cdn.napsgear.org or i.ytimg.com resources

- [ ] **Step 3: (If any resources still broken) Identify remaining absolute URLs**

```bash
python -c "
import re
html = open('www.napsgear.org/index.html', encoding='utf-8').read()
for pattern in ['https://cdn', 'http://cdn', '//cdn.napsgear', 'i.ytimg.com', 'icons-lib.svg#']:
    count = len(re.findall(re.escape(pattern), html))
    if count:
        print(f'{pattern!r}: {count} remaining')
print('Scan complete.')
"
```

Expected: only `Scan complete.` with no patterns listed before it.
