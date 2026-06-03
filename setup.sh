#!/usr/bin/env bash
# One-time setup for task-scheduler.
# Safe to run again — existing values are kept unless you enter new ones.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"
ENV_FILE="$SCRIPTS_DIR/.env"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
fail() { echo -e "${RED}✗${NC}  $*"; }
step() { echo -e "\n${BOLD}$*${NC}"; }

echo ""
echo -e "${BOLD}=== Task Scheduler Setup ===${NC}"
echo ""

# ── 1. Node.js ──────────────────────────────────────────────────────────────

step "Checking Node.js..."

if ! command -v node &>/dev/null; then
  fail "Node.js is not installed."
  echo "     Download it from: https://nodejs.org  (version 18 or higher)"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js 18 or higher is required. You have $(node --version)."
  echo "     Download a newer version from: https://nodejs.org"
  exit 1
fi

ok "Node.js $(node --version)"

# ── 2. Dependencies ──────────────────────────────────────────────────────────

step "Installing dependencies..."
cd "$SCRIPTS_DIR"
npm install --silent
ok "Dependencies installed"

# ── 3. API keys ──────────────────────────────────────────────────────────────

step "Configuring API keys..."
echo ""

# Read a key from .env, returning empty string if not set
get_env() {
  local key="$1"
  if [ -f "$ENV_FILE" ]; then
    grep "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '\r'
  fi
}

# Prompt for a value. If current is set, show placeholder and allow skipping.
ask() {
  local label="$1"
  local current="$2"
  local hint="${3:-}"
  local val

  if [ -n "$current" ]; then
    read -r -p "  $label [already set, press Enter to keep]: " val
  else
    if [ -n "$hint" ]; then
      echo "  $hint"
    fi
    read -r -p "  $label: " val
  fi

  if [ -n "$val" ]; then
    echo "$val"
  else
    echo "$current"
  fi
}

echo "  Where to get each key is shown below each prompt."
echo ""

CUR_ANTHROPIC=$(get_env ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=$(ask "Anthropic API key" "$CUR_ANTHROPIC" \
  "  → console.anthropic.com › API Keys")

echo ""

CUR_MODEL=$(get_env CLAUDE_MODEL)
CUR_MODEL="${CUR_MODEL:-claude-haiku-4-5}"
echo "  Models: claude-haiku-4-5 (fast, cheap) · claude-sonnet-4-6 (balanced) · claude-opus-4-8 (most capable)"
CLAUDE_MODEL=$(ask "Claude model [default: claude-haiku-4-5]" "$CUR_MODEL")
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-haiku-4-5}"

echo ""

CUR_CLICKUP=$(get_env CLICKUP_TOKEN)
CLICKUP_TOKEN=$(ask "ClickUp personal API token" "$CUR_CLICKUP" \
  "  → app.clickup.com › Settings › Apps › API Token")

echo ""

CUR_TEAM=$(get_env CLICKUP_TEAM_ID)
CLICKUP_TEAM_ID=$(ask "ClickUp workspace ID (optional — leave blank if you have only one workspace)" "$CUR_TEAM")

echo ""

CUR_STATUSES=$(get_env CLICKUP_STATUSES)
CUR_STATUSES="${CUR_STATUSES:-Open,In Progress}"
CLICKUP_STATUSES=$(ask "ClickUp statuses to schedule (comma-separated) [default: Open,In Progress]" "$CUR_STATUSES")
CLICKUP_STATUSES="${CLICKUP_STATUSES:-Open,In Progress}"

echo ""

CUR_CAL=$(get_env GOOGLE_CALENDAR_ID)
CUR_CAL="${CUR_CAL:-primary}"
GOOGLE_CALENDAR_ID=$(ask "Google Calendar ID to add blocks to [default: primary]" "$CUR_CAL")
GOOGLE_CALENDAR_ID="${GOOGLE_CALENDAR_ID:-primary}"

echo ""

CUR_BUSY=$(get_env BUSY_CALENDARS)
CUR_BUSY="${CUR_BUSY:-primary}"
echo "  Paste calendar IDs from Google Calendar › Settings › [calendar name] › Calendar ID."
echo "  Separate multiple calendars with commas. Include any calendar with meetings or personal events."
BUSY_CALENDARS=$(ask "Calendars to check for conflicts (comma-separated) [default: primary]" "$CUR_BUSY")
BUSY_CALENDARS="${BUSY_CALENDARS:-primary}"

echo ""

CUR_COLOR=$(get_env SCHEDULE_BLOCK_COLOR)
CUR_COLOR="${CUR_COLOR:-7}"
echo "  Calendar block colors: 1 Lavender · 2 Sage · 3 Grape · 4 Flamingo · 5 Banana"
echo "                         6 Tangerine · 7 Peacock · 8 Graphite · 9 Blueberry · 10 Basil · 11 Tomato"
SCHEDULE_BLOCK_COLOR=$(ask "Block color ID [default: 7 = Peacock]" "$CUR_COLOR")
SCHEDULE_BLOCK_COLOR="${SCHEDULE_BLOCK_COLOR:-7}"

# Write .env
cat > "$ENV_FILE" <<EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
CLAUDE_MODEL=$CLAUDE_MODEL
CLICKUP_TOKEN=$CLICKUP_TOKEN
CLICKUP_TEAM_ID=$CLICKUP_TEAM_ID
CLICKUP_STATUSES=$CLICKUP_STATUSES
GOOGLE_CALENDAR_ID=$GOOGLE_CALENDAR_ID
BUSY_CALENDARS=$BUSY_CALENDARS
SCHEDULE_BLOCK_COLOR=$SCHEDULE_BLOCK_COLOR
EOF

echo ""
ok ".env saved"

# ── 4. Google credentials ─────────────────────────────────────────────────────

step "Google Calendar credentials..."
echo ""

CREDS_FILE="$SCRIPTS_DIR/credentials.json"

if [ -f "$CREDS_FILE" ]; then
  ok "credentials.json already present"
else
  echo "  You need an OAuth credentials file from Google Cloud to allow calendar access."
  echo ""
  echo "  Steps:"
  echo "    1. Go to https://console.cloud.google.com"
  echo "    2. Create or select a project"
  echo "    3. Search for and enable the Google Calendar API"
  echo "    4. Go to APIs & Services › Credentials"
  echo "    5. Click Create Credentials › OAuth client ID"
  echo "    6. Choose Application type: Desktop app"
  echo "    7. Click Create, then Download JSON"
  echo "    8. Rename the downloaded file to credentials.json"
  echo "    9. Move it into the scripts/ folder of this project"
  echo ""
  read -r -p "  Press Enter once credentials.json is in place (Ctrl+C to exit and come back later): "

  if [ ! -f "$CREDS_FILE" ]; then
    fail "credentials.json not found at scripts/credentials.json"
    echo "     Run setup.sh again after adding the file."
    exit 1
  fi

  ok "credentials.json found"
fi

# ── 5. Google OAuth flow ──────────────────────────────────────────────────────

step "Authorizing Google Calendar access..."
echo ""

TOKEN_FILE="$SCRIPTS_DIR/token.json"

if [ -f "$TOKEN_FILE" ]; then
  ok "Google Calendar already authorized"
else
  echo "  A URL will appear below. Copy it and open it in your browser."
  echo "  Sign in with your Google account and click Allow."
  echo "  This terminal will complete automatically once you authorize."
  echo ""
  cd "$SCRIPTS_DIR"
  node fetch-calendar.js
  echo ""
  ok "Google Calendar authorized and this week's events fetched"
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}=== Setup complete ===${NC}"
echo ""
echo "  Run this each week to update your calendar:"
echo ""
echo -e "    ${BOLD}./run.sh${NC}"
echo ""
