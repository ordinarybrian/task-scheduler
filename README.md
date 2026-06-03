# Task Scheduler

**Version 1.1.0**

Automatically builds a time-blocked weekly schedule from your ClickUp tasks and Google Calendar, then adds the blocks directly to your calendar.

**What it does, in order:**
1. Pulls your open ClickUp tasks — name, estimate, priority, due date, and client folder
2. Pulls existing events from every calendar you specify
3. Uses AI to generate a schedule that works around your meetings, respects priorities, and spreads work evenly across the week
4. Adds each block to Google Calendar with the client name in the title and a direct link to the ClickUp task in the notes

---

## Requirements

- [Node.js](https://nodejs.org) version 18 or higher
- A ClickUp account with tasks assigned to you
- A Google Calendar account
- An [Anthropic API key](https://console.anthropic.com)

---

## Install Node.js

Node.js is the runtime that powers the scripts in this project. You only need to install it once.

1. Go to [nodejs.org](https://nodejs.org)
2. Click the **LTS** download button (the left one — LTS means Long Term Support and is the stable version)
3. Open the downloaded file and follow the installer steps
4. When it's done, close and re-open your terminal, then confirm it worked:

```bash
node --version
```

It should print a version number starting with `v18` or higher. If it does, you're ready to continue.

---

## Download the project

1. Go to the GitHub repository page
2. Click the green **Code** button near the top right
3. Click **Download ZIP**
4. Unzip the downloaded file — this creates the `task-scheduler` folder
5. Open **Terminal** and navigate into the folder:

```bash
cd ~/Downloads/task-scheduler
```

If you moved the folder somewhere else, replace `~/Downloads/task-scheduler` with the actual path. All commands in this guide should be run from inside the `task-scheduler` folder.

---

## Setup

### Step 1 — Gather your credentials

Work through each item below before running any commands.

---

#### Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Go to **API Keys** and click **Create Key**
4. Copy the key — you will not be able to see it again

---

#### ClickUp API token

1. Log in to ClickUp
2. Click your avatar in the bottom-left corner
3. Go to **Settings → Apps**
4. Under **API Token**, click **Generate** (or copy your existing token)

---

#### ClickUp workspace ID _(optional)_

Only needed if your ClickUp account has more than one workspace.

1. Go to [app.clickup.com](https://app.clickup.com)
2. Click your workspace name in the top-left
3. Go to **Settings → Workspace Settings**
4. Copy the **Workspace ID** from the URL or settings page

Leave this blank if you only have one workspace.

---

#### Google Calendar credentials file

This is a one-time step that allows the tool to read and write your Google Calendar.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. In the search bar, search for **Google Calendar API** and click **Enable**
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth client ID**
6. Set Application type to **Desktop app**, give it any name, and click **Create**
7. Click **Download JSON** on the confirmation screen
8. Rename the downloaded file to `credentials.json`
9. Move it into the `scripts/` folder of this project

---

#### Calendar IDs

You need two things:

- **The calendar where new blocks will be added** — usually `primary`
- **All calendars to check for conflicts** — include every calendar that has meetings or personal events

To find a calendar ID:
1. Open [Google Calendar](https://calendar.google.com) on desktop
2. In the left sidebar, hover over a calendar name and click the **⋮** menu
3. Click **Settings**
4. Scroll to **Integrate calendar** and copy the **Calendar ID**

Your main calendar ID is just `primary`. Others look like `abc123@group.calendar.google.com` or `yourname@gmail.com`.

Write down the ID for every calendar you want checked for conflicts.

---

#### ClickUp task statuses

The scheduler only pulls tasks in the statuses you specify. The defaults are `Open` and `In Progress`.

To check your status names: open any ClickUp list and look at the column headers across the top. Status names are case-sensitive.

---

### Step 2 — Create your .env file

1. Unzip the downloaded file:
   - Open **Finder**
   - In the left sidebar, click **Downloads**
   - Find the `task-scheduler.zip` file and double-click it — this creates a `task-scheduler` folder in the same location

2. Move the `task-scheduler` folder to Documents:
   - With the `task-scheduler` folder still visible in Downloads, drag it into **Documents** in the left sidebar

3. Open **Terminal** (press `Cmd + Space`, type `Terminal`, and hit Enter)

4. Navigate to the `task-scheduler` folder:

```bash
cd ~/Documents/task-scheduler
```

5. Paste this entire block into the terminal and press Enter. It will prompt you for each value and write `scripts/.env` automatically.

```bash
read -rp "Anthropic API key: " _ANTHROPIC
read -rp "ClickUp API token: " _CLICKUP_TOKEN
read -rp "ClickUp workspace ID (blank if you have one workspace): " _CLICKUP_TEAM
read -rp "ClickUp statuses to schedule [Open,In Progress]: " _STATUSES
read -rp "Claude model [claude-haiku-4-5]: " _MODEL
read -rp "Calendar ID to add blocks to [primary]: " _CAL_ID
read -rp "Calendar IDs to check for conflicts — comma-separated [primary]: " _BUSY
read -rp "Block color ID 1–11 [7 = Peacock blue]: " _COLOR

cat > scripts/.env << EOF
ANTHROPIC_API_KEY=${_ANTHROPIC}
CLAUDE_MODEL=${_MODEL:-claude-haiku-4-5}
CLICKUP_TOKEN=${_CLICKUP_TOKEN}
CLICKUP_TEAM_ID=${_CLICKUP_TEAM}
CLICKUP_STATUSES=${_STATUSES:-Open,In Progress}
GOOGLE_CALENDAR_ID=${_CAL_ID:-primary}
BUSY_CALENDARS=${_BUSY:-primary}
SCHEDULE_BLOCK_COLOR=${_COLOR:-7}
EOF

echo "scripts/.env created."
```

To update a single value later, run the matching command:

```bash
# Examples — replace the value after the = sign
sed -i '' 's/^CLAUDE_MODEL=.*/CLAUDE_MODEL=claude-sonnet-4-6/' scripts/.env
sed -i '' 's/^BUSY_CALENDARS=.*/BUSY_CALENDARS=primary,work@company.com/' scripts/.env
sed -i '' 's/^CLICKUP_STATUSES=.*/CLICKUP_STATUSES=Open,In Progress,Review/' scripts/.env
```

---

### Step 3 — Run setup

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, and hit Enter)

2. Navigate to the `task-scheduler` folder:

```bash
cd ~/Documents/task-scheduler
```

3. Run the setup script:

```bash
./setup.sh
```

This will:
- Confirm Node.js is installed
- Install dependencies
- Verify your `.env` file
- Open a browser-based Google authorization flow — a URL will appear in the terminal, open it, sign in with your Google account, and click Allow

Setup only needs to be run once. If you re-run it later, your existing values are kept unless you type new ones.

---

## Weekly use

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, and hit Enter)

2. Navigate to the `task-scheduler` folder:

```bash
cd ~/Documents/task-scheduler
```

3. Run the scheduler:

```bash
./run.sh
```

---

## Running automatically with cron

Cron is a built-in Mac scheduler that can run the script for you automatically each week — no manual steps required after setup.

**Step 1 — Open Terminal and navigate to the project folder**

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, and hit Enter)
2. Navigate to the `task-scheduler` folder:

```bash
cd ~/Documents/task-scheduler
```

**Step 2 — Generate your cron lines**

Run these two commands one at a time. Each one will print a line of output — you'll copy that output in the next step.

```bash
echo "PATH=$(dirname $(which node)):/usr/bin:/bin"
```

```bash
echo "0 7 * * 1 $(pwd)/run.sh >> $(pwd)/scheduler.log 2>&1"
```

After running both, you should see two lines printed in the terminal. Select and copy both lines.

**Step 3 — Open your crontab**

Run this command to open the cron scheduler file:

```bash
crontab -e
```

This opens a text editor called **vim** directly in the terminal. It can look unfamiliar — follow these steps exactly:

1. Press `i` on your keyboard to enter edit mode (you'll see `-- INSERT --` at the bottom)
2. Paste the two lines you copied (the PATH line must come first)
3. Press `Escape` to exit edit mode
4. Type `:wq` and press Enter to save and close

The scheduler is now active. It will run every Monday at 7:00 AM automatically.

**To check the log after a run:**

```bash
cat scheduler.log
```

**Adjusting the schedule** — the five fields before the command are `minute hour day day-of-month month day-of-week`:

| When | Cron expression |
|---|---|
| Monday at 7:00 AM | `0 7 * * 1` |
| Monday at 6:30 AM | `30 6 * * 1` |
| Sunday at 8:00 PM | `0 20 * * 0` |

---

## Customizing the scheduling rules

Edit the files in `rules/` to change how the schedule is built. Changes take effect on the next run.

| File | Controls |
|---|---|
| `scheduling-rules.md` | Working hours, buffer time around meetings, lunch break, max hours per day |
| `chunking-rules.md` | How tasks are split into blocks — minimum and maximum block lengths |
| `priority-rules.md` | How urgency, priority level, and due dates affect ordering |

---

## Configuration reference

All settings live in `scripts/.env`. Use the `sed` command pattern from Step 2 to update any value without opening the file.

### Claude model

| Value | Speed | Cost | Notes |
|---|---|---|---|
| `claude-haiku-4-5` | Fast | $ | Default |
| `claude-sonnet-4-6` | Medium | $$ | Better for complex or large task lists |
| `claude-opus-4-8` | Slower | $$$$ | Most capable |

### Task statuses

`CLICKUP_STATUSES` — comma-separated, must match ClickUp status names exactly (case-sensitive):

```
CLICKUP_STATUSES=Open,In Progress,Review
```

### Conflict calendars

`BUSY_CALENDARS` — comma-separated calendar IDs. Any busy event on any of these blocks that slot:

```
BUSY_CALENDARS=primary,work@company.com,abc123@group.calendar.google.com
```

### Block color

`SCHEDULE_BLOCK_COLOR` — color applied to every scheduled block in Google Calendar:

| ID | Color | ID | Color |
|---|---|---|---|
| 1 | Lavender | 7 | Peacock (default) |
| 2 | Sage | 8 | Graphite |
| 3 | Grape | 9 | Blueberry |
| 4 | Flamingo | 10 | Basil |
| 5 | Banana | 11 | Tomato |
| 6 | Tangerine | | |

---

## Changelog

### 1.1.0
- No-past-day scheduling: blocks can only be placed on today or future days
- Reduced prompt token count: stripped unused fields from tasks and calendar, compacted JSON serialization
- Fixed `model` variable initialization error in generate-schedule.js

### 1.0.0
- Initial release
