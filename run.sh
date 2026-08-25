#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
dim()  { printf '\033[2m%s\033[0m\n' "$1"; }

# 1. Dependencies -----------------------------------------------------------
if [ ! -d node_modules ] || [ ! -d backend/node_modules ] || [ ! -d frontend/node_modules ]; then
  bold "[1/4] Installing dependencies…"
  npm run install:all
else
  dim "[1/4] Dependencies present, skipping install."
fi

# 2. Environment ------------------------------------------------------------
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  dim "[2/4] Created backend/.env from example."
else
  dim "[2/4] backend/.env present."
fi

# 3. MongoDB ----------------------------------------------------------------
if command -v systemctl >/dev/null 2>&1 && ! systemctl is-active --quiet mongodb; then
  bold "[3/4] Starting MongoDB service…"
  sudo systemctl start mongodb || true
fi
dim "[3/4] MongoDB assumed reachable at mongodb://localhost:27017/ncrp2"

# 4. Seed + run -------------------------------------------------------------
bold "[4/4] Seeding database…"
npm run seed

bold "Starting servers:"
echo "  • Citizen portal : http://localhost:3000"
echo "  • IO Command Ctr : http://localhost:3000/hq   (io@ncrp.demo / JaiHind2026)"
echo "  • API            : http://localhost:4000/api"
echo ""
dim "e-Sign demo OTP is always 123456."
exec npm run dev
