# Tailwind v4 + shadcn/ui Setup — Design Spec
**Date:** 2026-05-10
**Status:** Approved

---

## Goal

Configure Tailwind CSS v4 and shadcn/ui to work fully alongside the existing Bootstrap-based styles (`/public/css/vendors.css`, `/public/css/main.css`), with both systems active at equal priority and zero cascade conflicts. shadcn components are themed to match the NapsGear brand palette.

---

## Approach

**Utilities-only Tailwind import** — import `tailwindcss/theme` and `tailwindcss/utilities` only; skip Tailwind's preflight entirely. Bootstrap's reset remains the sole page-level reset. shadcn CSS variables are added as a manual `@layer base` block in `globals.css`. The `.container` utility collision is suppressed with an empty `@utility` override.

---

## 1. Packages

Install as `dependencies` (runtime, used by components):

| Package | Version | Purpose |
|---|---|---|
| `clsx` | latest | Conditional class joining |
| `tailwind-merge` | latest | Merge Tailwind classes without specificity bugs |
| `class-variance-authority` | latest | shadcn component variant system |
| `@radix-ui/react-slot` | latest | `asChild` prop pattern used by shadcn |
| `@radix-ui/react-dialog` | latest | Dialog primitive |
| `@radix-ui/react-label` | latest | Label primitive (used by Input) |

---

## 2. globals.css Changes

Three additions, in order at the top of `src/app/globals.css`:

### 2a. Tailwind imports (no preflight)

```css
@import "tailwindcss/theme" layer(tw-theme);
@import "tailwindcss/utilities" layer(tw-utilities);
```

Placing imports in explicit named layers gives the cascade a predictable order and prevents Tailwind's theme tokens from clobbering Bootstrap's `:root` variables.

### 2b. shadcn CSS variables (NapsGear brand)

NapsGear brand colors:
- Primary blue: `#0089cb` → HSL `201 100% 40%`
- Secondary red: `#ff7272` → HSL `0 100% 72%`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    --primary: 201 100% 40%;        /* #0089cb */
    --primary-foreground: 0 0% 100%;

    --secondary: 0 100% 72%;        /* #ff7272 */
    --secondary-foreground: 0 0% 100%;

    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;

    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 201 100% 40%;

    --radius: 0.375rem;
  }

  [data-theme="dark"] {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;

    --primary: 201 100% 50%;
    --primary-foreground: 0 0% 100%;

    --secondary: 0 100% 72%;
    --secondary-foreground: 0 0% 100%;

    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;

    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 100%;

    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 201 100% 50%;
  }
}
```

### 2c. Container collision suppression

Bootstrap's `.container` is already in use sitewide. Tailwind v4 also generates a `.container` utility. Override it with an empty rule so Tailwind's definition is a no-op:

```css
@utility container {
  /* Bootstrap's .container is used — Tailwind's version is suppressed */
}
```

---

## 3. components.json

Create at project root. Controls where shadcn CLI places generated components:

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## 4. `src/lib/utils.ts`

Standard shadcn `cn()` helper. Merges class names safely with `clsx` + `tailwind-merge`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 5. Starter Components (`src/components/ui/`)

All components use `cn()`, `class-variance-authority` for variants, and `hsl(var(--token))` CSS variables for color — no hardcoded hex values.

| File | Exports | Variants |
|---|---|---|
| `button.tsx` | `Button` | `default`, `destructive`, `outline`, `ghost`, `link` × `sm`, `default`, `lg`, `icon` |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | — |
| `badge.tsx` | `Badge` | `default`, `secondary`, `destructive`, `outline` |
| `input.tsx` | `Input` | — |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | — |

---

## 6. Coexistence Rules

- **Bootstrap classes** (`container`, `d-flex`, `btn`, `row`, etc.) — use as-is, unchanged
- **Tailwind utilities** (`flex`, `gap-4`, `text-sm`, `rounded`, etc.) — use freely in new components
- **shadcn components** — use via `import { Button } from '@/components/ui/button'`
- **`cn()` helper** — use whenever mixing Tailwind utilities with conditional logic
- **No mixing** Bootstrap component classes and shadcn component classes on the same element — they have conflicting margin/padding/border assumptions

---

## 7. What Is NOT Changed

- `next.config.ts` — unchanged
- `postcss.config.mjs` — unchanged (already correct for Tailwind v4)
- `/public/css/` files — untouched
- Existing components — no modifications needed; Tailwind utilities already worked via postcss, they just had no theme tokens before

---

## File Change Summary

| File | Action |
|---|---|
| `src/app/globals.css` | Add Tailwind imports + shadcn `@layer base` + container override |
| `src/lib/utils.ts` | Create — `cn()` helper |
| `components.json` | Create — shadcn CLI config |
| `src/components/ui/button.tsx` | Create |
| `src/components/ui/card.tsx` | Create |
| `src/components/ui/badge.tsx` | Create |
| `src/components/ui/input.tsx` | Create |
| `src/components/ui/dialog.tsx` | Create |
| `package.json` | Add 6 runtime dependencies |
