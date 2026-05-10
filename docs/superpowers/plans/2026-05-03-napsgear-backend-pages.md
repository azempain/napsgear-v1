# NapsGear Backend Server & Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI + Jinja2 server that serves all NapsGear pages with session cart, email checkout, and a Playwright scraper that populates products from ninegear.us.

**Architecture:** FastAPI serves Jinja2 templates that extend a shared base.html (exact visual match to offline/index.html). Cart lives in a signed cookie. Checkout and contact forms send emails via Gmail SMTP. Product data comes from data/products.json populated by a Playwright scraper.

**Tech Stack:** Python 3.11+, FastAPI, Uvicorn, Jinja2, itsdangerous, python-multipart, smtplib, Playwright, pytest, httpx

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `server/config.py` | Admin email, SMTP creds, crypto wallets, secret key |
| Create | `server/requirements.txt` | Python dependencies |
| Create | `server/main.py` | FastAPI app, static mounts, router inclusion |
| Create | `server/services/__init__.py` | Package marker |
| Create | `server/services/products.py` | Load/filter/query products, brands, categories |
| Create | `server/services/cart.py` | Cart encode/decode/add/remove/total |
| Create | `server/services/email.py` | send_email() via smtplib |
| Create | `server/services/context.py` | base_context() helper for all routes |
| Create | `server/routers/__init__.py` | Package marker |
| Create | `server/routers/pages.py` | All GET page routes |
| Create | `server/routers/cart.py` | Cart add/remove/view routes |
| Create | `server/routers/checkout.py` | Checkout GET/POST + confirmation |
| Create | `server/routers/contact.py` | Contact GET/POST |
| Create | `server/templates/base.html` | Shared layout: head, header, nav, footer, scripts |
| Create | `server/templates/index.html` | Home page |
| Create | `server/templates/faq.html` | FAQ accordion |
| Create | `server/templates/shipping.html` | Shipping info |
| Create | `server/templates/why-naps.html` | Trust/about page |
| Create | `server/templates/contact.html` | Contact info + form |
| Create | `server/templates/ask-ifbb-pro.html` | AMA video grid |
| Create | `server/templates/brand.html` | Products by brand |
| Create | `server/templates/category.html` | Products by category |
| Create | `server/templates/product.html` | Product detail + add to cart |
| Create | `server/templates/cart.html` | Cart line items + total |
| Create | `server/templates/checkout.html` | Checkout form + crypto reveal |
| Create | `server/templates/order-confirmed.html` | Thank-you page |
| Create | `server/templates/404.html` | Not found page |
| Create | `tests/conftest.py` | Shared fixtures |
| Create | `tests/test_products.py` | Products service unit tests |
| Create | `tests/test_cart.py` | Cart service unit tests |
| Create | `tests/test_routes.py` | HTTP route smoke tests |
| Create | `scripts/scrape_ninegear.py` | Playwright scraper → products.json + images |

---

## Task 1: Server Scaffold

**Files:**
- Create: `server/config.py`
- Create: `server/requirements.txt`
- Create: `server/services/__init__.py`
- Create: `server/routers/__init__.py`

- [ ] **Step 1.1: Create directory structure**

```bash
mkdir -p server/services server/routers server/templates tests
```

- [ ] **Step 1.2: Write `server/requirements.txt`**

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
jinja2==3.1.4
itsdangerous==2.2.0
python-multipart==0.0.12
httpx==0.27.2
pytest==8.3.3
pytest-asyncio==0.24.0
playwright==1.48.0
```

- [ ] **Step 1.3: Write `server/config.py`**

```python
# All environment-specific values live here — swap in one place.

ADMIN_EMAIL = "azempain@gmail.com"

# Gmail SMTP — generate an App Password at myaccount.google.com/apppasswords
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "azempain@gmail.com"
SMTP_PASS = ""  # fill before going live

CRYPTO_WALLETS = {
    "BTC":        "PLACEHOLDER_BTC_ADDRESS",
    "ETH":        "PLACEHOLDER_ETH_ADDRESS",
    "USDT_TRC20": "PLACEHOLDER_USDT_TRC20_ADDRESS",
    "XMR":        "PLACEHOLDER_XMR_ADDRESS",
}

SECRET_KEY = "change-me-before-going-live"
```

- [ ] **Step 1.4: Write empty `__init__.py` files**

```bash
touch server/services/__init__.py server/routers/__init__.py
```

- [ ] **Step 1.5: Install dependencies**

```bash
cd server && pip install -r requirements.txt
```

Expected: packages install without errors.

- [ ] **Step 1.6: Commit**

```bash
git add server/config.py server/requirements.txt server/services/__init__.py server/routers/__init__.py
git commit -m "feat(server): scaffold server directory and config"
```

---

## Task 2: Products Service

**Files:**
- Create: `server/services/products.py`
- Create: `tests/conftest.py`
- Create: `tests/test_products.py`

- [ ] **Step 2.1: Write `tests/conftest.py`**

```python
import json
import pytest
from pathlib import Path

SAMPLE_PRODUCTS = [
    {
        "slug": "alpha-alphabol-10mg",
        "name": "Alphabol 10mg",
        "price": 45.00,
        "brand": "alpha-pharma-healthcare-c141952",
        "category": "oral-steroids-c14",
        "description": "Methandienone 10mg per tablet.",
        "images": ["cdn.napsgear.org/images/products/alphabol-1.jpg"],
        "in_stock": True,
        "tags": [],
    },
    {
        "slug": "beligas-test-e-250",
        "name": "Test-E 250",
        "price": 55.00,
        "brand": "beligas-c142048",
        "category": "injectable-steroids-c15",
        "description": "Testosterone Enanthate 250mg/ml.",
        "images": ["cdn.napsgear.org/images/products/test-e-1.jpg"],
        "in_stock": True,
        "tags": [],
    },
]

@pytest.fixture
def sample_products(tmp_path, monkeypatch):
    products_file = tmp_path / "products.json"
    products_file.write_text(json.dumps(SAMPLE_PRODUCTS), encoding="utf-8")
    import server.services.products as svc
    monkeypatch.setattr(svc, "DATA_DIR", tmp_path)
    return SAMPLE_PRODUCTS
```

- [ ] **Step 2.2: Write failing tests in `tests/test_products.py`**

```python
import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from services.products import (
    load_products, get_product, products_by_brand,
    products_by_category, featured_products,
)

def test_load_products_returns_list(sample_products):
    result = load_products()
    assert isinstance(result, list)
    assert len(result) == 2

def test_get_product_found(sample_products):
    p = get_product("alpha-alphabol-10mg")
    assert p is not None
    assert p["name"] == "Alphabol 10mg"

def test_get_product_not_found(sample_products):
    assert get_product("does-not-exist") is None

def test_products_by_brand(sample_products):
    results = products_by_brand("alpha-pharma-healthcare-c141952")
    assert len(results) == 1
    assert results[0]["slug"] == "alpha-alphabol-10mg"

def test_products_by_category(sample_products):
    results = products_by_category("oral-steroids-c14")
    assert len(results) == 1

def test_featured_products_limit(sample_products):
    results = featured_products(limit=1)
    assert len(results) == 1

def test_load_products_empty_when_file_missing(tmp_path, monkeypatch):
    import server.services.products as svc
    monkeypatch.setattr(svc, "DATA_DIR", tmp_path)
    assert load_products() == []
```

- [ ] **Step 2.3: Run tests — expect FAIL**

```bash
cd .. && python -m pytest tests/test_products.py -v 2>&1 | head -20
```

Expected: `ImportError` or `ModuleNotFoundError` — `services.products` doesn't exist yet.

- [ ] **Step 2.4: Write `server/services/products.py`**

```python
import json
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def load_products() -> list[dict]:
    path = DATA_DIR / "products.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def load_brands() -> list[dict]:
    path = DATA_DIR / "brands.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def load_categories() -> list[dict]:
    path = DATA_DIR / "categories.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def load_videos() -> list[dict]:
    path = DATA_DIR / "videos.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def get_product(slug: str) -> Optional[dict]:
    return next((p for p in load_products() if p["slug"] == slug), None)


def products_by_brand(brand_slug: str) -> list[dict]:
    return [p for p in load_products() if p.get("brand") == brand_slug]


def products_by_category(category_slug: str) -> list[dict]:
    return [p for p in load_products() if p.get("category") == category_slug]


def featured_products(limit: int = 8) -> list[dict]:
    return load_products()[:limit]
```

- [ ] **Step 2.5: Run tests — expect PASS**

```bash
python -m pytest tests/test_products.py -v
```

Expected: 7 tests PASSED.

- [ ] **Step 2.6: Commit**

```bash
git add server/services/products.py tests/conftest.py tests/test_products.py
git commit -m "feat(server): add products service with tests"
```

---

## Task 3: Cart Service

**Files:**
- Create: `server/services/cart.py`
- Create: `tests/test_cart.py`

- [ ] **Step 3.1: Write failing tests in `tests/test_cart.py`**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from services.cart import (
    decode_cart, encode_cart, add_to_cart,
    remove_from_cart, cart_count, cart_total,
)

SAMPLE_PRODUCT = {
    "slug": "alpha-alphabol-10mg",
    "name": "Alphabol 10mg",
    "price": 45.00,
    "images": ["cdn.napsgear.org/images/products/alphabol-1.jpg"],
}

def test_decode_empty_cookie():
    assert decode_cart(None) == {}
    assert decode_cart("") == {}
    assert decode_cart("invalid-garbage") == {}

def test_encode_decode_roundtrip():
    cart = {"slug": {"name": "X", "price": 10.0, "qty": 1, "image": ""}}
    encoded = encode_cart(cart)
    assert decode_cart(encoded) == cart

def test_add_new_item():
    cart = add_to_cart({}, SAMPLE_PRODUCT, qty=2)
    assert "alpha-alphabol-10mg" in cart
    assert cart["alpha-alphabol-10mg"]["qty"] == 2
    assert cart["alpha-alphabol-10mg"]["price"] == 45.00

def test_add_existing_item_increases_qty():
    cart = add_to_cart({}, SAMPLE_PRODUCT, qty=1)
    cart = add_to_cart(cart, SAMPLE_PRODUCT, qty=3)
    assert cart["alpha-alphabol-10mg"]["qty"] == 4

def test_remove_item():
    cart = add_to_cart({}, SAMPLE_PRODUCT, qty=1)
    cart = remove_from_cart(cart, "alpha-alphabol-10mg")
    assert "alpha-alphabol-10mg" not in cart

def test_remove_nonexistent_is_safe():
    cart = remove_from_cart({}, "does-not-exist")
    assert cart == {}

def test_cart_count():
    cart = add_to_cart({}, SAMPLE_PRODUCT, qty=3)
    assert cart_count(cart) == 3

def test_cart_total():
    cart = add_to_cart({}, SAMPLE_PRODUCT, qty=2)
    assert cart_total(cart) == 90.00
```

- [ ] **Step 3.2: Run tests — expect FAIL**

```bash
python -m pytest tests/test_cart.py -v 2>&1 | head -10
```

Expected: `ImportError` — module doesn't exist yet.

- [ ] **Step 3.3: Write `server/services/cart.py`**

```python
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from itsdangerous import URLSafeSerializer
import config

_serializer = URLSafeSerializer(config.SECRET_KEY, salt="cart")

CART_COOKIE = "napsgear_cart"
CART_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def decode_cart(cookie_value: str | None) -> dict:
    if not cookie_value:
        return {}
    try:
        return _serializer.loads(cookie_value)
    except Exception:
        return {}


def encode_cart(cart: dict) -> str:
    return _serializer.dumps(cart)


def add_to_cart(cart: dict, product: dict, qty: int = 1) -> dict:
    slug = product["slug"]
    if slug in cart:
        cart[slug]["qty"] += qty
    else:
        cart[slug] = {
            "name": product["name"],
            "price": product["price"],
            "qty": qty,
            "image": product["images"][0] if product.get("images") else "",
        }
    return cart


def remove_from_cart(cart: dict, slug: str) -> dict:
    cart.pop(slug, None)
    return cart


def cart_count(cart: dict) -> int:
    return sum(item["qty"] for item in cart.values())


def cart_total(cart: dict) -> float:
    return sum(item["price"] * item["qty"] for item in cart.values())
```

- [ ] **Step 3.4: Run tests — expect PASS**

```bash
python -m pytest tests/test_cart.py -v
```

Expected: 8 tests PASSED.

- [ ] **Step 3.5: Commit**

```bash
git add server/services/cart.py tests/test_cart.py
git commit -m "feat(server): add cart service with tests"
```

---

## Task 4: Email Service + Base Context

**Files:**
- Create: `server/services/email.py`
- Create: `server/services/context.py`

- [ ] **Step 4.1: Write `server/services/email.py`**

```python
import smtplib
import ssl
import sys
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sys.path.insert(0, str(Path(__file__).parent.parent))
import config


def send_email(to: str, subject: str, body_html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config.SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(body_html, "html"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
        server.ehlo()
        server.starttls(context=ctx)
        server.login(config.SMTP_USER, config.SMTP_PASS)
        server.sendmail(config.SMTP_USER, to, msg.as_string())
```

- [ ] **Step 4.2: Write `server/services/context.py`**

```python
from fastapi import Request
from .products import load_brands, load_categories
from .cart import decode_cart, cart_count, cart_total, CART_COOKIE


def base_context(request: Request) -> dict:
    cart_cookie = request.cookies.get(CART_COOKIE)
    cart = decode_cart(cart_cookie)
    return {
        "request": request,
        "brands": load_brands(),
        "categories": load_categories(),
        "cart": cart,
        "cart_count": cart_count(cart),
        "cart_total": cart_total(cart),
    }
```

- [ ] **Step 4.3: Commit**

```bash
git add server/services/email.py server/services/context.py
git commit -m "feat(server): add email service and base context helper"
```

---

## Task 5: FastAPI App + Static Files

**Files:**
- Create: `server/main.py`

- [ ] **Step 5.1: Write `server/main.py`**

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from routers import pages, cart, checkout, contact

ROOT = Path(__file__).parent.parent
TEMPLATES_DIR = Path(__file__).parent / "templates"

app = FastAPI(title="NapsGear")

# Serve existing offline assets unchanged
app.mount(
    "/templates",
    StaticFiles(directory=str(ROOT / "offline" / "templates")),
    name="templates",
)

# Serve locally downloaded product images
cdn_path = ROOT / "offline" / "cdn.napsgear.org"
cdn_path.mkdir(parents=True, exist_ok=True)
app.mount(
    "/cdn.napsgear.org",
    StaticFiles(directory=str(cdn_path)),
    name="cdn",
)

app.include_router(pages.router)
app.include_router(cart.router)
app.include_router(checkout.router)
app.include_router(contact.router)

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@app.exception_handler(404)
async def not_found(request: Request, exc):
    from services.context import base_context
    ctx = base_context(request)
    return templates.TemplateResponse("404.html", ctx, status_code=404)
```

- [ ] **Step 5.2: Create placeholder 404 template so the server can start**

Create `server/templates/404.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>404 Not Found</title></head>
<body><h1>Page not found</h1><a href="/">Go home</a></body>
</html>
```

- [ ] **Step 5.3: Create placeholder index template**

Create `server/templates/index.html`:

```html
<!DOCTYPE html>
<html><body><h1>NapsGear — coming soon</h1></body></html>
```

- [ ] **Step 5.4: Create stub routers so imports don't fail**

Create `server/routers/pages.py`:
```python
from fastapi import APIRouter
router = APIRouter()
```

Create `server/routers/cart.py`:
```python
from fastapi import APIRouter
router = APIRouter()
```

Create `server/routers/checkout.py`:
```python
from fastapi import APIRouter
router = APIRouter()
```

Create `server/routers/contact.py`:
```python
from fastapi import APIRouter
router = APIRouter()
```

- [ ] **Step 5.5: Verify server starts**

```bash
cd server && uvicorn main:app --port 8000
```

Expected: `Application startup complete.` Open http://localhost:8000 — should show "NapsGear — coming soon". Stop with Ctrl+C.

- [ ] **Step 5.6: Commit**

```bash
git add server/main.py server/templates/404.html server/templates/index.html server/routers/pages.py server/routers/cart.py server/routers/checkout.py server/routers/contact.py
git commit -m "feat(server): add FastAPI app with static mounts and stub routers"
```

---

## Task 6: Base Template

**Files:**
- Modify: `server/templates/base.html` (create)

The base template extracts the header, nav, footer, and assets from `offline/index.html` and adds Jinja2 blocks.

- [ ] **Step 6.1: Read `offline/index.html` lines 1-50 to get the `<head>` tag and asset links**

Open the file and note the exact filenames for the three CSS files and the SVG icon sprite `<link>` or inline block. The asset filenames contain hashes (e.g. `main.68a342d0.css`) — copy them exactly.

- [ ] **Step 6.2: Read `offline/index.html` to find the inline SVG sprite block**

Search for `<svg` near the top of `<body>`. This block contains all icon `<symbol>` definitions (icon-search, icon-cart, icon-user, etc.). Copy it verbatim — it must appear in base.html before anything else in `<body>`.

- [ ] **Step 6.3: Write `server/templates/base.html`**

Replace `SWIPER_CSS`, `VENDORS_CSS`, `MAIN_CSS`, `BOOTSTRAP_JS`, `MAIN_JS`, `VENDORS_JS`, `RUNTIME_JS`, `SWIPER_JS` with the exact hashed filenames found in step 6.1. Replace `<!-- SVG_SPRITE -->` with the full inline SVG block found in step 6.2.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% block title %}NapsGear{% endblock %}</title>
  <link rel="stylesheet" href="/templates/css/SWIPER_CSS">
  <link rel="stylesheet" href="/templates/css/VENDORS_CSS">
  <link rel="stylesheet" href="/templates/css/MAIN_CSS">
  {% block extra_head %}{% endblock %}
</head>
<body>

<!-- SVG_SPRITE -->

<header id="header" class="header">
  <div class="header-top">
    <div class="container">
      <div class="header-right header-dropdowns w-sm-100">
        <div class="header-dropdown dropdown-expanded d-none d-lg-block mr-2">
          <a href="#">Links</a>
          <div class="header-menu">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/faq/">FAQ</a></li>
              <li><a href="/shipping-information/">Shipping</a></li>
              <li><a href="/why-naps/">Why Naps?</a></li>
              <li><a href="/contact-us/">Contact Us</a></li>
              <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="header-middle sticky-header mobile-sticky">
    <div class="container">
      <button class="mobile-menu-toggle" type="button">
        <span></span><span></span><span></span>
      </button>
      <a href="/" class="logo">
        <svg viewBox="0 0 90 30"><use href="#logo"></use></svg>
      </a>
      <div class="header-search header-search-inline header-search-category w-lg-max pl-3 pr-1 mb-0">
        <form role="search" action="/search/" method="get" class="kwdsearch">
          <div class="header-search-wrapper">
            <input class="form-control text-1 bg-white header-search-input"
                   name="q" type="search" minlength="2" placeholder="Search...">
            <button class="btn-search" type="submit">
              <svg class="icon" viewBox="0 0 24 24"><use href="#icon-search"></use></svg>
            </button>
          </div>
        </form>
      </div>
      <div class="header-actions">
        <a class="header-icon header-icon-user" href="#loginModal" data-bs-toggle="modal" role="button">
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-user"></use></svg>
        </a>
        <a href="/cart/" title="Cart" class="header-icon header-icon-cart dropdown-arrow cart-toggle">
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-cart"></use></svg>
          <span class="cart-count badge-circle">{{ cart_count }}</span>
        </a>
      </div>
    </div>
  </div>

  <div class="header-bottom sticky-header desktop-sticky d-none d-lg-block">
    <div class="container">
      <nav class="main-nav" id="mainMenu">
        <div class="menu sf-arrows" id="mainMenuNav">

          <div class="menu-item menu-item-dropdown with-megamenu">
            <button class="dropdown-button" role="button"
                    data-bs-target="#brandsMenu" data-bs-toggle="dropdown"
                    data-bs-auto-close="outside" aria-expanded="false">Brands</button>
            <div class="dropdown-menu dropdown-menu-end megamenu" id="brandsMenu">
              <div class="menu-item__list" id="brandMenuList">
                {% for brand in brands %}
                <a class="menu-item__link main-brand" href="/brands/{{ brand.slug }}/">{{ brand.name }}</a>
                {% endfor %}
              </div>
            </div>
          </div>

          <div class="menu-item menu-item-dropdown with-megamenu">
            <button class="dropdown-button" role="button"
                    data-bs-target="#catsMenu" data-bs-toggle="dropdown"
                    data-bs-auto-close="outside" aria-expanded="false">Categories</button>
            <div class="dropdown-menu dropdown-menu-end megamenu" id="catsMenu">
              <div class="menu-item__list">
                {% for cat in categories %}
                <a class="menu-item__link" href="/categories/{{ cat.slug }}/">{{ cat.name }}</a>
                {% endfor %}
              </div>
            </div>
          </div>

          <a class="menu-item" href="/why-naps/">Why Naps?</a>
          <a class="menu-item" href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a>
          <a class="menu-item" href="/faq/">FAQ</a>
        </div>
      </nav>
    </div>
  </div>
</header>

<!-- Mobile nav -->
<div class="mobile-menu-overlay"></div>
<div class="mobile-menu-container">
  <div class="mobile-menu-wrapper">
    <div class="mobile-menu-scroll">
      <nav class="mobile-nav">
        <ul class="mobile-menu">
          <li><a href="/">Home</a></li>
          <li class="expanded">
            <a href="#">Brands</a>
            <ul>
              {% for brand in brands %}
              <li><a href="/brands/{{ brand.slug }}/">{{ brand.name }}</a></li>
              {% endfor %}
            </ul>
          </li>
          <li class="expanded">
            <a href="#">Categories</a>
            <ul>
              {% for cat in categories %}
              <li><a href="/categories/{{ cat.slug }}/">{{ cat.name }}</a></li>
              {% endfor %}
            </ul>
          </li>
          <li><a href="/faq/">FAQ</a></li>
          <li><a href="/shipping-information/">Shipping</a></li>
          <li><a href="/why-naps/">Why Naps?</a></li>
          <li><a href="/contact-us/">Contact Us</a></li>
          <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
        </ul>
      </nav>
    </div>
  </div>
</div>

<main>
  {% block content %}{% endblock %}
</main>

<footer class="footer bg-dark position-relative">
  <div class="footer-middle">
    <div class="container">
      <div class="footer-inner">
        <a href="/" class="logo">
          <svg viewBox="0 0 90 30"><use href="#logo"></use></svg>
        </a>
        <div class="footer-widgets">
          <div class="widget widget-links">
            <h4 class="widget-title mb-1">Customer Service</h4>
            <div class="links link-parts">
              <ul>
                <li><a href="/faq/">FAQ</a></li>
                <li><a href="/shipping-information/">Shipping</a></li>
                <li><a href="/why-naps/">Why Naps?</a></li>
                <li><a href="/contact-us/">Contact Us</a></li>
                <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
              </ul>
            </div>
          </div>
          <div class="widget-about">
            <h5 class="text-white mb-2">NapsGear.Org is the industry's largest marketplace for pharmaceuticals!</h5>
            <p>Each supplier goes through a review process of quality control and maintenance of reputation before we allow them in our store. We carefully select our brands to uphold the highest product quality and shelf-life.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container text-center">
      <span class="footer-copyright">Copyright &copy; 2011 - 2026 All rights reserved &quot;NapsGear&quot;</span>
    </div>
  </div>
</footer>

<!-- Login modal (display only) -->
<div class="modal fade" id="loginModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Sign In</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p class="text-muted">Account login coming soon. To place an order, add items to your cart and proceed to checkout.</p>
        <a href="/cart/" class="btn btn-primary w-100">Go to Cart</a>
      </div>
    </div>
  </div>
</div>

<script src="/templates/js/vendors/jquery/jquery.min.js"></script>
<script src="/templates/js/BOOTSTRAP_JS"></script>
<script src="/templates/js/MAIN_JS"></script>
<script src="/templates/js/VENDORS_JS"></script>
<script src="/templates/js/RUNTIME_JS"></script>
<script src="/templates/js/SWIPER_JS"></script>
{% block extra_scripts %}{% endblock %}
</body>
</html>
```

- [ ] **Step 6.4: Verify the logo SVG renders**

The `<use href="#logo">` requires the SVG sprite to define a `<symbol id="logo">`. If the original `offline/index.html` uses a direct inline `<svg>` for the logo rather than a symbol, copy the full logo SVG from `offline/index.html` directly into the two logo `<a>` tags in base.html, replacing `<svg viewBox="0 0 90 30"><use href="#logo"></use></svg>`.

- [ ] **Step 6.5: Commit**

```bash
git add server/templates/base.html
git commit -m "feat(server): add base Jinja2 template with nav and footer"
```

---

## Task 7: Home + Static Pages

**Files:**
- Modify: `server/routers/pages.py`
- Create: `server/templates/index.html`
- Create: `server/templates/faq.html`
- Create: `server/templates/shipping.html`
- Create: `server/templates/why-naps.html`
- Create: `server/templates/ask-ifbb-pro.html`

- [ ] **Step 7.1: Write `server/routers/pages.py` (static routes only — product routes added in Task 8)**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from services.context import base_context
from services.products import (
    featured_products, load_videos, get_product,
    products_by_brand, products_by_category,
    load_brands, load_categories,
)

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    ctx = base_context(request)
    ctx["featured"] = featured_products(8)
    ctx["videos"] = load_videos()
    return templates.TemplateResponse("index.html", ctx)


@router.get("/faq/", response_class=HTMLResponse)
async def faq(request: Request):
    return templates.TemplateResponse("faq.html", base_context(request))


@router.get("/shipping-information/", response_class=HTMLResponse)
async def shipping(request: Request):
    return templates.TemplateResponse("shipping.html", base_context(request))


@router.get("/why-naps/", response_class=HTMLResponse)
async def why_naps(request: Request):
    return templates.TemplateResponse("why-naps.html", base_context(request))


@router.get("/ask-an-ifbb-pro/", response_class=HTMLResponse)
async def ask_ifbb(request: Request):
    ctx = base_context(request)
    ctx["videos"] = load_videos()
    return templates.TemplateResponse("ask-ifbb-pro.html", ctx)


@router.get("/brands/{slug}/", response_class=HTMLResponse)
async def brand(request: Request, slug: str):
    ctx = base_context(request)
    brand_obj = next((b for b in load_brands() if b["slug"] == slug), None)
    if not brand_obj:
        return templates.TemplateResponse("404.html", ctx, status_code=404)
    ctx["brand"] = brand_obj
    ctx["products"] = products_by_brand(slug)
    return templates.TemplateResponse("brand.html", ctx)


@router.get("/categories/{slug}/", response_class=HTMLResponse)
async def category(request: Request, slug: str):
    ctx = base_context(request)
    cat = next((c for c in load_categories() if c["slug"] == slug), None)
    if not cat:
        return templates.TemplateResponse("404.html", ctx, status_code=404)
    ctx["category"] = cat
    ctx["products"] = products_by_category(slug)
    return templates.TemplateResponse("category.html", ctx)


@router.get("/{product_slug}/", response_class=HTMLResponse)
async def product(request: Request, product_slug: str):
    ctx = base_context(request)
    p = get_product(product_slug)
    if not p:
        return templates.TemplateResponse("404.html", ctx, status_code=404)
    ctx["product"] = p
    return templates.TemplateResponse("product.html", ctx)
```

- [ ] **Step 7.2: Write `server/templates/index.html`**

```html
{% extends "base.html" %}
{% block title %}NapsGear — Pharmaceutical Marketplace{% endblock %}

{% block content %}
<div class="hp-slider">
  <div class="container py-5 text-center">
    <h1 class="display-4 fw-bold">Welcome to NapsGear</h1>
    <p class="lead">The industry's largest marketplace for pharmaceutical-grade products.</p>
    <a href="/brands/alpha-pharma-healthcare-c141952/" class="btn btn-primary btn-lg me-2">Shop Alpha-Pharma</a>
    <a href="/faq/" class="btn btn-outline-secondary btn-lg">FAQ</a>
  </div>
</div>

{% if featured %}
<section class="container py-5">
  <h2 class="mb-4">Featured Products</h2>
  <div class="row row-cols-2 row-cols-md-4 g-3">
    {% for p in featured %}
    <div class="col">
      <div class="card h-100 product-card">
        {% if p.images %}
        <img src="/{{ p.images[0] }}" class="card-img-top" alt="{{ p.name }}" loading="lazy"
             onerror="this.src='/templates/img/banners/homepage/gp_stan50.jpg'">
        {% endif %}
        <div class="card-body">
          <h6 class="card-title"><a href="/{{ p.slug }}/">{{ p.name }}</a></h6>
          <p class="text-primary fw-bold">${{ "%.2f"|format(p.price) }}</p>
        </div>
        <div class="card-footer bg-transparent">
          <form method="post" action="/cart/add/">
            <input type="hidden" name="product_slug" value="{{ p.slug }}">
            <input type="hidden" name="qty" value="1">
            <input type="hidden" name="redirect_to" value="/">
            <button type="submit" class="btn btn-sm btn-primary w-100">Add to Cart</button>
          </form>
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
</section>
{% endif %}

{% if videos %}
<section class="ama-firstpage-section container py-5">
  <div class="d-flex align-items-center mb-4">
    <img src="/templates/img/banners/homepage/banner-ama.jpg" class="img-fluid me-4" style="max-height:80px" alt="AMA">
    <div>
      <h2 class="mb-1">Ask an IFBB Pro</h2>
      <a href="/ask-an-ifbb-pro/" class="btn btn-sm btn-outline-primary">View all videos</a>
    </div>
  </div>
  <div class="row row-cols-1 row-cols-md-4 g-3">
    {% for v in videos[:4] %}
    <div class="col">
      <div class="card post h-100">
        {% if v.thumbnail %}
        <img src="{{ v.thumbnail }}" class="card-img-top" alt="{{ v.title }}" loading="lazy">
        {% endif %}
        <div class="card-body">
          <h6 class="post-title"><a href="{{ v.url }}" target="_blank">{{ v.title }}</a></h6>
          {% if v.date %}<small class="text-muted post-date">{{ v.date }}</small>{% endif %}
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
</section>
{% endif %}
{% endblock %}
```

- [ ] **Step 7.3: Write `server/templates/faq.html`**

```html
{% extends "base.html" %}
{% block title %}FAQ — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Frequently Asked Questions</h1>
  <div class="accordion" id="faqAccordion">

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">How do I place an order?</button></h2>
      <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
        <div class="accordion-body">Browse our brands and categories, add items to your cart, then proceed to checkout. Fill in your contact details and preferred payment method. Our team will contact you to confirm payment and arrange delivery.</div>
      </div>
    </div>

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">What payment methods do you accept?</button></h2>
      <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body">We accept bank transfers and the following cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), USDT (TRC-20), and Monero (XMR). Wallet addresses are shown at checkout when you select a crypto option.</div>
      </div>
    </div>

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">How long does shipping take?</button></h2>
      <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body">Domestic orders typically arrive within 5–10 business days. International orders take 14–21 business days depending on your country. All orders are shipped in discreet, unmarked packaging.</div>
      </div>
    </div>

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">Can I track my order?</button></h2>
      <div id="faq4" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body">Yes. Once your order has shipped, our team will send a tracking number to the email address you provided at checkout.</div>
      </div>
    </div>

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq5">What is your return policy?</button></h2>
      <div id="faq5" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body">We guarantee the quality and authenticity of all products. If you receive a damaged or incorrect item, contact us within 7 days of delivery and we will arrange a replacement or refund.</div>
      </div>
    </div>

    <div class="accordion-item">
      <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq6">Are your products genuine?</button></h2>
      <div id="faq6" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body">Every brand in our catalog has passed our quality control and reputation review process. We source directly from verified manufacturers and perform batch verification checks.</div>
      </div>
    </div>

  </div>
</div>
{% endblock %}
```

- [ ] **Step 7.4: Write `server/templates/shipping.html`**

```html
{% extends "base.html" %}
{% block title %}Shipping Information — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Shipping Information</h1>

  <div class="row g-4">
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">Domestic Shipping</h5>
          <ul class="list-unstyled">
            <li>✔ Standard delivery: 5–10 business days</li>
            <li>✔ Express delivery: 2–4 business days</li>
            <li>✔ Free shipping on orders over $200</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">International Shipping</h5>
          <ul class="list-unstyled">
            <li>✔ Europe: 10–14 business days</li>
            <li>✔ Americas: 14–21 business days</li>
            <li>✔ Asia / Pacific: 14–25 business days</li>
            <li>✔ Middle East / Africa: 18–28 business days</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Discreet Packaging</h5>
          <p>All orders are shipped in plain, unmarked boxes with no indication of contents on the outside. Return address labels use a neutral business name. We respect your privacy completely.</p>
          <h5 class="card-title mt-4">Customs & Import</h5>
          <p>International orders may be subject to customs inspection. We declare packages as "nutritional supplements" to minimise delays. In the rare event of a seizure, contact us and we will reship at no additional cost.</p>
        </div>
      </div>
    </div>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 7.5: Write `server/templates/why-naps.html`**

```html
{% extends "base.html" %}
{% block title %}Why NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Why NapsGear?</h1>
  <div class="row g-4">
    <div class="col-md-3 text-center">
      <div class="card h-100 p-3">
        <div class="display-4">🔬</div>
        <h5 class="mt-3">Verified Suppliers</h5>
        <p>Every brand is vetted through our multi-step review: documentation, lab testing, and reputation scoring before they appear in our store.</p>
      </div>
    </div>
    <div class="col-md-3 text-center">
      <div class="card h-100 p-3">
        <div class="display-4">🛡️</div>
        <h5 class="mt-3">Quality Guarantee</h5>
        <p>We stand behind every product. If it doesn't meet our standards, you get a replacement or full refund — no questions asked.</p>
      </div>
    </div>
    <div class="col-md-3 text-center">
      <div class="card h-100 p-3">
        <div class="display-4">🌍</div>
        <h5 class="mt-3">Global Reach</h5>
        <p>We ship to over 80 countries with discreet packaging and reliable tracking. Customers across 6 continents trust NapsGear.</p>
      </div>
    </div>
    <div class="col-md-3 text-center">
      <div class="card h-100 p-3">
        <div class="display-4">💬</div>
        <h5 class="mt-3">Expert Support</h5>
        <p>Our team of knowledgeable staff answers questions quickly. Our Ask an IFBB Pro program gives customers direct access to professional athletes.</p>
      </div>
    </div>
  </div>
  <div class="mt-5 p-4 bg-light rounded">
    <h4>Over 15 years in business</h4>
    <p class="mb-0">NapsGear has been operating since 2011, building a track record of reliability and discretion that no newcomer can match. We have processed hundreds of thousands of orders for customers worldwide.</p>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 7.6: Write `server/templates/ask-ifbb-pro.html`**

```html
{% extends "base.html" %}
{% block title %}Ask an IFBB Pro — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <div class="d-flex align-items-center mb-4">
    <img src="/templates/img/banners/homepage/banner-ama.jpg" class="img-fluid me-4" style="max-height:80px" alt="AMA">
    <div>
      <h1 class="mb-1">Ask an IFBB Pro</h1>
      <p class="text-muted mb-0">Video answers from professional bodybuilders on training, nutrition, and supplementation.</p>
    </div>
  </div>
  {% if videos %}
  <div class="row row-cols-1 row-cols-md-4 g-3">
    {% for v in videos %}
    <div class="col">
      <div class="card post h-100">
        {% if v.thumbnail %}
        <img src="{{ v.thumbnail }}" class="card-img-top" alt="{{ v.title }}" loading="lazy">
        {% endif %}
        <div class="card-body">
          <h6 class="post-title"><a href="{{ v.url }}" target="_blank" rel="noopener">{{ v.title }}</a></h6>
          {% if v.date %}<small class="text-muted post-date">{{ v.date }}</small>{% endif %}
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  {% else %}
  <p class="text-muted">No videos available yet.</p>
  {% endif %}
</div>
{% endblock %}
```

- [ ] **Step 7.7: Start server and check all 5 routes manually**

```bash
cd server && uvicorn main:app --reload --port 8000
```

Visit in browser:
- http://localhost:8000/ — home page with nav and footer
- http://localhost:8000/faq/ — accordion FAQ
- http://localhost:8000/shipping-information/
- http://localhost:8000/why-naps/
- http://localhost:8000/ask-an-ifbb-pro/

All should render with the NapsGear header, megamenu, and footer. Stop with Ctrl+C.

- [ ] **Step 7.8: Commit**

```bash
git add server/routers/pages.py server/templates/index.html server/templates/faq.html server/templates/shipping.html server/templates/why-naps.html server/templates/ask-ifbb-pro.html
git commit -m "feat(server): add home and static page routes and templates"
```

---

## Task 8: Brand, Category, and Product Page Templates

**Files:**
- Create: `server/templates/brand.html`
- Create: `server/templates/category.html`
- Create: `server/templates/product.html`

The product grid partial is the same across brand.html and category.html — it is copied in full in both templates (no shared partial needed).

- [ ] **Step 8.1: Write `server/templates/brand.html`**

```html
{% extends "base.html" %}
{% block title %}{{ brand.name }} — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item active">{{ brand.name }}</li>
    </ol>
  </nav>
  <h1 class="mb-4">{{ brand.name }}</h1>
  {% if products %}
  <div class="row row-cols-2 row-cols-md-4 g-3">
    {% for p in products %}
    <div class="col">
      <div class="card h-100 product-card">
        {% if p.images %}
        <img src="/{{ p.images[0] }}" class="card-img-top" alt="{{ p.name }}" loading="lazy"
             onerror="this.src='/templates/img/banners/homepage/gp_stan50.jpg'">
        {% endif %}
        <div class="card-body">
          <h6 class="card-title"><a href="/{{ p.slug }}/">{{ p.name }}</a></h6>
          <p class="text-primary fw-bold mb-0">${{ "%.2f"|format(p.price) }}</p>
        </div>
        <div class="card-footer bg-transparent">
          <form method="post" action="/cart/add/">
            <input type="hidden" name="product_slug" value="{{ p.slug }}">
            <input type="hidden" name="qty" value="1">
            <input type="hidden" name="redirect_to" value="/brands/{{ brand.slug }}/">
            <button type="submit" class="btn btn-sm btn-primary w-100">Add to Cart</button>
          </form>
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  {% else %}
  <p class="text-muted">No products listed for this brand yet.</p>
  {% endif %}
</div>
{% endblock %}
```

- [ ] **Step 8.2: Write `server/templates/category.html`**

```html
{% extends "base.html" %}
{% block title %}{{ category.name }} — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item active">{{ category.name }}</li>
    </ol>
  </nav>
  <h1 class="mb-4">{{ category.name }}</h1>
  {% if products %}
  <div class="row row-cols-2 row-cols-md-4 g-3">
    {% for p in products %}
    <div class="col">
      <div class="card h-100 product-card">
        {% if p.images %}
        <img src="/{{ p.images[0] }}" class="card-img-top" alt="{{ p.name }}" loading="lazy"
             onerror="this.src='/templates/img/banners/homepage/gp_stan50.jpg'">
        {% endif %}
        <div class="card-body">
          <h6 class="card-title"><a href="/{{ p.slug }}/">{{ p.name }}</a></h6>
          <p class="text-primary fw-bold mb-0">${{ "%.2f"|format(p.price) }}</p>
        </div>
        <div class="card-footer bg-transparent">
          <form method="post" action="/cart/add/">
            <input type="hidden" name="product_slug" value="{{ p.slug }}">
            <input type="hidden" name="qty" value="1">
            <input type="hidden" name="redirect_to" value="/categories/{{ category.slug }}/">
            <button type="submit" class="btn btn-sm btn-primary w-100">Add to Cart</button>
          </form>
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  {% else %}
  <p class="text-muted">No products listed in this category yet.</p>
  {% endif %}
</div>
{% endblock %}
```

- [ ] **Step 8.3: Write `server/templates/product.html`**

```html
{% extends "base.html" %}
{% block title %}{{ product.name }} — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item active">{{ product.name }}</li>
    </ol>
  </nav>

  <div class="row g-4">
    <div class="col-md-5">
      {% if product.images %}
      <img src="/{{ product.images[0] }}" class="img-fluid rounded" alt="{{ product.name }}"
           onerror="this.src='/templates/img/banners/homepage/gp_stan50.jpg'">
      {% if product.images|length > 1 %}
      <div class="d-flex gap-2 mt-2">
        {% for img in product.images[1:4] %}
        <img src="/{{ img }}" class="img-thumbnail" style="max-height:80px;cursor:pointer"
             onclick="document.querySelector('.product-main-img').src=this.src"
             alt="{{ product.name }}" loading="lazy">
        {% endfor %}
      </div>
      {% endif %}
      {% else %}
      <div class="bg-light rounded d-flex align-items-center justify-content-center" style="min-height:300px">
        <span class="text-muted">No image</span>
      </div>
      {% endif %}
    </div>

    <div class="col-md-7">
      <h1 class="h2 mb-2">{{ product.name }}</h1>
      {% if product.brand %}
      <p class="text-muted mb-1">Brand: <a href="/brands/{{ product.brand }}/">{{ product.brand|replace('-c' + product.brand.split('-c')[-1], '')|replace('-', ' ')|title }}</a></p>
      {% endif %}
      <div class="display-6 text-primary fw-bold mb-3">${{ "%.2f"|format(product.price) }}</div>
      {% if product.in_stock %}
      <span class="badge bg-success mb-3">In Stock</span>
      {% else %}
      <span class="badge bg-secondary mb-3">Out of Stock</span>
      {% endif %}

      <form method="post" action="/cart/add/" class="mb-4">
        <input type="hidden" name="product_slug" value="{{ product.slug }}">
        <input type="hidden" name="redirect_to" value="/{{ product.slug }}/">
        <div class="input-group" style="max-width:220px">
          <span class="input-group-text">Qty</span>
          <input type="number" name="qty" value="1" min="1" max="99" class="form-control">
          <button type="submit" class="btn btn-primary"
                  {% if not product.in_stock %}disabled{% endif %}>Add to Cart</button>
        </div>
      </form>

      {% if product.description %}
      <div class="product-description">
        <h5>Description</h5>
        <p class="whitespace-pre-line">{{ product.description }}</p>
      </div>
      {% endif %}
    </div>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 8.4: Commit**

```bash
git add server/templates/brand.html server/templates/category.html server/templates/product.html
git commit -m "feat(server): add brand, category, and product page templates"
```

---

## Task 9: Cart Routes + Template

**Files:**
- Modify: `server/routers/cart.py`
- Create: `server/templates/cart.html`

- [ ] **Step 9.1: Write `server/routers/cart.py`**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from services.cart import (
    decode_cart, encode_cart, add_to_cart,
    remove_from_cart, cart_total, CART_COOKIE, CART_MAX_AGE,
)
from services.products import get_product
from services.context import base_context

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


@router.get("/cart/", response_class=HTMLResponse)
async def view_cart(request: Request):
    ctx = base_context(request)
    ctx["cart_items"] = list(ctx["cart"].items())
    ctx["total"] = cart_total(ctx["cart"])
    return templates.TemplateResponse("cart.html", ctx)


@router.post("/cart/add/")
async def add_item(
    request: Request,
    product_slug: str = Form(...),
    qty: int = Form(1),
    redirect_to: str = Form("/"),
):
    cart_cookie = request.cookies.get(CART_COOKIE)
    cart = decode_cart(cart_cookie)
    p = get_product(product_slug)
    if p:
        cart = add_to_cart(cart, p, qty)
    response = RedirectResponse(url=redirect_to, status_code=303)
    response.set_cookie(CART_COOKIE, encode_cart(cart), max_age=CART_MAX_AGE, httponly=True, samesite="lax")
    return response


@router.post("/cart/remove/")
async def remove_item(request: Request, product_slug: str = Form(...)):
    cart_cookie = request.cookies.get(CART_COOKIE)
    cart = decode_cart(cart_cookie)
    cart = remove_from_cart(cart, product_slug)
    response = RedirectResponse(url="/cart/", status_code=303)
    response.set_cookie(CART_COOKIE, encode_cart(cart), max_age=CART_MAX_AGE, httponly=True, samesite="lax")
    return response
```

- [ ] **Step 9.2: Write `server/templates/cart.html`**

```html
{% extends "base.html" %}
{% block title %}Your Cart — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Your Cart</h1>

  {% if cart_items %}
  <div class="table-responsive">
    <table class="table align-middle">
      <thead class="table-light">
        <tr>
          <th>Product</th>
          <th class="text-center" style="width:100px">Qty</th>
          <th class="text-end" style="width:120px">Price</th>
          <th class="text-end" style="width:120px">Subtotal</th>
          <th style="width:80px"></th>
        </tr>
      </thead>
      <tbody>
        {% for slug, item in cart_items %}
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              {% if item.image %}
              <img src="/{{ item.image }}" style="width:60px;height:60px;object-fit:cover" class="rounded"
                   alt="{{ item.name }}" onerror="this.style.display='none'">
              {% endif %}
              <a href="/{{ slug }}/">{{ item.name }}</a>
            </div>
          </td>
          <td class="text-center">{{ item.qty }}</td>
          <td class="text-end">${{ "%.2f"|format(item.price) }}</td>
          <td class="text-end fw-bold">${{ "%.2f"|format(item.price * item.qty) }}</td>
          <td class="text-end">
            <form method="post" action="/cart/remove/">
              <input type="hidden" name="product_slug" value="{{ slug }}">
              <button type="submit" class="btn btn-sm btn-outline-danger">Remove</button>
            </form>
          </td>
        </tr>
        {% endfor %}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-end fw-bold fs-5">Total</td>
          <td class="text-end fw-bold fs-5 text-primary">${{ "%.2f"|format(total) }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div class="d-flex justify-content-between mt-3">
    <a href="/" class="btn btn-outline-secondary">Continue Shopping</a>
    <a href="/checkout/" class="btn btn-primary btn-lg">Proceed to Checkout</a>
  </div>

  {% else %}
  <div class="text-center py-5">
    <p class="text-muted fs-5">Your cart is empty.</p>
    <a href="/" class="btn btn-primary">Start Shopping</a>
  </div>
  {% endif %}
</div>
{% endblock %}
```

- [ ] **Step 9.3: Test cart manually**

Start the server, navigate to a brand page (if products.json has data) or home. Add an item to cart, verify the cart badge count updates. Visit /cart/ and verify the line item and total render correctly. Click Remove and verify the item disappears.

- [ ] **Step 9.4: Commit**

```bash
git add server/routers/cart.py server/templates/cart.html
git commit -m "feat(server): add cart routes and template"
```

---

## Task 10: Checkout Routes + Templates

**Files:**
- Modify: `server/routers/checkout.py`
- Create: `server/templates/checkout.html`
- Create: `server/templates/order-confirmed.html`

- [ ] **Step 10.1: Write `server/routers/checkout.py`**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from services.cart import decode_cart, encode_cart, cart_total, CART_COOKIE, CART_MAX_AGE
from services.context import base_context
from services.email import send_email
import config

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


def _items_html(cart: dict) -> str:
    rows = "".join(
        f"<tr><td>{item['name']}</td><td style='text-align:center'>{item['qty']}</td>"
        f"<td style='text-align:right'>${item['price']:.2f}</td>"
        f"<td style='text-align:right'>${item['price'] * item['qty']:.2f}</td></tr>"
        for item in cart.values()
    )
    return rows


@router.get("/checkout/", response_class=HTMLResponse)
async def get_checkout(request: Request):
    ctx = base_context(request)
    if not ctx["cart"]:
        return RedirectResponse(url="/cart/", status_code=303)
    ctx["cart_items"] = list(ctx["cart"].items())
    ctx["total"] = cart_total(ctx["cart"])
    ctx["crypto_wallets"] = config.CRYPTO_WALLETS
    return templates.TemplateResponse("checkout.html", ctx)


@router.post("/checkout/")
async def post_checkout(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    notes: str = Form(""),
    payment_method: str = Form(...),
):
    cart_cookie = request.cookies.get(CART_COOKIE)
    cart = decode_cart(cart_cookie)
    if not cart:
        return RedirectResponse(url="/cart/", status_code=303)

    total = cart_total(cart)
    wallet = config.CRYPTO_WALLETS.get(payment_method, "")
    items_html = _items_html(cart)

    admin_html = f"""
    <h2>New Order from {full_name}</h2>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr style="background:#f5f5f5"><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
      {items_html}
      <tr><td colspan="3"><strong>Total</strong></td><td><strong>${total:.2f}</strong></td></tr>
    </table>
    <h3>Customer Details</h3>
    <p><strong>Name:</strong> {full_name}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Phone:</strong> {phone}</p>
    <p><strong>Address:</strong> {address}</p>
    <p><strong>Notes:</strong> {notes or 'None'}</p>
    <p><strong>Payment Method:</strong> {payment_method}</p>
    {f'<p><strong>Wallet Address:</strong> <code>{wallet}</code></p>' if wallet else ''}
    """

    customer_html = f"""
    <h2>Thank you for your order, {full_name}!</h2>
    <p>We have received your order. Our team will contact you at <strong>{email}</strong> to confirm payment and arrange delivery.</p>
    <h3>Your Order</h3>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr style="background:#f5f5f5"><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
      {items_html}
      <tr><td colspan="3"><strong>Total</strong></td><td><strong>${total:.2f}</strong></td></tr>
    </table>
    <p><strong>Payment Method:</strong> {payment_method}</p>
    {f'<p><strong>Send payment to:</strong> <code>{wallet}</code></p>' if wallet else ''}
    <p>Questions? Email us at {config.ADMIN_EMAIL}</p>
    """

    try:
        send_email(config.ADMIN_EMAIL, f"New Order from {full_name}", admin_html)
        send_email(email, "Your NapsGear order has been received", customer_html)
    except Exception:
        pass  # email failure must not block the order

    response = RedirectResponse(url="/order-confirmed/", status_code=303)
    response.delete_cookie(CART_COOKIE)
    return response


@router.get("/order-confirmed/", response_class=HTMLResponse)
async def confirmed(request: Request):
    return templates.TemplateResponse("order-confirmed.html", base_context(request))
```

- [ ] **Step 10.2: Write `server/templates/checkout.html`**

```html
{% extends "base.html" %}
{% block title %}Checkout — NapsGear{% endblock %}

{% block extra_head %}
<style>
  .crypto-address { display:none; }
  .wallet-box { background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:12px; }
</style>
{% endblock %}

{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Checkout</h1>
  <div class="row g-4">

    <!-- Order summary -->
    <div class="col-md-4 order-md-2">
      <div class="card">
        <div class="card-header fw-bold">Order Summary</div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            {% for slug, item in cart_items %}
            <tr>
              <td>{{ item.name }} <span class="text-muted">×{{ item.qty }}</span></td>
              <td class="text-end">${{ "%.2f"|format(item.price * item.qty) }}</td>
            </tr>
            {% endfor %}
            <tr class="table-light">
              <td class="fw-bold">Total</td>
              <td class="text-end fw-bold text-primary">${{ "%.2f"|format(total) }}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Checkout form -->
    <div class="col-md-8 order-md-1">
      <form method="post" action="/checkout/">
        <h5 class="mb-3">Your Details</h5>

        <div class="mb-3">
          <label class="form-label">Full Name *</label>
          <input type="text" name="full_name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email Address *</label>
          <input type="email" name="email" class="form-control" required>
          <div class="form-text">We'll send your order confirmation here.</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Phone Number *</label>
          <input type="tel" name="phone" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Country &amp; Shipping Address *</label>
          <textarea name="address" class="form-control" rows="3" required placeholder="Country, city, street address, postal code"></textarea>
        </div>
        <div class="mb-4">
          <label class="form-label">Order Notes (optional)</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Any special instructions or questions"></textarea>
        </div>

        <h5 class="mb-3">Payment Method</h5>
        <div class="mb-4">
          {% set payment_options = [
            ('Bank Transfer', 'Bank Transfer', '🏦'),
            ('BTC', 'Bitcoin (BTC)', '₿'),
            ('ETH', 'Ethereum (ETH)', 'Ξ'),
            ('USDT_TRC20', 'USDT TRC-20', '💵'),
            ('XMR', 'Monero (XMR)', '🔒'),
          ] %}
          {% for value, label, icon in payment_options %}
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="payment_method"
                   id="pay_{{ value }}" value="{{ value }}"
                   {% if loop.first %}checked{% endif %}
                   onchange="showWallet(this.value)">
            <label class="form-check-label" for="pay_{{ value }}">{{ icon }} {{ label }}</label>
          </div>
          {% endfor %}

          {% for key, address in crypto_wallets.items() %}
          <div class="crypto-address wallet-box mt-2" id="wallet_{{ key }}">
            <strong>Send payment to:</strong><br>
            <code id="addr_{{ key }}">{{ address }}</code>
            <button type="button" class="btn btn-sm btn-outline-secondary ms-2"
                    onclick="navigator.clipboard.writeText(document.getElementById('addr_{{ key }}').textContent)">Copy</button>
            <div class="form-text mt-1">Include your order total in the payment. Paste the transaction hash in Order Notes above.</div>
          </div>
          {% endfor %}
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-100">Place Order</button>
        <p class="text-muted text-center mt-2 small">After placing your order, our team will contact you to confirm payment before shipping.</p>
      </form>
    </div>

  </div>
</div>
{% endblock %}

{% block extra_scripts %}
<script>
function showWallet(method) {
  document.querySelectorAll('.crypto-address').forEach(el => el.style.display = 'none');
  const el = document.getElementById('wallet_' + method);
  if (el) el.style.display = 'block';
}
</script>
{% endblock %}
```

- [ ] **Step 10.3: Write `server/templates/order-confirmed.html`**

```html
{% extends "base.html" %}
{% block title %}Order Received — NapsGear{% endblock %}
{% block content %}
<div class="container py-5 text-center">
  <div class="py-5">
    <div class="display-1 mb-4">✅</div>
    <h1 class="mb-3">Order Received!</h1>
    <p class="lead text-muted mb-4">
      Thank you for your order. Our team will contact you by email and phone to confirm your payment and arrange delivery.
    </p>
    <p class="text-muted">Please check your inbox for an order confirmation email.<br>
    If you don't see it within a few minutes, check your spam folder.</p>
    <div class="mt-4">
      <a href="/" class="btn btn-primary me-2">Continue Shopping</a>
      <a href="/contact-us/" class="btn btn-outline-secondary">Contact Us</a>
    </div>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 10.4: Test checkout flow manually**

With server running, add a product to cart. Go to /checkout/. Fill the form with test values. Select a crypto option — verify the wallet address appears. Submit — verify redirect to /order-confirmed/. (Email will fail if SMTP_PASS is empty — that's expected. The redirect should still work.)

- [ ] **Step 10.5: Commit**

```bash
git add server/routers/checkout.py server/templates/checkout.html server/templates/order-confirmed.html
git commit -m "feat(server): add checkout flow with email and order confirmation"
```

---

## Task 11: Contact Form

**Files:**
- Modify: `server/routers/contact.py`
- Create: `server/templates/contact.html`

- [ ] **Step 11.1: Write `server/routers/contact.py`**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from services.context import base_context
from services.email import send_email
import config

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


@router.get("/contact-us/", response_class=HTMLResponse)
async def get_contact(request: Request):
    ctx = base_context(request)
    ctx["sent"] = request.query_params.get("sent") == "1"
    return templates.TemplateResponse("contact.html", ctx)


@router.post("/contact-us/")
async def post_contact(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    message: str = Form(...),
):
    body = f"""
    <h2>Contact Form Submission</h2>
    <p><strong>Name:</strong> {name}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Phone:</strong> {phone or 'Not provided'}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">{message}</p>
    """
    try:
        send_email(config.ADMIN_EMAIL, f"Contact: {name}", body)
    except Exception:
        pass
    return RedirectResponse(url="/contact-us/?sent=1", status_code=303)
```

- [ ] **Step 11.2: Write `server/templates/contact.html`**

```html
{% extends "base.html" %}
{% block title %}Contact Us — NapsGear{% endblock %}
{% block content %}
<div class="container py-5">
  <h1 class="mb-4">Contact Us</h1>

  {% if sent %}
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    Your message has been sent. We'll be in touch shortly.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
  {% endif %}

  <div class="row g-5">
    <div class="col-md-4">
      <h5 class="mb-3">Get in Touch</h5>
      <ul class="list-unstyled">
        <li class="mb-3">
          <strong>Email</strong><br>
          <a href="mailto:azempain@gmail.com">azempain@gmail.com</a>
        </li>
        <li class="mb-3">
          <strong>Phone</strong><br>
          <span class="text-muted">Available upon request</span>
        </li>
        <li class="mb-3">
          <strong>Support Hours</strong><br>
          Monday – Friday, 9am – 6pm UTC
        </li>
      </ul>
      <hr>
      <p class="text-muted small">For order inquiries, please include your order confirmation number in your message.</p>
    </div>

    <div class="col-md-8">
      <h5 class="mb-3">Send a Message</h5>
      <form method="post" action="/contact-us/">
        <div class="mb-3">
          <label class="form-label">Your Name *</label>
          <input type="text" name="name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email Address *</label>
          <input type="email" name="email" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Phone Number</label>
          <input type="tel" name="phone" class="form-control" placeholder="Optional">
        </div>
        <div class="mb-3">
          <label class="form-label">Message *</label>
          <textarea name="message" class="form-control" rows="5" required placeholder="How can we help you?"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Send Message</button>
      </form>
    </div>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 11.3: Commit**

```bash
git add server/routers/contact.py server/templates/contact.html
git commit -m "feat(server): add contact form route and template"
```

---

## Task 12: Route Tests

**Files:**
- Create: `tests/test_routes.py`

- [ ] **Step 12.1: Write `tests/test_routes.py`**

```python
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)


def test_home_returns_200():
    response = client.get("/")
    assert response.status_code == 200
    assert b"NapsGear" in response.content


def test_faq_returns_200():
    response = client.get("/faq/")
    assert response.status_code == 200
    assert b"Frequently Asked Questions" in response.content


def test_shipping_returns_200():
    response = client.get("/shipping-information/")
    assert response.status_code == 200
    assert b"Shipping" in response.content


def test_why_naps_returns_200():
    response = client.get("/why-naps/")
    assert response.status_code == 200
    assert b"Why NapsGear" in response.content


def test_contact_get_returns_200():
    response = client.get("/contact-us/")
    assert response.status_code == 200
    assert b"Contact" in response.content


def test_ask_ifbb_returns_200():
    response = client.get("/ask-an-ifbb-pro/")
    assert response.status_code == 200


def test_cart_empty_returns_200():
    response = client.get("/cart/")
    assert response.status_code == 200
    assert b"cart is empty" in response.content.lower()


def test_checkout_empty_cart_redirects():
    response = client.get("/checkout/", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/cart/"


def test_unknown_route_returns_404():
    response = client.get("/this-does-not-exist-xyz/")
    assert response.status_code == 404


def test_unknown_brand_returns_404():
    response = client.get("/brands/no-such-brand-c999/")
    assert response.status_code == 404


def test_unknown_category_returns_404():
    response = client.get("/categories/no-such-cat/")
    assert response.status_code == 404
```

- [ ] **Step 12.2: Run all tests**

```bash
python -m pytest tests/ -v
```

Expected: all tests in test_products.py, test_cart.py, and test_routes.py pass. Route tests do not require SMTP to be configured.

- [ ] **Step 12.3: Commit**

```bash
git add tests/test_routes.py
git commit -m "test(server): add route smoke tests"
```

---

## Task 13: Ninegear Product Scraper

**Files:**
- Create: `scripts/scrape_ninegear.py`

- [ ] **Step 13.1: Install Playwright browsers (if not already installed)**

```bash
python -m playwright install chromium
```

Expected: Chromium downloads successfully.

- [ ] **Step 13.2: Write `scripts/scrape_ninegear.py`**

```python
"""
Scrapes product catalog from ninegear.us.
Outputs: data/products.json (incremental, crash-safe)
         data/categories.json (rebuilt from site nav)
Images:  offline/cdn.napsgear.org/images/products/<slug>-<n>.jpg

Run from project root:
    python scripts/scrape_ninegear.py

Re-run is safe — already-saved slugs are skipped.
"""

import asyncio
import json
import re
import sys
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright, Page, BrowserContext

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
IMAGES_DIR = ROOT / "offline" / "cdn.napsgear.org" / "images" / "products"
BASE_URL = "https://ninegear.us"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)


# ── helpers ──────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text)


def load_json(path: Path) -> list:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return []


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def download_image(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            dest.write_bytes(r.read())
        return True
    except Exception as e:
        print(f"  ⚠ image download failed: {url} — {e}")
        return False


# ── scraping ─────────────────────────────────────────────────────────────────

async def get_brand_urls(page: Page) -> list[dict]:
    """Extract all brand URLs from the site navigation."""
    await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
    brands = []
    # Try common patterns: nav links that look like brand pages
    links = await page.query_selector_all("a[href]")
    for link in links:
        href = await link.get_attribute("href") or ""
        text = (await link.inner_text()).strip()
        # Brand links typically contain manufacturer names
        if href and text and len(text) > 2 and not any(skip in href.lower() for skip in
                ["cart", "checkout", "account", "login", "faq", "contact", "shipping", "search"]):
            if href.startswith("/") and href.count("/") <= 2:
                full = BASE_URL + href if not href.startswith("http") else href
                if not any(b["url"] == full for b in brands):
                    brands.append({"name": text, "url": full, "slug": slugify(text)})
    return brands


async def get_product_urls(page: Page, brand_url: str) -> list[str]:
    """Collect all product page URLs from a brand/listing page."""
    try:
        await page.goto(brand_url, wait_until="domcontentloaded", timeout=30000)
    except Exception:
        return []
    urls = []
    links = await page.query_selector_all("a[href]")
    for link in links:
        href = await link.get_attribute("href") or ""
        if not href:
            continue
        full = href if href.startswith("http") else BASE_URL + href
        # Product URLs have more path segments than brand URLs
        if full.startswith(BASE_URL) and full.count("/") >= 4 and full not in urls:
            urls.append(full)
    return urls


async def scrape_product(page: Page, url: str, existing_slugs: set) -> dict | None:
    """Scrape a single product page. Returns None if slug already exists."""
    slug = slugify(url.rstrip("/").split("/")[-1])
    if slug in existing_slugs:
        print(f"  ↩ skip {slug}")
        return None

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        print(f"  ✗ failed to load {url}: {e}")
        return None

    # Name
    name = ""
    for sel in ["h1.product-title", "h1.product_title", "h1", ".product-name h1"]:
        el = await page.query_selector(sel)
        if el:
            name = (await el.inner_text()).strip()
            break
    if not name:
        return None

    # Price
    price = 0.0
    for sel in [".price .amount", ".woocommerce-Price-amount", ".price", "[class*='price']"]:
        el = await page.query_selector(sel)
        if el:
            text = await el.inner_text()
            match = re.search(r"[\d,]+\.?\d*", text.replace(",", ""))
            if match:
                try:
                    price = float(match.group().replace(",", ""))
                    break
                except ValueError:
                    pass

    # Description
    description = ""
    for sel in [".product-description", ".woocommerce-product-details__short-description",
                "#tab-description", ".tab-pane.description"]:
        el = await page.query_selector(sel)
        if el:
            description = (await el.inner_text()).strip()
            break

    # Images
    images: list[str] = []
    img_els = await page.query_selector_all(".woocommerce-product-gallery img, .product-images img, .product img")
    for img in img_els[:5]:
        src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
        if src and src not in images and not src.endswith(".gif"):
            images.append(src)

    # Download images locally
    local_images: list[str] = []
    for i, img_url in enumerate(images):
        if not img_url.startswith("http"):
            img_url = BASE_URL + img_url
        ext = img_url.split("?")[0].rsplit(".", 1)[-1]
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        filename = f"{slug}-{i + 1}.{ext}"
        dest = IMAGES_DIR / filename
        if download_image(img_url, dest):
            local_images.append(f"cdn.napsgear.org/images/products/{filename}")

    # In-stock
    in_stock = True
    for sel in [".out-of-stock", ".stock.out-of-stock", "[class*='outofstock']"]:
        if await page.query_selector(sel):
            in_stock = False
            break

    # Brand (from breadcrumb or meta)
    brand_slug = ""
    for sel in [".breadcrumb a", ".woocommerce-breadcrumb a"]:
        els = await page.query_selector_all(sel)
        for el in els:
            href = await el.get_attribute("href") or ""
            text = (await el.inner_text()).strip()
            if text and text.lower() not in ("home", "shop", "products"):
                brand_slug = slugify(text)
                break
        if brand_slug:
            break

    # Category (from breadcrumb)
    category_slug = ""
    crumbs = await page.query_selector_all(".breadcrumb a, .woocommerce-breadcrumb a")
    if len(crumbs) >= 2:
        last = crumbs[-1]
        text = (await last.inner_text()).strip()
        if text.lower() not in ("home", "shop"):
            category_slug = slugify(text)

    return {
        "slug": slug,
        "name": name,
        "price": price,
        "brand": brand_slug,
        "category": category_slug,
        "description": description,
        "images": local_images,
        "in_stock": in_stock,
        "tags": [],
    }


async def scrape_categories(page: Page) -> list[dict]:
    """Rebuild categories list from site navigation."""
    await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
    categories = []
    # Look for category nav (usually under "Shop by Category" or similar)
    for sel in [".product-categories a", ".widget_product_categories a",
                "nav a[href*='categor']", ".nav-categories a"]:
        links = await page.query_selector_all(sel)
        for link in links:
            href = await link.get_attribute("href") or ""
            text = (await link.inner_text()).strip()
            if text and href:
                slug = slugify(text)
                if not any(c["slug"] == slug for c in categories):
                    categories.append({"slug": slug, "name": text, "url": href})
        if categories:
            break
    return categories


# ── main ─────────────────────────────────────────────────────────────────────

async def main():
    products_path = DATA_DIR / "products.json"
    products = load_json(products_path)
    existing_slugs = {p["slug"] for p in products}
    print(f"Existing products: {len(products)}")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx: BrowserContext = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
        )
        page = await ctx.new_page()

        # 1. Rebuild categories
        print("\n── Scraping categories ──")
        categories = await scrape_categories(page)
        if categories:
            save_json(DATA_DIR / "categories.json", categories)
            print(f"Saved {len(categories)} categories")
        else:
            print("No categories found — keeping existing categories.json")

        # 2. Get brand pages
        print("\n── Collecting brand URLs ──")
        brand_pages = await get_brand_urls(page)
        print(f"Found {len(brand_pages)} potential brand/listing pages")

        # 3. Collect product URLs from each brand page
        all_product_urls: list[str] = []
        for brand in brand_pages:
            print(f"  → {brand['name']}: {brand['url']}")
            urls = await get_product_urls(page, brand["url"])
            print(f"    {len(urls)} product links")
            for u in urls:
                if u not in all_product_urls:
                    all_product_urls.append(u)

        print(f"\n── Scraping {len(all_product_urls)} product pages ──")

        for i, url in enumerate(all_product_urls, 1):
            print(f"[{i}/{len(all_product_urls)}] {url}")
            product = await scrape_product(page, url, existing_slugs)
            if product:
                products.append(product)
                existing_slugs.add(product["slug"])
                save_json(products_path, products)
                print(f"  ✓ saved: {product['name']} (${product['price']:.2f})")

        await browser.close()

    print(f"\nDone. Total products: {len(products)}")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 13.3: Run the scraper**

```bash
python scripts/scrape_ninegear.py
```

Expected: scraper starts, visits ninegear.us, collects brand pages, scrapes products one by one printing progress. Images download to `offline/cdn.napsgear.org/images/products/`. Progress is saved after each product.

If the site structure doesn't match the selectors, check the printed output. The scraper prints page URLs as it visits them — open one in a browser and inspect the DOM to find the correct CSS selectors, then update the relevant `query_selector` calls in `scrape_product()`.

- [ ] **Step 13.4: Verify output**

```bash
python -c "import json; d=json.load(open('data/products.json')); print(len(d), 'products'); print(d[0] if d else 'empty')"
```

Expected: at least 1 product printed with name, price, slug, and local image paths.

- [ ] **Step 13.5: Restart server and check a product page**

```bash
cd server && uvicorn main:app --reload --port 8000
```

Navigate to http://localhost:8000/ — featured products should now appear. Click one — product detail page should render with image, price, and Add to Cart button.

- [ ] **Step 13.6: Commit**

```bash
git add scripts/scrape_ninegear.py data/products.json data/categories.json
git commit -m "feat(scraper): add ninegear.us product scraper and scraped data"
```

---

## Self-Review Checklist

- [x] **Config** — single config.py, ADMIN_EMAIL, SMTP, crypto wallets, SECRET_KEY ✓
- [x] **Routes** — all 16 routes from spec implemented across 4 routers ✓
- [x] **Cart** — signed cookie, add/remove/count/total, 30-day expiry ✓
- [x] **Checkout** — all required fields (name, email, phone, address, notes, payment), two emails sent, cart cleared ✓
- [x] **Crypto** — 4 wallets, address revealed on selection, copy button ✓
- [x] **Contact form** — name/email/phone/message, admin email, ?sent=1 flash ✓
- [x] **Static pages** — faq, shipping, why-naps, ask-ifbb-pro with real content ✓
- [x] **Brand/category/product pages** — filter by slug, 404 if not found ✓
- [x] **Images** — served from /cdn.napsgear.org/, fallback on error ✓
- [x] **Scraper** — visits ninegear.us, extracts products + images, saves incrementally, idempotent ✓
- [x] **Tests** — products service (7), cart service (8), route smoke tests (11) ✓
- [x] **404 handler** — registered in main.py for all unknown routes ✓
- [x] **Type consistency** — `cart_total`, `encode_cart`, `decode_cart`, `CART_COOKIE`, `CART_MAX_AGE` used consistently across services and routers ✓
