# CHANGE_RULES.md — Rules for Safe Modifications

**READ THIS FILE BEFORE MAKING ANY CODE CHANGE.**

## General Rules

1. **Inspect before modifying**: Read the existing implementation fully before changing it. Use `grep` and `glob` to find all references.

2. **Do not rewrite working features**: If a feature works, do not refactor it unless explicitly asked.

3. **Reuse existing components**: Check `frontend/src/components/` before creating new ones. Use Card, Badge, Button, SectionHeading, etc.

4. **Preserve API contracts**: Do not change endpoint signatures, request/response shapes, or field names without updating all consumers.

5. **Preserve database schema**: Do not add/remove/rename fields in Mongoose models unless explicitly required. Existing seed data depends on current schema.

6. **Never overwrite valid data with placeholders**: If AI extraction produced a valid UTR, do not replace it with an empty string or "—" when the citizen submits.

7. **Persist before navigating**: When workflow data (UTR, amount, VPA, category) is extracted or entered, it MUST be saved to the backend before the user advances to the next step.

8. **No duplicate implementations**: If a function/service/component already exists, use it. Do not create a second version.

9. **Test the full flow**: After changing shared state or data flow, test the complete complaint lifecycle from landing page to dossier PDF.

10. **Do not introduce hardcoded mock data into production workflows**: Keep mockdata utilities isolated in `mockdata/` and test endpoints.

11. **Never expose secrets**: Do not log API keys, passwords, tokens, or database credentials. Do not commit `.env` files.

12. **Do not change unrelated UI**: Only modify the specific component/section requested. Do not redesign surrounding elements.

## Data Flow Rules

### The Canonical Source of Truth

When a value is extracted or generated during the complaint workflow, it must have a clearly defined canonical source of truth:

```
EXTRACTION → COMPLAINT STATE → API PAYLOAD → BACKEND → DATABASE → NEXT PAGE → IO DESK → PDF
```

**Example for UTR:**
1. AI/heuristic extracts UTR from narrative
2. Displayed in Step 02 (citizen can edit)
3. PATCH `/api/incidents/:id` with `transaction.utr`
4. Backend merges into `incident.financial_transactions[]`
5. Saved to MongoDB
6. Available in Step 03 review, Step 05 submission
7. Visible in IO Desk case review
8. Rendered in dossier PDF

**Critical rule**: Never patch only the final UI. Always trace back to the canonical state.

### Transaction Source Priority

When updating transactions:
1. If citizen-source transaction exists → merge into it (citizen overrides)
2. Else if AI-source transaction exists → merge into it
3. Else → create new transaction with `source: "citizen"`

## PDF Rules

- **Never assume browser font rendering = PDF rendering**: Always verify generated PDFs visually.
- **Verify Unicode**: After any PDF text change, verify ₹ (U+20B9) renders correctly.
- **Page breaks**: Always call `checkPageBreak(doc, neededHeight)` before content blocks.
- **Image placement**: Always advance `doc.y` after `doc.image()`.
- **Footer**: Always place using `doc.y`, never hardcoded page positions.

## UI Rules

- **Do not introduce components that look unrelated** to the existing design system.
- **Use existing tokens**: `navy`, `saffron`, `ink`, `surface`, etc. — not random hex colors.
- **Reuse existing components**: Card, Badge, Button, SectionHeading — not custom divs.
- **Maintain responsive layouts**: Test both mobile and desktop.
- **Preserve accessibility**: ARIA labels, keyboard navigation, contrast ratios.

## Security Rules

- **Never commit secrets**: API keys, passwords, tokens go only in `.env` (git-ignored).
- **Never bypass authentication**: Officer endpoints require JWT validation.
- **Never log sensitive data**: PII, API keys, database credentials.
- **Validate all inputs**: Use Zod schemas in `backend/src/validators/`.

## Testing Rules

- **Run `npm run typecheck`** after TypeScript changes.
- **Run `npm run build`** after significant changes.
- **Test complaint flow**: Create complaint → upload evidence → verify extraction → submit → check IO desk → generate dossier.
- **Test both roles**: Citizen portal + IO Command Center.
- **Test responsive**: Desktop + mobile layouts.

## File Modification Checklist

Before modifying any file:
- [ ] Read the full file first
- [ ] Check all imports that reference this file
- [ ] Check all files that import from this file
- [ ] Understand the data flow through this file
- [ ] Make the minimal change needed
- [ ] Verify no regressions in related features
- [ ] Run typecheck/build

## Forbidden Actions

- Do not delete `mockdata/` files
- Do not remove seed data entries without explicit instruction
- Do not change Socket.io event names without updating both sides
- Do not modify `backend/.env.example` variable names
- Do not change API route paths (`/api/incidents`, etc.)
- Do not remove existing UI components from the design system
- Do not change the Ashoka Emblem without explicit instruction
