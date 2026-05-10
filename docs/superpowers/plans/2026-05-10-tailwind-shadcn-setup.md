# Tailwind v4 + shadcn/ui Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Tailwind CSS v4 utilities and shadcn/ui (Button, Card, Badge, Input, Dialog) into the project alongside existing Bootstrap CSS, with NapsGear brand colors as the shadcn theme.

**Architecture:** Import only Tailwind's theme tokens and utilities (no preflight) so Bootstrap's reset remains the sole page-level reset. A `@theme` block bridges shadcn's `--primary`/`--background` CSS variables to Tailwind v4's `--color-*` token system so utility classes like `bg-primary` resolve correctly. All five shadcn components live in `src/components/ui/` and are only active when explicitly imported.

**Tech Stack:** Tailwind CSS v4, `@tailwindcss/postcss`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add 6 runtime deps |
| `src/app/globals.css` | Modify | Tailwind imports, @theme bridge, shadcn CSS vars, container suppression |
| `components.json` | Create | shadcn CLI config |
| `src/lib/utils.ts` | Create | `cn()` helper (clsx + tailwind-merge) |
| `src/lib/utils.test.ts` | Create | Unit tests for `cn()` |
| `src/components/ui/button.tsx` | Create | Button with variants |
| `src/components/ui/card.tsx` | Create | Card compound component |
| `src/components/ui/badge.tsx` | Create | Badge with variants |
| `src/components/ui/input.tsx` | Create | Styled input element |
| `src/components/ui/dialog.tsx` | Create | Modal dialog via Radix |
| `src/app/ui-test/page.tsx` | Create | Smoke-test page (delete after verification) |

---

## Task 1: Install packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the 6 runtime dependencies**

```bash
cd /c/Users/azemc/OneDrive/Documents/Github/napsgear-v1
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-label
```

Expected output: packages added, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify installed**

```bash
node -e "require('./node_modules/clsx'); require('./node_modules/tailwind-merge'); require('./node_modules/class-variance-authority'); console.log('all ok')"
```

Expected: `all ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add clsx, tailwind-merge, cva, radix-ui deps for shadcn"
```

---

## Task 2: Update globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Tailwind imports at the very top of globals.css**

Open `src/app/globals.css`. The file currently starts with:
```css
/* bare reset — all styles come from public/css/ */
```

Prepend these two lines **before** that comment:

```css
@import "tailwindcss/theme" layer(tw-theme);
@import "tailwindcss/utilities" layer(tw-utilities);
```

Result — the top of the file should now be:
```css
@import "tailwindcss/theme" layer(tw-theme);
@import "tailwindcss/utilities" layer(tw-utilities);

/* bare reset — all styles come from public/css/ */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
```

- [ ] **Step 2: Add the @theme bridge block**

After the imports and before the existing reset comment, insert the `@theme` block. This maps shadcn's `--primary` etc. CSS variables to Tailwind v4's `--color-*` token system so utilities like `bg-primary` resolve to the right colour.

Add this block directly after the two `@import` lines:

```css
@theme {
  --color-background:          hsl(var(--background));
  --color-foreground:          hsl(var(--foreground));
  --color-primary:             hsl(var(--primary));
  --color-primary-foreground:  hsl(var(--primary-foreground));
  --color-secondary:           hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted:               hsl(var(--muted));
  --color-muted-foreground:    hsl(var(--muted-foreground));
  --color-accent:              hsl(var(--accent));
  --color-accent-foreground:   hsl(var(--accent-foreground));
  --color-destructive:         hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border:              hsl(var(--border));
  --color-input:               hsl(var(--input));
  --color-ring:                hsl(var(--ring));
  --radius: 0.375rem;
}
```

- [ ] **Step 3: Add shadcn CSS variables block**

After the existing `.icon-sprite` and `.product-image` rules, insert:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    --primary: 201 100% 40%;
    --primary-foreground: 0 0% 100%;

    --secondary: 0 100% 72%;
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

- [ ] **Step 4: Suppress Tailwind's .container utility**

After the `@layer base` block, add:

```css
@utility container {
  /* Bootstrap's .container is used sitewide — Tailwind's version is intentionally a no-op */
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: activate Tailwind v4 utilities + add shadcn CSS variable theme (NapsGear brand)"
```

---

## Task 3: Create components.json

**Files:**
- Create: `components.json` (project root)

- [ ] **Step 1: Create the file**

Create `components.json` at the project root with this exact content:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
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

- [ ] **Step 2: Commit**

```bash
git add components.json
git commit -m "feat: add components.json for shadcn CLI"
```

---

## Task 4: Create `cn()` utility + tests

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('drops undefined and null', () => {
    expect(cn('foo', undefined, null as unknown as undefined, 'bar')).toBe('foo bar')
  })

  it('merges conflicting Tailwind classes — last wins', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })

  it('handles conditional object syntax', () => {
    expect(cn('base', { active: true, inactive: false })).toBe('base active')
  })

  it('returns empty string with no inputs', () => {
    expect(cn()).toBe('')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL (utils.ts does not exist yet)**

```bash
cd /c/Users/azemc/OneDrive/Documents/Github/napsgear-v1
pnpm test
```

Expected: test fails with `Cannot find module './utils'` or similar.

- [ ] **Step 3: Create `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test
```

Expected output:
```
✓ src/lib/utils.test.ts (5)
  ✓ cn > joins plain class names
  ✓ cn > drops undefined and null
  ✓ cn > merges conflicting Tailwind classes — last wins
  ✓ cn > handles conditional object syntax
  ✓ cn > returns empty string with no inputs
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts src/lib/utils.test.ts
git commit -m "feat: add cn() utility with clsx + tailwind-merge"
```

---

## Task 5: Button component

**Files:**
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: Create `src/components/ui/button.tsx`**

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-md px-8',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /c/Users/azemc/OneDrive/Documents/Github/napsgear-v1
pnpm exec tsc --noEmit
```

Expected: no errors related to `button.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: add shadcn Button component"
```

---

## Task 6: Card component

**Files:**
- Create: `src/components/ui/card.tsx`

- [ ] **Step 1: Create `src/components/ui/card.tsx`**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border bg-background text-foreground shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: add shadcn Card component"
```

---

## Task 7: Badge component

**Files:**
- Create: `src/components/ui/badge.tsx`

- [ ] **Step 1: Create `src/components/ui/badge.tsx`**

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat: add shadcn Badge component"
```

---

## Task 8: Input component

**Files:**
- Create: `src/components/ui/input.tsx`

- [ ] **Step 1: Create `src/components/ui/input.tsx`**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat: add shadcn Input component"
```

---

## Task 9: Dialog component

**Files:**
- Create: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Create `src/components/ui/dialog.tsx`**

```tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat: add shadcn Dialog component"
```

---

## Task 10: Smoke-test page + visual verification

**Files:**
- Create: `src/app/ui-test/page.tsx` (temporary — delete after verification)

- [ ] **Step 1: Create the smoke-test page**

Create `src/app/ui-test/page.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function UITestPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">UI Component Test</h1>

        {/* Buttons */}
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Input */}
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Input</h2>
          <Input placeholder="Type something..." className="max-w-sm" />
        </section>

        {/* Card */}
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Card</h2>
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>NapsGear</CardTitle>
              <CardDescription>The largest marketplace for pharmaceuticals.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Card body content goes here. Renders with brand colours from CSS variables.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Existing Bootstrap classes — verify no regression */}
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Bootstrap coexistence</h2>
          <div className="d-flex gap-3">
            <span className="badge bg-primary">Bootstrap badge</span>
            <span className="badge bg-secondary">Bootstrap secondary</span>
            <button className="btn btn-primary btn-sm">Bootstrap button</button>
          </div>
        </section>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Open the page in the browser**

Navigate to `http://localhost:3000/ui-test` (dev server must be running — `pnpm dev`).

Verify:
- All Button variants render with correct NapsGear blue (`#0089cb`) for default variant
- Destructive variant renders red
- Badges show correct colors
- Input has a visible border and focus ring
- Card has a border and subtle shadow
- **Critically:** Bootstrap `btn btn-primary` and `badge bg-primary` in the coexistence section still render correctly (no regression)
- No console errors

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass including `src/lib/utils.test.ts`.

- [ ] **Step 4: Delete the smoke-test page**

```bash
rm -rf src/app/ui-test
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Tailwind v4 + shadcn/ui setup with NapsGear brand theme"
```

---

## Self-Review Notes

- All 6 packages from spec are installed in Task 1 ✓
- globals.css changes are split into 4 explicit steps — imports, @theme bridge, CSS vars, container suppression ✓
- `@theme` bridge (Task 2, Step 2) is not in the original spec but is required for Tailwind v4 to resolve `bg-primary` to the CSS variable — added here to close the gap ✓
- All 5 components match the spec's variant/export list ✓
- `cn()` has 5 unit tests covering the key behaviours ✓
- Smoke-test page verifies both new components AND Bootstrap regression ✓
- TypeScript is checked after each component ✓
- Every task ends with a commit ✓
