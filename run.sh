#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"
cd "$SCRIPTS_DIR"

echo "=== Task Scheduler ==="
echo ""

echo "[1/3] Fetching tasks from ClickUp and calendar from Google..."
npm run fetch-all --silent

echo ""
echo "[2/3] Generating schedule..."
node generate-schedule.js

echo ""
echo "[3/3] Importing time blocks to Google Calendar..."
npm run import-blocks --silent

echo ""
echo "Done. Your calendar has been updated for this week."

# Remove schedule folders older than 30 days
SCHEDULES_DIR="$ROOT_DIR/schedules"
if [ -d "$SCHEDULES_DIR" ]; then
  REMOVED=$(find "$SCHEDULES_DIR" -maxdepth 1 -mindepth 1 -type d -mtime +30 -print -exec rm -rf {} + 2>/dev/null | wc -l | tr -d ' ')
  if [ "$REMOVED" -gt 0 ]; then
    echo "Cleaned up $REMOVED schedule folder(s) older than 30 days."
  fi
fi
