# PROJECT.md — NCRP 2.0 Overview

## Purpose

NCRP 2.0 — e-FIR Jan-Sahayak is a citizen-first redesign of India's cybercrime reporting experience. Primary objectives:

- Simplify cybercrime reporting with plain-language guided flow
- Support 10 Indian languages with graceful fallback
- Extract transaction details (UTR, amount, VPA) from raw text and screenshots
- Provide evidence integrity via client-side SHA-256 hashing
- Offer simulated e-Pramaan digital signing
- Give IOs real-time case visibility with AI-assisted review
- Generate structured dossier PDFs for law enforcement
- Educate citizens about trending scams

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3 |
| Backend | Express 4, Mongoose 8, Socket.io 4, TypeScript 5 |
| Database | MongoDB (default: `mongodb://localhost:27017/ncrp2`) |
| PDF | pdfkit (with Noto Sans for ₹ Unicode support) |
| Validation | Zod |
| File Upload | Multer (memory storage) |
| Real-time | Socket.io (bidirectional) |
| Security | Helmet, express-rate-limit, CORS, JWT |
| AI | Heuristic engine (built-in) / OpenAI GPT-4o-mini (optional) |
| Browser APIs | Web Crypto (SHA-256), Web Speech (dictation), MediaRecorder |

## Key Dependencies

**Backend** (`backend/package.json`):
- express, mongoose, socket.io, jsonwebtoken, pdfkit, zod, multer, cors, helmet, express-rate-limit, dotenv, image-size

**Frontend** (`frontend/package.json`):
- next, react, react-dom, socket.io-client

**Root** (`package.json`):
- concurrently (for dev server orchestration)

## Development Commands

| Command | What it does |
|---|---|
| `./run.sh` | Install deps, copy env, start MongoDB, seed DB, start dev servers |
| `npm run install:all` | Install root + backend + frontend deps |
| `npm run dev` | Start backend (:4000) + frontend (:3000) concurrently |
| `npm run dev:backend` | Start only backend |
| `npm run dev:frontend` | Start only frontend |
| `npm run seed` | Seed MongoDB with synthetic demo data |
| `npm run build` | Production build (backend tsc + frontend next build) |
| `npm run typecheck` | TypeScript check both projects |

## Access Points

| Service | URL |
|---|---|
| Citizen Portal | http://localhost:3000 |
| IO Command Center | http://localhost:3000/hq |
| API Server | http://localhost:4000/api |
| MongoDB | mongodb://localhost:27017/ncrp2 |
| Health check | http://localhost:4000/healthz |
