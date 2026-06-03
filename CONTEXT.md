# Task Scheduler Context

## Purpose

This workflow pulls open tasks from ClickUp and existing events from Google Calendar, then generates a time-blocked weekly schedule. Time blocks are split into realistic chunks and added to Google Calendar, scheduling around events the user has marked as busy.

The goal is to reduce context-switching by batching similar or related tasks into shared work windows, and to spread large tasks across multiple days in manageable blocks.

---

## How the Workflow Operates

This workflow has two parts: data collection handled by API scripts, and schedule generation handled by AI.

### Part 1: Data Collection (scripts/API calls)

These steps are performed by integration scripts, not by Claude:

1. Fetch all open tasks assigned to the authenticated user from ClickUp -- including task name, description, time estimate, priority, list, and due date. Tasks are pulled across all lists in the workspace.
2. Fetch the current week's events from Google Calendar -- including event title, start/end time, and whether the event is marked busy.
3. Save both exports to the input folder for the current run.

### Part 2: Schedule Generation (AI)

When given a command in the form "generate schedule for [week]" or "run task scheduler":

1. Read `task-scheduler/rules/scheduling-rules.md`.
2. Read `task-scheduler/rules/chunking-rules.md`.
3. Read `task-scheduler/rules/priority-rules.md`.
4. Read the tasks input file for the current run.
5. Read the calendar input file for the current run.
6. Identify all busy blocks from the calendar data.
7. Identify available working time slots around the busy blocks.
8. Apply chunking rules to split tasks into time blocks.
9. Apply priority and due date rules to order tasks.
10. Apply batching logic to group related or similar tasks into shared windows.
11. Generate the schedule output files.

Do not generate a schedule if the tasks input or calendar input file is missing. Stop and report what is missing.

---

## Folder Structure

Each schedule run uses a dated folder organized by year and ISO week number.

```
task-scheduler/
  CONTEXT.md                           This file
  rules/
    scheduling-rules.md                Working hours, block limits, buffer time, scheduling horizon
    chunking-rules.md                  How to split tasks by size, minimum/maximum block lengths
    priority-rules.md                  How priority and due dates affect scheduling order and urgency
  schedules/
    [YYYY-WW]/                         Example: 2026-23
      input/
        tasks.json                     ClickUp task export for this run
        calendar.json                  Google Calendar busy events for this week
      output/
        schedule.md                    Human-readable schedule plan for review
        time-blocks.json               Structured time block data ready for Calendar API import
```

---

## Input File Formats

### tasks.json

Each task should include at minimum:

```json
[
  {
    "id": "task_id",
    "name": "Task name",
    "description": "Optional description",
    "list": "List or project name",
    "priority": "urgent | high | normal | low",
    "time_estimate": 14400000,
    "due_date": "2026-06-07",
    "tags": []
  }
]
```

Time estimates are in milliseconds (ClickUp default). Convert to hours for scheduling.

### calendar.json

Each event should include at minimum:

```json
[
  {
    "id": "event_id",
    "title": "Event title",
    "start": "2026-06-03T09:00:00",
    "end": "2026-06-03T10:00:00",
    "status": "busy | free | tentative"
  }
]
```

Only events with status `busy` are treated as unavailable blocks. Events with status `free` or `tentative` are treated as available unless the rules say otherwise.

---

## Output File Formats

### schedule.md

A human-readable plan organized by day. Each block should include:

- Day and date
- Time range
- Task name(s) being worked on in that block
- Block duration
- Which chunk of the total estimate this represents (e.g., Chunk 2 of 3)
- Any batching notes (e.g., grouped with another task)

### time-blocks.json

Structured data for the calendar import script. Each entry represents one calendar event to be created:

```json
[
  {
    "title": "Task name (2 of 3)",
    "start": "2026-06-03T13:00:00",
    "end": "2026-06-03T15:00:00",
    "description": "Task ID: abc123 | Block 2 of 3 | Remaining after this block: 4h",
    "color": "optional -- based on priority or list"
  }
]
```

---

## Scheduling Goals

- Spread large tasks across multiple days rather than stacking them.
- Batch related or same-list tasks into shared windows where possible.
- Respect all busy calendar blocks.
- Prefer morning slots for high-priority or deadline-sensitive tasks when available.
- Do not schedule blocks shorter than the minimum defined in chunking-rules.md.
- Do not schedule blocks longer than the maximum defined in chunking-rules.md.
- Leave buffer time between blocks as defined in scheduling-rules.md.
- Do not schedule past the end of the defined scheduling horizon.

---

## Review and Import Step

After generating the schedule:

1. Review `schedule.md` and confirm the plan is reasonable.
2. If changes are needed, note them and regenerate or manually edit `time-blocks.json`.
3. Once approved, run the calendar import script to POST each entry in `time-blocks.json` to Google Calendar.

Do not import to Google Calendar without reviewing `schedule.md` first.

---

## Rules Files

Read these before generating any schedule:

- `task-scheduler/rules/scheduling-rules.md` -- working hours, scheduling window, buffer rules
- `task-scheduler/rules/chunking-rules.md` -- how tasks are split into blocks by size
- `task-scheduler/rules/priority-rules.md` -- task ordering, urgency, and deadline handling
