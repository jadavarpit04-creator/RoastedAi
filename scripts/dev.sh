#!/bin/bash

# Get the project root directory (one level up from scripts/)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

bun install --frozen-lockfile 2>/dev/null || bun install
bun run db:push 2>/dev/null

# Keep the dev server alive - auto restart on crash
while true; do
  NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/next dev -p 3000
  RET=$?
  echo "[dev.sh] Server exited with code $RET, restarting in 2s..."
  sleep 2
done
