# Scheduling Rules

## Purpose

Use this file to govern how available time is identified, how the scheduling window is defined, and how blocks are placed within the week.

---

## Working Hours

Default working hours: 10:00 AM to 5:00 PM, Monday through Friday.

Total available time per day: 7 hours before subtracting busy calendar blocks and reserved time.

Do not schedule task blocks outside of working hours unless the input data or a user instruction explicitly overrides this.

---

## Scheduling Horizon

Schedule task blocks for the current week only (Monday through Friday of the current ISO week) unless the user specifies otherwise.

Do not schedule any task blocks that start before the current time. Past days are fully off-limits. For today, only schedule blocks that start at or after the current time — do not backfill earlier slots on today's date.

If the current week does not have enough available time to fit all tasks, do not extend into the following week automatically. Instead:

1. Schedule as many tasks as the current week allows, prioritizing by the rules in `priority-rules.md`.
2. List any tasks that could not be scheduled in the `schedule.md` output under a section called "Could Not Schedule This Week."
3. Note the total unscheduled hours so the user can decide whether to extend the horizon or defer tasks.

---

## Busy Block Handling

Read the `calendar.json` input and identify all events where status is `busy`.

Treat each busy block as unavailable for task scheduling. Do not place task blocks that overlap with any busy block, even partially.

Events marked `free` or `tentative` are treated as available unless a scheduling instruction says otherwise.

Add a buffer before and after each busy block as defined in the Buffer Time section below.

---

## Buffer Time

Leave a minimum of 15 minutes of buffer before and after each busy calendar event.

This buffer prevents task blocks from running directly into meetings or personal commitments.

Do not leave buffer at the start or end of the working day unless a busy event falls near those boundaries.

If two busy events are separated by less than 30 minutes, treat the entire gap as unavailable and do not attempt to insert a task block.

---

## Reserved Time

Reserve the following time windows as unavailable by default:

- 12:00 PM to 1:00 PM daily -- lunch break

If a busy calendar event already covers or overlaps the lunch window, do not double-count. Just ensure the window is unavailable.

---

## Maximum Scheduled Hours Per Day

Do not schedule more than 6 hours of task blocks in a single day.

This accounts for the lunch break, buffer time, and realistic daily capacity. Scheduling a full 8-hour day of task blocks is not realistic and should be avoided.

If a day has many busy events that reduce available time below 2 hours, do not attempt to schedule task blocks on that day. Mark it as low-availability in the schedule notes.

---

## Preferred Block Placement

When multiple open slots are available on a given day, prefer placing blocks in this order:

1. Morning slots (9:00 AM to 12:00 PM) for high-priority or deadline-sensitive tasks.
2. Early afternoon slots (1:00 PM to 3:00 PM) for normal-priority tasks.
3. Late afternoon slots (3:00 PM to 5:00 PM) for low-priority tasks or smaller wrap-up blocks.

Do not rigidly enforce this preference if the available slots do not align. Place blocks where they fit and note any deviations.

---

## Consecutive Block Limit

Do not schedule more than two consecutive task blocks without at least a 15-minute break between them.

If two blocks are placed back to back with no calendar event between them, insert a 15-minute gap between them.

---

## Day Distribution

Spread task blocks across the available days of the week rather than stacking all blocks on the first available days.

Aim for a roughly even daily load unless priority rules require front-loading urgent tasks.

If a task has a due date within the week, its blocks should be front-loaded to ensure completion before the deadline.

---

## Quality Check

Before finalizing the schedule, confirm that:

- No task block starts before the current time (past days fully excluded; today only uses slots at or after now).
- No task block overlaps with a busy calendar event.
- No task block falls outside working hours.
- Buffer time is respected around all busy events.
- Lunch is reserved daily.
- No day exceeds 6 hours of scheduled task blocks.
- Days with less than 2 hours of available time are marked low-availability and skipped.
- Tasks not fitting the current week are listed under "Could Not Schedule This Week."
- The schedule is readable and organized by day.
