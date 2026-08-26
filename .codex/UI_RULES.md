# UI_RULES.md — Design System Constraints

## Color Palette

Defined in `frontend/tailwind.config.ts` and `frontend/src/app/globals.css`:

| Token | Value | Usage |
|---|---|---|
| `navy` | `#1e3a5f` | Primary brand color, CTAs, links |
| `navy-deep` | `#162d4a` | Darker navy (hover states, gradients) |
| `navy-tint` | `#e8f0f8` | Light navy background |
| `navy-border` | `#3d6a8f` | Navy border accents |
| `navy-soft` | `#5a8ab5` | Disabled navy |
| `saffron` | `#e67e22` | Accent, trending badges, warnings |
| `saffron-deep` | `#cc6b1a` | Darker saffron |
| `saffron-tint` | `#fdf3e8` | Light saffron background |
| `ink` | `#1a1a2e` | Primary text |
| `ink-soft` | `#4a5568` | Secondary text |
| `ink-faint` | `#9ca3af` | Tertiary text, placeholders |
| `surface` | `#ffffff` | Card backgrounds |
| `paper` | `#f8f9fa` | Page background |
| `line` | `#e2e8f0` | Borders |
| `line-strong` | `#cbd5e1` | Stronger borders |
| `ok` | `#16a34a` | Success |
| `warn` | `#d97706` | Warning |
| `danger` | `#dc2626` | Error, danger |

## Typography

- **Font**: Inter (body), Noto Sans Devanagari (Hindi)
- **Sizes**: `text-2xs` (10px), `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px)
- **Weights**: `font-medium` (500), `font-semibold` (600), `font-bold` (700)

## Spacing

- **Section margins**: `mt-14` (56px) between major sections
- **Card padding**: `p-4` to `p-6` depending on card type
- **Component gaps**: `gap-2` to `gap-4` for grids

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 12px | Cards, major containers |
| `rounded-control` | 8px | Buttons, inputs, smaller containers |

## Shadows

| Token | Usage |
|---|---|
| `shadow-card` | Default card elevation |
| `shadow-raised` | Hover state elevation |

## Design Principles

1. **Government-service professionalism**: Clean, authoritative, trustworthy
2. **Calm tone**: No alarming language, no jargon, no blame
3. **Plain language**: "Describe it like you'd tell a friend"
4. **Reusability**: Use existing Card, Badge, Button, SectionHeading components
5. **No random colors**: Stick to the defined palette
6. **Responsive**: Mobile-first, works on all screen sizes
7. **Accessible**: WCAG AA contrast ratios, keyboard navigable

## Component Patterns

### Cards
```tsx
<Card className="p-5">          // Standard card
<Card className="border-warn/25 bg-warn-tint/50 p-5">  // Warning card
<Card className="border-navy/20 bg-gradient-to-br from-navy to-navy-deep p-5 text-white">  // Featured card
```

### Badges
```tsx
<Badge tone="ok">Active</Badge>           // Green
<Badge tone="warn">Warning</Badge>        // Amber
<Badge tone="danger">Critical</Badge>     // Red
<Badge tone="info">Info</Badge>           // Navy
<Badge tone="neutral">Neutral</Badge>     // Gray
<Badge tone="saffron">Trending</Badge>    // Orange
```

### Buttons
```tsx
<Button variant="primary">Submit</Button>     // Navy bg
<Button variant="ghost">Cancel</Button>       // Text only
<Button variant="saffron">Call 1930</Button>  // Saffron bg
<Button size="sm">Small</Button>              // Compact
<Button size="xl">Large CTA</Button>          // Hero CTA
```

## Ashoka Emblem

- **Asset**: `mockdata/emblem_logo.webp` (copied to `frontend/public/emblem_logo.webp`)
- **Usage**: `<img src="/emblem_logo.webp" className="h-9 w-9 shrink-0 object-contain" />` in GovHeader
- **Do not** replace with SVG or different image without user approval

## Navbar

- Sticky header with navy border-bottom
- Left: Ashoka Emblem + "NCRP 2.0" text
- Center/Right: Nav links (Report, Protect, Learn, Contact, Help)
- Language selector (dropdown)
- Mobile: Hamburger menu

## Footer

- 4-column grid on desktop, 2-column on mobile
- Columns: Report & Track, Stay Safe, Government Services, About
- Bottom: Demo notice, IO login link
- External links open in new tab with `rel="noopener noreferrer"`
