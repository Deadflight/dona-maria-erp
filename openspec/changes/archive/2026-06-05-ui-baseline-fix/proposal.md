# Proposal: ui-baseline-fix (CORRECTED v2)

## Intent

Fix the shadcn CSS infrastructure so all installed components (Button, Card, Dialog, Input, Label, Select, Table) render with proper colors, animations, and dark-mode support. The current `globals.css` is missing ~25 CSS variables that every shadcn component references, breaking visual rendering across ALL pages.

## Validated Facts

- **Preset**: `b2fA` (nova style, neutral theme, Geist font)
- **Tailwind**: v4, **iconLibrary**: lucide
- **Style layer**: base-nova via **@base-ui/react** (NOT Radix UI)
- **Installed**: button, card, dialog, input, label, select, table
- **To install**: badge, textarea, skeleton, alert
- **Animations**: `tw-animate-css` v1.4.0 in package.json, NOT imported in globals.css
- **Dark mode**: Missing — no `.dark` variant, no dark CSS variables

## Scope

### In Scope
- Restructure `app/globals.css` — add `@import "tw-animate-css"`, `@custom-variant dark`, all 18 `--color-*` tokens + `--radius-*` in `@theme inline`, plus both `:root` / `.dark` blocks with OKLCH values
- Install missing shadcn components: badge, textarea, skeleton, alert
- Refactor `product-table.tsx` — replace inline `<span>` badge with `<Badge>`, import `cn()` from `@/lib/utils`, fix `border-primary` → `ring-1 ring-primary/30`, replace viewer notice with `<Alert>`, fix icon `data-icon` attributes
- Refactor `product-form-dialog.tsx` — replace `<textarea>` with `<Textarea>`, fix `space-y-4` → `flex flex-col gap-4`, fix `space-y-1.5` → `flex flex-col gap-1.5`, add `data-icon` on RotateCcw
- Refactor `loading.tsx` — replace `animate-pulse` divs with `<Skeleton>` components matching table structure

### Out of Scope
- NOT refactoring entire app to FieldGroup/Field (needs Field component + major refactor)
- NOT changing auth page or dashboard layout
- NOT adding dark mode toggle UI (infrastructure only — inactive until `.dark` class applied)
- NOT changing functionality or business logic
- NOT refactoring other inline `cn()` usages outside products

## Capabilities

### New Capabilities
None — pure infrastructure/refactor, no spec-level behavior changes.

### Modified Capabilities
None — no existing specs are affected.

## Approach

1. **globals.css**: Replace current content with full shadcn scaffold. Structure: `@import "tailwindcss"` → `@import "tw-animate-css"` → `@custom-variant dark` → `@theme inline { /* all color+radius tokens */ }` → `:root { /* light OKLCH values */ }` → `.dark { /* dark OKLCH values */ }`. Preserve existing brand colors (--color-brand-primary: #0A2D69, --color-brand-accent: #D29F25) in @theme inline.
2. **Install components**: `npx shadcn@latest add badge textarea skeleton alert -y`
3. **product-table.tsx**: Replace inline `<span>` badge with `<Badge variant="outline">`. Import `cn` from `@/lib/utils`, remove local `cn()`. Fix `border-primary` → `border-border ring-1 ring-primary/30`. Replace viewer notice div with `<Alert>` component. Fix icon attributes to use `data-icon="inline-start"`.
4. **product-form-dialog.tsx**: Replace `<textarea>` with `<Textarea>`. Replace `space-y-4` with `flex flex-col gap-4`. Replace `space-y-1.5` with `flex flex-col gap-1.5`. Add `data-icon="inline-start"` to RotateCcw icon.
5. **loading.tsx**: Replace `animate-pulse` divs with `<Skeleton>` components matching exact dimensions. Replace native `<table>` with proper `<Table>` structure.
6. **Visual verification**: Run dev server, check products page (list + form), dashboard.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/globals.css` | **Modified** | Full restructure — shadcn vars, animations, dark variant, brand colors |
| `components/ui/badge.tsx` | **New** | Badge component for status indicators |
| `components/ui/textarea.tsx` | **New** | Textarea for description field |
| `components/ui/skeleton.tsx` | **New** | Skeleton for loading placeholders |
| `components/ui/alert.tsx` | **New** | Alert component for viewer notice + error banner |
| `app/(dashboard)/products/_components/product-table.tsx` | **Modified** | Badge, cn(), border-primary, viewer notice, icons |
| `app/(dashboard)/products/_components/product-form-dialog.tsx` | **Modified** | Textarea, space-y→gap, icons |
| `app/(dashboard)/products/loading.tsx` | **Modified** | Skeleton components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSS variable changes affect ALL pages, not just products | Medium | Manual visual check on main pages (dashboard, products) after fix |
| Dark mode `.dark` class replaces `@media prefers-color-scheme: dark` — won't auto-activate | Low | Intentional — infra-only; toggle UI is deferred. Stays inactive until theme provider added |
| `npx shadcn@latest add` may overwrite customizations if components already exist | Low | Components don't exist yet; first install |
| shadcn CLI may fail if `components.json` is misconfigured | Low | `components.json` verified present with correct `style: "new-york"` |

## Rollback Plan

- **Git revert**: `git revert <sha>` — each file change is self-contained
- **CSS-only rollback**: `git checkout HEAD~1 -- app/globals.css`
- **Component rollback**: `git checkout HEAD~1 -- components/ui/`
- **Product files rollback**: `git checkout HEAD~1 -- app/\(dashboard\)/products/`

## Dependencies

- `tw-animate-css` v1.4.0 already in `package.json`
- `npx shadcn@latest` CLI available
- `lucide-react` already in `package.json` (iconLibrary)
- No external API or service changes

## Success Criteria

- [ ] `globals.css` declares all 18 `--color-*` tokens + `--radius-*` under `@theme inline`, `:root`, and `.dark`
- [ ] Dialog open/close animates (requires `tw-animate-css` import)
- [ ] Status column uses `<Badge>` with correct variant styling
- [ ] Description field uses `<Textarea>` with correct focus/error states
- [ ] Loading page uses `<Skeleton>` matching table dimensions
- [ ] `border-primary` no longer references undefined CSS variable
- [ ] Viewer notice rendered with `<Alert>` component (no raw Tailwind colors)
- [ ] Icons use `data-icon="inline-start"` attribute (no manual size classes)
- [ ] Form uses `flex flex-col gap-4` instead of `space-y-4`
- [ ] No undefined CSS variable warnings in browser console
