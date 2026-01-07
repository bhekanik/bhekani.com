# Style Guide

Extracted from project's actual styles. Keep consistent.

## Colors (CSS Variables)

### Light Mode
- Background: `hsl(var(--background))` - warm off-white (35 30% 95.7%)
- Foreground: `hsl(var(--foreground))` - near black
- Links: `hsl(var(--links))` - blue (200 98% 39%)
- Primary: `hsl(var(--primary))` - dark gray
- Muted: `hsl(var(--muted-foreground))` - medium gray

### Dark Mode
- Background: deep blue-gray (225 25% 15%)
- Links: lighter blue (199 95% 74%)
- Cards/surfaces: slightly lighter than bg

## Typography

### Font Families
- Headings: "Playfair Display Variable" (serif)
- Body: "Inter Variable" (sans)
- Code: "JetBrains Mono" (mono)
- Logo: Inter Variable

### Headings
- Weight: 700
- Line-height: 1.1
- Letter-spacing: -0.01em

### Body
- Line-height: 1.7
- Max-width: 80ch

## Spacing (CSS Variables)
- `--space-1` through `--space-16`
- Use consistently: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

## Border Radius
- sm: 0.25rem
- md: 0.5rem
- lg: 0.75rem
- xl: 1rem

## Shadows
- sm: subtle (0 1px 2px)
- md: medium (0 4px 6px)
- lg: pronounced (0 10px 15px)

## Transitions
- fast: 150ms
- base: 250ms
- slow: 350ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Links
- Color: `hsl(var(--links))`
- Underline offset: 2px
- Hover: background highlight
- Nav links: animated underline on hover

## Interactive Elements
- Buttons: lift on hover (-2px), press on active
- Cards: `.card-hover` class for lift effect
- Focus: 2px primary outline, 2px offset

## Accessibility
- Reduced motion: respects `prefers-reduced-motion`
- Focus visible styles defined
- Touch targets: 44px minimum

## Layout
- Main: max-width 80ch, centered
- Padding: 0 2rem 2rem
- Grid: header, page-header, main, footer
