# FRONTEND.md — Frontend Architecture

## Framework

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript 5**
- **Tailwind CSS 3**

## Route Map

All routes defined in `frontend/src/app/`:

| Path | File | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page |
| `/report` | `report/page.tsx` | Complaint wizard (5 steps) |
| `/track` | `track/page.tsx` | Complaint tracking |
| `/hq` | `hq/page.tsx` | IO Command Center (JWT auth) |
| `/protect` | `protect/page.tsx` | Suspect check + report |
| `/learn` | `learn/page.tsx` | Learning corner |
| `/learn/[slug]` | `learn/[slug]/page.tsx` | Individual learning article |
| `/volunteers` | `volunteers/page.tsx` | Cyber volunteer signup |
| `/contact` | `contact/page.tsx` | Contact I4C / officer directory |
| `/about` | `about/page.tsx` | About I4C |
| `/help` | `help/page.tsx` | Help & support |
| `/privacy` | `privacy/page.tsx` | Privacy policy |
| `/terms` | `terms/page.tsx` | Terms of use |
| `/accessibility` | `accessibility/page.tsx` | Accessibility statement |

## Layout

**Root layout** (`frontend/src/app/layout.tsx`):
- Inter + Noto Sans Devanagari fonts
- `<I18nProvider>` wraps entire app
- `<ToastProvider>` for notifications
- `<GlobalListeners>` for Socket.io listeners
- `<a>` skip-to-content link

## Component Architecture

### Layout Components
- **GovHeader** (`components/layout/GovHeader.tsx`): Sticky navbar with Ashoka Emblem, nav links, language selector, mobile menu
- **Footer** (`components/layout/Footer.tsx`): 4-column footer with internal + external links, demo notice, IO login link

### Landing Page Components
- **StartReportingCta** (`components/landing/StartReportingCta.tsx`): Hero CTA card with assurances
- **Emergency1930** (`components/landing/Emergency1930.tsx`): Financial fraud emergency banner
- **ServiceCard** (`components/landing/ServiceCard.tsx`): Reusable service link card
- **SuspectCheck** (`components/landing/SuspectCheck.tsx`): Suspect search widget with results

### UI Primitives
- **Card** (`components/ui/Card.tsx`): Base container with border, shadow, background
- **Badge** (`components/ui/Card.tsx`): Status/category labels with tone variants
- **StatusBadge** (`components/ui/Card.tsx`): Complaint status indicator
- **Button** (`components/ui/Button.tsx`): Variants: primary, secondary, ghost, outlineDanger, saffron; Sizes: sm, md, lg, xl
- **SectionHeading** (`components/ui/Misc.tsx`): Consistent section headers
- **Skeleton** (`components/ui/Misc.tsx`): Loading placeholder
- **EmptyState** (`components/ui/Misc.tsx`): Empty state display
- **ReadinessPanel** (`components/ui/Misc.tsx`): Complaint readiness progress bar + checklist

## State Management

- **No Redux/Zustand/Context** for global state
- **useState/useEffect** per-component
- **Incident state** in report wizard: maintained in component, persisted to backend at each step via PATCH
- **Socket.io** for real-time: singleton in `frontend/src/lib/socket.ts`
- **localStorage**: only for i18n language preference

## API Client

**File**: `frontend/src/lib/api.ts`
- Centralized fetch wrapper
- `api.get<T>(path)`, `api.post<T>(path, body)`, `api.patch<T>(path, body)`
- `ApiError` class with `code`, `message`, `status`
- Base URL from `API_URL` env (default: `http://localhost:4000/api`)

## Key Libraries

| Library | Purpose |
|---|---|
| `socket.io-client` | Real-time Socket.io |
| `react` / `react-dom` | UI framework |
| `next` | Framework + routing |
| `tailwindcss` | Styling |
| `@/lib/hash` | Client-side SHA-256 via Web Crypto |
| `@/lib/speech` | Web Speech API + MediaRecorder fallback |
| `@/lib/i18n` | 10-language i18n with React context |

## Responsive Behavior

- **Mobile-first** Tailwind design
- **Breakpoints**: `sm:` (640px), `lg:` (1024px), `xl:` (1280px)
- **Mobile nav**: Hamburger menu in GovHeader
- **Contact page**: Table on desktop, cards on mobile
- **Report wizard**: Full-width steps, stacked on mobile
