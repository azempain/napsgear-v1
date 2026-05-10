# Localize napsgear.org URLs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `https://www.napsgear.org/` URL in `app/src/` with a local relative path or `#`.

**Architecture:** Direct source edits — no runtime utility, no redirect config. Each task targets one file or group of files. The verification step (`grep`) is the acceptance test throughout.

**Tech Stack:** Next.js 16 (App Router), TypeScript, JSON data files, Python 3 for JSON transforms.

---

## Baseline

- [ ] **Confirm starting count**

```bash
grep -r "napsgear.org" app/src/ | wc -l
```

Expected: non-zero (≈275 across all files).

---

## Task 1: JSON Data Files

**Files:**
- Modify: `app/src/data/brands.json`
- Modify: `app/src/data/categories.json`
- Modify: `app/src/data/qa-posts.json`
- Modify: `app/src/data/videos.json`

The JSON files have a `url` field on every entry. The replacement rules are mechanical and applied with a Python script (no install needed — Python 3 is available).

- [ ] **Step 1: Run the transform script**

```bash
python3 - <<'EOF'
import json, re

# brands.json — url field → /brands/{path-segment}
with open('app/src/data/brands.json') as f:
    brands = json.load(f)
for b in brands:
    url = b.get('url', '')
    path = re.sub(r'^https?://(www\.)?napsgear\.org/', '', url)
    b['url'] = f'/brands/{path}'
with open('app/src/data/brands.json', 'w') as f:
    json.dump(brands, f, indent=2, ensure_ascii=False)

# categories.json — url field → /categories/{path-segment}
with open('app/src/data/categories.json') as f:
    cats = json.load(f)
for c in cats:
    url = c.get('url', '')
    path = re.sub(r'^https?://(www\.)?napsgear\.org/', '', url)
    c['url'] = f'/categories/{path}'
with open('app/src/data/categories.json', 'w') as f:
    json.dump(cats, f, indent=2, ensure_ascii=False)

# qa-posts.json — url field → #
with open('app/src/data/qa-posts.json') as f:
    qa = json.load(f)
for p in qa:
    if 'napsgear.org' in p.get('url', ''):
        p['url'] = '#'
with open('app/src/data/qa-posts.json', 'w') as f:
    json.dump(qa, f, indent=2, ensure_ascii=False)

# videos.json — url field → /ask-an-ifbb-pro/
with open('app/src/data/videos.json') as f:
    vids = json.load(f)
for v in vids:
    if 'napsgear.org' in v.get('url', ''):
        v['url'] = '/ask-an-ifbb-pro/'
with open('app/src/data/videos.json', 'w') as f:
    json.dump(vids, f, indent=2, ensure_ascii=False)

print('Done.')
EOF
```

- [ ] **Step 2: Verify JSON files are clean**

```bash
grep -r "napsgear.org" app/src/data/
```

Expected: no output.

- [ ] **Step 3: Spot-check the transformed values**

```bash
python3 -c "
import json
with open('app/src/data/brands.json') as f:
    b = json.load(f)
print('brands[0].url:', b[0]['url'])

with open('app/src/data/categories.json') as f:
    c = json.load(f)
print('categories[0].url:', c[0]['url'])

with open('app/src/data/qa-posts.json') as f:
    q = json.load(f)
print('qa-posts[0].url:', q[0]['url'])

with open('app/src/data/videos.json') as f:
    v = json.load(f)
print('videos[0].url:', v[0]['url'])
"
```

Expected output:
```
brands[0].url: /brands/alpha-pharma-healthcare-c141952
categories[0].url: /categories/accordo-rx-c144205
qa-posts[0].url: #
videos[0].url: /ask-an-ifbb-pro/
```

- [ ] **Step 4: Commit**

```bash
git add app/src/data/brands.json app/src/data/categories.json app/src/data/qa-posts.json app/src/data/videos.json
git commit -m "fix: localize napsgear.org URLs in JSON data files"
```

---

## Task 2: Small Components

**Files:**
- Modify: `app/src/components/Header.tsx` (line 56)
- Modify: `app/src/components/AmaSection.tsx` (line 26)
- Modify: `app/src/components/HeroSlideProductOfWeek.tsx` (line 4)
- Modify: `app/src/components/HeroCarousel.tsx` (lines 9, 15, 20)
- Modify: `app/src/components/GearpicsSection.tsx` (line 8)
- Modify: `app/src/components/GearpicItem.tsx` (line 4)
- Modify: `app/src/components/QaSection.tsx` (line 8)

### Header.tsx — search form action

- [ ] **Step 1: Replace search form action**

In `app/src/components/Header.tsx`, change line 56:

```tsx
// Before
<form role="search" action="https://www.napsgear.org/advanced_search_result.php" method="get" className="kwdsearch">

// After
<form role="search" action="#" method="get" className="kwdsearch">
```

### AmaSection.tsx — "See more videos" link

- [ ] **Step 2: Replace AMA link**

In `app/src/components/AmaSection.tsx`, change line 26:

```tsx
// Before
<a className="btn btn-outline-primary btn-sm" href="https://www.napsgear.org/ama.php">

// After
<a className="btn btn-outline-primary btn-sm" href="/ask-an-ifbb-pro/">
```

### HeroSlideProductOfWeek.tsx — product link

- [ ] **Step 3: Replace product link**

In `app/src/components/HeroSlideProductOfWeek.tsx`, change line 4:

```tsx
// Before
<a href="https://www.napsgear.org/gp-anastrozole-arimidex--p8194" className="d-block h-100">

// After
<a href="/gp-anastrozole-arimidex--p8194" className="d-block h-100">
```

### HeroCarousel.tsx — three slide links

- [ ] **Step 4: Replace three carousel links**

In `app/src/components/HeroCarousel.tsx`, change lines 9, 15, and 20:

```tsx
// Before (line 9)
href="https://www.napsgear.org/phishing-warning"
// After
href="#"

// Before (line 15)
href="https://www.napsgear.org/ama.php"
// After
href="/ask-an-ifbb-pro/"

// Before (line 20)
href="https://www.napsgear.org/top-weight-loss-peptides-c147555"
// After
href="/categories/top-weight-loss-peptides-c147555"
```

### GearpicsSection.tsx

- [ ] **Step 5: Replace gearpics section link**

In `app/src/components/GearpicsSection.tsx`, change line 8:

```tsx
// Before
<a href="https://www.napsgear.org/gearpics.php">Customers images</a>

// After
<a href="#">Customers images</a>
```

### GearpicItem.tsx

- [ ] **Step 6: Replace gearpic item link**

In `app/src/components/GearpicItem.tsx`, change line 4:

```tsx
// Before
const href = `https://www.napsgear.org/gearpics.php?id=${item.id}`

// After
const href = '#'
```

### QaSection.tsx

- [ ] **Step 7: Replace Q&A section link**

In `app/src/components/QaSection.tsx`, change line 8:

```tsx
// Before
<a href="https://www.napsgear.org/qa.php">

// After
<a href="#">
```

- [ ] **Step 8: Verify these files are clean**

```bash
grep -n "napsgear.org" \
  app/src/components/Header.tsx \
  app/src/components/AmaSection.tsx \
  app/src/components/HeroSlideProductOfWeek.tsx \
  app/src/components/HeroCarousel.tsx \
  app/src/components/GearpicsSection.tsx \
  app/src/components/GearpicItem.tsx \
  app/src/components/QaSection.tsx
```

Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add \
  app/src/components/Header.tsx \
  app/src/components/AmaSection.tsx \
  app/src/components/HeroSlideProductOfWeek.tsx \
  app/src/components/HeroCarousel.tsx \
  app/src/components/GearpicsSection.tsx \
  app/src/components/GearpicItem.tsx \
  app/src/components/QaSection.tsx
git commit -m "fix: localize napsgear.org URLs in small components"
```

---

## Task 3: HeaderNav.tsx (61 hits)

**File:** `app/src/components/HeaderNav.tsx`

This file has three megamenu sections (Brands, Categories, Shipping Locations) and two regular dropdowns (Promotions, Info & Entertainment). Apply brand → `/brands/`, category → `/categories/`, and `#` for everything else.

- [ ] **Step 1: Replace all brand links**

Every `href` in the Brands `<ul>` block follows the pattern `https://www.napsgear.org/SLUG-cNUMBER`. Run:

```bash
python3 - <<'EOF'
import re

with open('app/src/components/HeaderNav.tsx') as f:
    content = f.read()

# ── Brands block: href="https://www.napsgear.org/SLUG" → href="/brands/SLUG"
# The brands ul is between the "Brands" button and the Categories button.
# Strategy: replace all napsgear.org hrefs that contain -c\d+ in the brands section.
# We do a full-file pass with context: lines between "Brands" comment and "Categories" comment.

lines = content.split('\n')
in_brands = False
in_categories = False
in_shipping = False
out = []

for line in lines:
    if '── Brands' in line:
        in_brands = True
        in_categories = False
        in_shipping = False
    elif '── Categories' in line:
        in_brands = False
        in_categories = True
        in_shipping = False
    elif '── Shipping' in line:
        in_brands = False
        in_categories = False
        in_shipping = True
    elif '── Promotions' in line or '── Info' in line:
        in_brands = False
        in_categories = False
        in_shipping = False

    if in_brands:
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/([^"]+)"',
            lambda m: f'href="/brands/{m.group(2)}"',
            line
        )
    elif in_categories:
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/([^"]+)"',
            lambda m: f'href="/categories/{m.group(2)}"',
            line
        )
    elif in_shipping:
        # Shipping locations are brand/location pages — map to /brands/
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/([^"]+)"',
            lambda m: f'href="/brands/{m.group(2)}"',
            line
        )
    else:
        # Promotions / Info & Entertainment
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/ama\.php[^"]*"',
            'href="/ask-an-ifbb-pro/"',
            line
        )
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/[^"]+"',
            'href="#"',
            line
        )

    out.append(line)

with open('app/src/components/HeaderNav.tsx', 'w') as f:
    f.write('\n'.join(out))

print('Done.')
EOF
```

- [ ] **Step 2: Verify HeaderNav is clean**

```bash
grep -n "napsgear.org" app/src/components/HeaderNav.tsx
```

Expected: no output.

- [ ] **Step 3: Spot-check the replacements look correct**

```bash
grep -n 'href="/brands/' app/src/components/HeaderNav.tsx | head -5
grep -n 'href="/categories/' app/src/components/HeaderNav.tsx | head -5
grep -n 'href="#"' app/src/components/HeaderNav.tsx | head -5
grep -n 'href="/ask-an-ifbb-pro/' app/src/components/HeaderNav.tsx | head -3
```

Expected: brand/category/shipping links show local paths, promo/info links show `#`, AMA shows `/ask-an-ifbb-pro/`.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/HeaderNav.tsx
git commit -m "fix: localize napsgear.org URLs in HeaderNav"
```

---

## Task 4: MainNav.tsx (10 hits)

**File:** `app/src/components/MainNav.tsx`

- [ ] **Step 1: Read the file to understand its URL sections**

```bash
grep -n "napsgear.org" app/src/components/MainNav.tsx
```

- [ ] **Step 2: Apply the same section-aware replacement**

```bash
python3 - <<'EOF'
import re

with open('app/src/components/MainNav.tsx') as f:
    content = f.read()

lines = content.split('\n')
in_brands = False
in_categories = False
out = []

for line in lines:
    if 'brand' in line.lower() and ('section' in line.lower() or 'menu' in line.lower() or '──' in line):
        in_brands = True
        in_categories = False
    elif 'categor' in line.lower() and ('section' in line.lower() or 'menu' in line.lower() or '──' in line):
        in_brands = False
        in_categories = True
    elif 'promotion' in line.lower() or 'info' in line.lower() or 'shipping' in line.lower():
        in_brands = False
        in_categories = False

    if in_brands:
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/([^"]+)"',
            lambda m: f'href="/brands/{m.group(2)}"',
            line
        )
    elif in_categories:
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/([^"]+)"',
            lambda m: f'href="/categories/{m.group(2)}"',
            line
        )
    else:
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/ama\.php[^"]*"',
            'href="/ask-an-ifbb-pro/"',
            line
        )
        line = re.sub(
            r'href="https?://(www\.)?napsgear\.org/[^"]+"',
            'href="#"',
            line
        )

    out.append(line)

with open('app/src/components/MainNav.tsx', 'w') as f:
    f.write('\n'.join(out))

print('Done.')
EOF
```

- [ ] **Step 3: Verify**

```bash
grep -n "napsgear.org" app/src/components/MainNav.tsx
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/MainNav.tsx
git commit -m "fix: localize napsgear.org URLs in MainNav"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Full scan — must return zero**

```bash
grep -r "napsgear.org" app/src/
```

Expected: **no output**.

- [ ] **Step 2: Confirm local paths are present**

```bash
echo "=== Brand links ==="
grep -r 'href="/brands/' app/src/ | wc -l

echo "=== Category links ==="
grep -r 'href="/categories/' app/src/ | wc -l

echo "=== AMA links ==="
grep -r 'href="/ask-an-ifbb-pro/' app/src/ | wc -l

echo "=== Placeholder links ==="
grep -r 'href="#"' app/src/ | wc -l
```

Expected: non-zero counts for all four groups.

- [ ] **Step 3: Start dev server and confirm no console errors about external URLs**

```bash
cd app && npm run dev
```

Open `http://localhost:3000` in a browser, open DevTools console, and confirm no "napsgear.org" references appear in network requests or console errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: all napsgear.org URLs now local — grep app/src/ returns zero"
```
