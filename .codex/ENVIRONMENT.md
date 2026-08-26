# ENVIRONMENT.md — Runtime & Configuration

## Runtime Requirements

| Requirement | Version |
|---|---|
| Node.js | 18+ (recommended: 20 LTS) |
| npm | 9+ |
| MongoDB | 6+ (default port 27017) |
| OS | Linux, macOS, Windows (tested on Linux) |

## Optional

| Requirement | Purpose |
|---|---|
| Noto Sans fonts (`/usr/share/fonts/noto/`) | ₹ (U+20B9) rendering in PDFs |
| OpenAI API key | GPT classification, vision extraction, Whisper STT |
| Bhashini API key | Real multilingual translation |

## Backend Environment Variables

**File**: `backend/.env` (copy from `backend/.env.example`)

### Server
| Variable | Default | Required |
|---|---|---|
| `PORT` | `4000` | No |
| `NODE_ENV` | `development` | No |
| `CORS_ORIGIN` | `http://localhost:3000` | No |

### Database
| Variable | Default | Required |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/ncrp2` | Yes |

### AI
| Variable | Default | Required |
|---|---|---|
| `OPENAI_API_KEY` | _(empty)_ | No (heuristic fallback) |
| `OPENAI_MODEL` | `gpt-4o-mini` | No |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | No |

### Speech-to-Text
| Variable | Default | Required |
|---|---|---|
| `WHISPER_PROVIDER` | `auto` | No |
| `WHISPER_API_URL` | _(empty)_ | No |
| `WHISPER_API_KEY` | _(empty)_ | No |

Values for `WHISPER_PROVIDER`: `auto` | `openai` | `external` | `off`

### Translation
| Variable | Default | Required |
|---|---|---|
| `BHASHINI_ENABLED` | `false` | No |
| `BHASHINI_API_KEY` | _(empty)_ | No |
| `BHASHINI_API_URL` | _(empty)_ | No |

### Government Integrations
| Variable | Default | Required |
|---|---|---|
| `CFCFRMS_MODE` | `mock` | No |
| `CFCFRMS_API_URL` | _(empty)_ | No |
| `EPRAMAAN_MODE` | `mock` | No |
| `EPRAMAAN_API_URL` | _(empty)_ | No |
| `CEIR_MODE` | `mock` | No |
| `CEIR_API_URL` | _(empty)_ | No |
| `TAFCOP_MODE` | `mock` | No |
| `TAFCOP_API_URL` | _(empty)_ | No |

### Security
| Variable | Default | Required |
|---|---|---|
| `JWT_SECRET` | `ncrp2-local-demo-secret` | Yes (change in prod) |
| `OFFICER_DEMO_EMAIL` | `io@ncrp.demo` | Yes |
| `OFFICER_DEMO_PASSWORD` | `JaiHind2026` | Yes |

### Uploads
| Variable | Default | Required |
|---|---|---|
| `MAX_UPLOAD_MB` | `10` | No |
| `UPLOAD_DIR` | `uploads` | No |

## Frontend Environment Variables

| Variable | Default | Required |
|---|---|---|
| `API_URL` | `http://localhost:4000/api` | No |

Referenced in `frontend/src/lib/api.ts` as `API_URL`.

## Startup Commands

```bash
# Full setup + run
./run.sh

# Individual
npm run install:all        # Install all deps
cp backend/.env.example backend/.env
npm run seed               # Seed database
npm run dev                # Start dev servers
npm run build              # Production build
npm run typecheck          # TypeScript check
```

## Backend Scripts

```bash
cd backend
npm run dev          # tsx watch (hot reload)
npm run build        # tsc compilation
npm run start        # Run compiled JS
npm run seed         # Seed database
npm run typecheck    # Type check
npm run selftest     # Integration self-test
```

## Frontend Scripts

```bash
cd frontend
npm run dev          # Next.js dev server on :3000
npm run build        # Production build
npm run start        # Production server on :3000
npm run typecheck    # Type check
npm run lint         # ESLint
```
