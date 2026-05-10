# NapsGear Offline Mirror Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the HTTrack mirror of napsgear.org fully functional and visually correct when opened from the local filesystem with no internet connection.

**Architecture:** Download 13 template assets (CSS, JS, SVG, images) from the live site into `www.napsgear.org/templates/`, then rewrite all 30+ absolute `https://www.napsgear.org/templates/...` references in `index.html` to relative paths. Remove the Matomo tracker. Grep JS bundles for any further absolute URLs and patch if found.

**Tech Stack:** curl (asset download), bash sed/python (URL rewriting), plain HTML/CSS/JS (no build step)

---

### Task 1: Create local template directory structure

**Files:**
- Create dirs: `www.napsgear.org/templates/css/`, `www.napsgear.org/templates/js/vendors/jquery/`, `www.napsgear.org/templates/img/icons/`, `www.napsgear.org/templates/img/banners/homepage/top-weight-loss/`

- [ ] **Step 1: Create all required directories**

```bash
mkdir -p "www.napsgear.org/templates/css"
mkdir -p "www.napsgear.org/templates/js/vendors/jquery"
mkdir -p "www.napsgear.org/templates/img/icons"
mkdir -p "www.napsgear.org/templates/img/banners/homepage/top-weight-loss"
```
Run from: `c:/Users/azemc/OneDrive/Documents/Github/napsgear`

- [ ] **Step 2: Verify directories exist**

```bash
ls www.napsgear.org/templates/css www.napsgear.org/templates/js/vendors/jquery www.napsgear.org/templates/img/icons www.napsgear.org/templates/img/banners/homepage/top-weight-loss
```
Expected: no errors, directories listed

- [ ] **Step 3: Commit**

```bash
git add www.napsgear.org/templates/
git commit -m "chore: scaffold templates directory structure for offline assets"
```

---

### Task 2: Download CSS files

**Files:**
- Create: `www.napsgear.org/templates/css/swiper.14bf534d.css`
- Create: `www.napsgear.org/templates/css/vendors.890e34f1.css`
- Create: `www.napsgear.org/templates/css/main.68a342d0.css`

- [ ] **Step 1: Download all three CSS files**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/css"
curl -L -o swiper.14bf534d.css "https://www.napsgear.org/templates/css/swiper.14bf534d.css"
curl -L -o vendors.890e34f1.css "https://www.napsgear.org/templates/css/vendors.890e34f1.css"
curl -L -o main.68a342d0.css "https://www.napsgear.org/templates/css/main.68a342d0.css"
```

- [ ] **Step 2: Verify files are non-empty**

```bash
wc -c swiper.14bf534d.css vendors.890e34f1.css main.68a342d0.css
```
Expected: all three files have size > 1000 bytes

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/templates/css/
git commit -m "feat: download template CSS files for offline use"
```

---

### Task 3: Download JS files

**Files:**
- Create: `www.napsgear.org/templates/js/vendors/jquery/jquery.min.js`
- Create: `www.napsgear.org/templates/js/runtime.1d7d4f4c.js`
- Create: `www.napsgear.org/templates/js/bootstrap.a5c01dae.js`
- Create: `www.napsgear.org/templates/js/swiper.66c68bb9.js`
- Create: `www.napsgear.org/templates/js/dayjs.ffe16fd0.js`
- Create: `www.napsgear.org/templates/js/vendors.dbb1a691.js`
- Create: `www.napsgear.org/templates/js/main.7936197f.js`

- [ ] **Step 1: Download jQuery**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/vendors/jquery"
curl -L -o jquery.min.js "https://www.napsgear.org/templates/js/vendors/jquery/jquery.min.js"
```

- [ ] **Step 2: Verify jQuery downloaded**

```bash
wc -c jquery.min.js
```
Expected: > 50000 bytes

- [ ] **Step 3: Download remaining JS bundles**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js"
curl -L -o runtime.1d7d4f4c.js "https://www.napsgear.org/templates/js/runtime.1d7d4f4c.js"
curl -L -o bootstrap.a5c01dae.js "https://www.napsgear.org/templates/js/bootstrap.a5c01dae.js"
curl -L -o swiper.66c68bb9.js "https://www.napsgear.org/templates/js/swiper.66c68bb9.js"
curl -L -o dayjs.ffe16fd0.js "https://www.napsgear.org/templates/js/dayjs.ffe16fd0.js"
curl -L -o vendors.dbb1a691.js "https://www.napsgear.org/templates/js/vendors.dbb1a691.js"
curl -L -o main.7936197f.js "https://www.napsgear.org/templates/js/main.7936197f.js"
```

- [ ] **Step 4: Verify all JS bundles are non-empty**

```bash
wc -c runtime.1d7d4f4c.js bootstrap.a5c01dae.js swiper.66c68bb9.js dayjs.ffe16fd0.js vendors.dbb1a691.js main.7936197f.js
```
Expected: all files > 1000 bytes

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/templates/js/
git commit -m "feat: download template JS files for offline use"
```

---

### Task 4: Download SVG icon library and banner images

**Files:**
- Create: `www.napsgear.org/templates/img/icons/icons-lib.svg`
- Create: `www.napsgear.org/templates/img/banners/homepage/banner-ama.jpg`
- Create: `www.napsgear.org/templates/img/banners/homepage/top-weight-loss/top-weight-loss.jpg`

- [ ] **Step 1: Download SVG icon library**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/icons"
curl -L -o icons-lib.svg "https://www.napsgear.org/templates/img/icons/icons-lib.svg"
```

- [ ] **Step 2: Verify SVG downloaded and is valid XML**

```bash
wc -c icons-lib.svg
head -c 200 icons-lib.svg
```
Expected: size > 5000 bytes, content starts with `<svg` or `<?xml`

- [ ] **Step 3: Download banner images**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/banners/homepage"
curl -L -o banner-ama.jpg "https://www.napsgear.org/templates/img/banners/homepage/banner-ama.jpg?v=05"
cd top-weight-loss
curl -L -o top-weight-loss.jpg "https://www.napsgear.org/templates/img/banners/homepage/top-weight-loss/top-weight-loss.jpg"
```

- [ ] **Step 4: Verify images are valid JPEGs**

```bash
file "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/banners/homepage/banner-ama.jpg"
file "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/banners/homepage/top-weight-loss/top-weight-loss.jpg"
```
Expected: both reported as `JPEG image data`

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/templates/img/
git commit -m "feat: download template images and SVG icon library for offline use"
```

---

### Task 5: Rewrite absolute template URLs to relative in index.html

**Files:**
- Modify: `www.napsgear.org/index.html`

- [ ] **Step 1: Count all absolute template references (baseline)**

```bash
grep -c "https://www.napsgear.org/templates/" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html"
```
Note the count — we'll verify this drops to 0 after the rewrite.

- [ ] **Step 2: Rewrite all absolute template URLs to relative**

```bash
python3 -c "
import re, sys
path = 'c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('https://www.napsgear.org/templates/', 'templates/')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
"
```

- [ ] **Step 3: Verify zero remaining absolute template references**

```bash
grep -c "https://www.napsgear.org/templates/" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html"
```
Expected: `0` (grep exits with code 1 and prints 0, or reports no matches)

- [ ] **Step 4: Spot-check a few rewritten references look correct**

```bash
grep -n "templates/" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html" | head -10
```
Expected: lines like `<link rel="stylesheet" href="templates/css/swiper.14bf534d.css">` with no `https://` prefix

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/index.html
git commit -m "fix: rewrite absolute template URLs to relative for offline use"
```

---

### Task 6: Remove Matomo tracker from index.html

**Files:**
- Modify: `www.napsgear.org/index.html`

- [ ] **Step 1: Locate Matomo block in the file**

```bash
grep -n "Matomo" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html"
```
Expected: two lines — one for the `<script>` block and one for the `<noscript>` pixel (around line 2111-2112)

- [ ] **Step 2: Remove Matomo tracker script and noscript pixel**

Open `www.napsgear.org/index.html` and delete the two lines that contain `<!-- Matomo -->` and `<noscript><!-- Matomo Image Tracker-->`. The lines look like:

```html
<!-- Matomo --> <script>   var _paq = window._paq = window._paq || [];  ... </script> <!-- End Matomo Code -->
<noscript><!-- Matomo Image Tracker--> <img referrerpolicy="no-referrer-when-downgrade" src="https://www.napsgear.org/stats/matomo.php?idsite=1&amp;rec=1" style="border:0" alt="" /> <!-- End Matomo --></noscript>
```

Use the Edit tool or python to remove them:

```bash
python3 -c "
path = 'c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
lines = [l for l in lines if 'Matomo' not in l]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done, removed', sum(1 for l in open(path) if 'Matomo' in l), 'remaining Matomo lines')
"
```

- [ ] **Step 3: Verify no Matomo references remain**

```bash
grep -c "Matomo\|matomo" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html"
```
Expected: `0`

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/index.html
git commit -m "fix: remove Matomo tracker (non-functional offline)"
```

---

### Task 7: Check JS bundles for hardcoded absolute URLs and patch if needed

**Files:**
- Possibly modify: `www.napsgear.org/templates/js/main.7936197f.js`
- Possibly modify: `www.napsgear.org/templates/js/vendors.dbb1a691.js`

- [ ] **Step 1: Search all downloaded JS for napsgear.org absolute URLs**

```bash
grep -rn "www\.napsgear\.org" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/"
```
Note the output. If the result is empty, skip to Step 3.

- [ ] **Step 2: (If matches found) Patch hardcoded URLs in JS bundles**

For each match, determine if it's a fetch/XHR endpoint (e.g. `/qa.php`, `/advanced_search_result.php`) or a static asset path. Static asset paths should be rewritten to relative; API endpoints can be left as-is since those features won't work offline anyway.

If any static asset URLs are found (e.g. `/templates/img/...`), replace them:

```bash
python3 -c "
import os, glob
js_dir = 'c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js'
for fpath in glob.glob(os.path.join(js_dir, '*.js')):
    with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    if 'https://www.napsgear.org/templates/' in content:
        content = content.replace('https://www.napsgear.org/templates/', '../templates/')
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Patched:', fpath)
"
```

- [ ] **Step 3: Verify no template absolute URLs remain in JS**

```bash
grep -rn "https://www\.napsgear\.org/templates/" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/"
```
Expected: no output

- [ ] **Step 4: Commit (if any changes were made)**

```bash
cd "c:/Users/azemc/OneDrive/Documents/Github/napsgear"
git add www.napsgear.org/templates/js/
git commit -m "fix: patch hardcoded absolute template URLs in JS bundles"
```

---

### Task 8: Final verification — open site offline

**Files:** None modified

- [ ] **Step 1: Confirm no absolute template references remain anywhere**

```bash
grep -rn "https://www.napsgear.org/templates/" "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/"
```
Expected: no output

- [ ] **Step 2: Confirm all 13 template assets exist locally**

```bash
ls -lh \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/css/swiper.14bf534d.css" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/css/vendors.890e34f1.css" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/css/main.68a342d0.css" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/vendors/jquery/jquery.min.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/runtime.1d7d4f4c.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/bootstrap.a5c01dae.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/swiper.66c68bb9.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/dayjs.ffe16fd0.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/vendors.dbb1a691.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/js/main.7936197f.js" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/icons/icons-lib.svg" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/banners/homepage/banner-ama.jpg" \
  "c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/templates/img/banners/homepage/top-weight-loss/top-weight-loss.jpg"
```
Expected: all 13 files listed with non-zero sizes

- [ ] **Step 3: Open the site in a browser (offline)**

Open `c:/Users/azemc/OneDrive/Documents/Github/napsgear/www.napsgear.org/index.html` in a browser while disconnected from the internet (or with devtools network throttling set to "Offline"). The page should render with full styling, the NapsGear logo, navigation, product carousels, and banner images.

- [ ] **Step 4: Check browser console for remaining 404s**

Open browser devtools → Console/Network tab. Reload the page offline. There should be no 404 errors for `/templates/` resources. Any remaining errors will be for live API calls (search, cart, etc.) which are expected and acceptable.
