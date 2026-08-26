# NCRP 2.0 — Codex Project Context

This directory contains structured documentation for the NCRP 2.0 (e-FIR Jan-Sahayak) project. It is designed to give AI coding agents a complete understanding of the codebase before making changes.

## What Is This Project?

A citizen-first prototype of India's National Cyber Crime Reporting Portal, built for the **Build What Moves India Hackathon**. It pairs a guided citizen complaint experience with an Investigating-Officer command center, connected by real-time Socket.io events, AI extraction, and simulated government integrations.

## Where Things Live

| Path | What |
|---|---|
| `frontend/` | Next.js 14 App Router, React 18, Tailwind CSS |
| `backend/` | Express 4, Mongoose 8, Socket.io, pdfkit |
| `mockdata/` | Sample evidence images, emblem logo, officer directory data |
| `run.sh` | One-command setup + launch |
| `WORKING.md` | Judge-facing walkthrough |

## Recommended Reading Order

1. **PROJECT.md** — What the project is, tech stack, commands
2. **ARCHITECTURE.md** — System diagram, directory responsibilities
3. **FLOWS.md** — Complete complaint lifecycle (CRITICAL)
4. **FEATURES.md** — Feature inventory with file locations
5. **DATA_MODEL.md** — Database schemas and field definitions
6. **API_CONTRACTS.md** — Every endpoint with request/response shapes
7. **EVIDENCE_PIPELINE.md** — How evidence flows from upload to dossier
8. **PDF_SYSTEM.md** — PDF generation, Unicode ₹, fonts
9. **FRONTEND.md** — Frontend routes, components, state
10. **BACKEND.md** — Backend services, controllers, middleware
11. **TESTING.md** — How to test each feature
12. **MOCK_DATA.md** — Mock data and testing helpers
13. **UI_RULES.md** — Design system constraints
14. **SECURITY.md** — Security-sensitive areas
15. **ENVIRONMENT.md** — Environment variables, runtime versions
16. **KNOWN_ISSUES.md** — Pitfalls and past bugs
17. **CHANGE_RULES.md** — Rules for safe modifications (READ FIRST before any code change)

## Quick Reference: Start + Build

```bash
./run.sh                      # One-command: install, seed, start
npm run install:all            # Install all deps
npm run seed                   # Seed database
npm run dev                    # Start both servers (backend :4000 + frontend :3000)
npm run build                  # Production build
npm run typecheck              # TypeScript check both projects
```

## Critical Rules

- **READ `CHANGE_RULES.md` BEFORE MODIFYING ANY CODE**
- Do not rewrite working features unnecessarily
- Reuse existing components — check `frontend/src/components/` first
- Persist extracted data to the complaint state before navigating
- Never overwrite valid extracted data with placeholders
- Verify PDF output after any PDF-related change
- Run `npm run build` after significant changes
