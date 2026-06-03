# Priority Rules

## Purpose

Use this file to govern how task priority, due dates, and urgency affect the order in which tasks are scheduled and how their blocks are placed across the week.

---

## Priority Levels

ClickUp uses four priority levels. Apply these scheduling rules for each:

### Urgent

Schedule the first block of every urgent task within the first two available working days.

If there are multiple urgent tasks, schedule them in due date order -- the task due soonest gets the earliest slot.

If two urgent tasks share the same due date, schedule the one with the larger time estimate first so the heavier task gets more runway.

Do not defer urgent tasks to later in the week unless the schedule has no available slots in the first two days.

### High

Schedule the first block of every high-priority task within the first three available working days.

High-priority tasks should not be pushed to Thursday or Friday unless urgent tasks and calendar constraints leave no earlier options.

### Normal

Schedule normal-priority tasks across the full available week. No front-loading required.

Distribute normal-priority tasks to fill available slots after urgent and high-priority tasks are placed.

### Low

Schedule low-priority tasks last, using remaining available slots after all other priorities are placed.

If the week does not have enough room for low-priority tasks, list them under "Could Not Schedule This Week." Do not displace higher-priority tasks to make room for low-priority ones.

---

## Due Date Rules

Due dates take precedence over priority level when there is a conflict.

If a normal-priority task is due tomorrow and an urgent task is due next Friday, schedule the normal-priority task first.

Apply these rules for due date handling:

### Due today or tomorrow
Treat as urgent regardless of the assigned priority level. Schedule the first block as early as possible today or tomorrow.

Flag the task in the schedule output with a note: "Due [date] -- treated as urgent."

### Due within the current week
Schedule all blocks for this task before the due date. If the task requires multiple blocks, distribute them so the final block is completed at least one day before the due date when possible.

### Due after the current week
Schedule according to priority level. No special urgency treatment required.

### No due date
Schedule according to priority level only.

---

## Ordering Tasks for Scheduling

When multiple tasks are ready to be placed, schedule them in this order:

1. Tasks due today, treated as urgent -- earliest slot available.
2. Tasks due tomorrow -- next available slots.
3. Urgent tasks ordered by due date, then by estimate size (larger first).
4. High-priority tasks ordered by due date, then by estimate size.
5. Normal-priority tasks with due dates this week, ordered by due date.
6. Normal-priority tasks with no due date or due dates after this week.
7. Low-priority tasks.

Within the same priority and due date tier, prefer placing larger tasks earlier in the week so they have more runway for their split blocks.

---

## Unschedulable Tasks

If a task cannot be scheduled within the current week due to time constraints:

- Do not skip it silently.
- List it under "Could Not Schedule This Week" in `schedule.md`.
- Include the task name, priority, due date, and total estimated hours.
- Note how many hours of the task could not be placed.

If an urgent or high-priority task cannot be fully scheduled, flag it clearly and recommend the user either reduce scope on other tasks or extend the scheduling horizon.

---

## Estimate-Free Tasks

Tasks with no time estimate should be scheduled as 1-hour blocks per the default in `chunking-rules.md`.

Apply priority and due date rules normally. Treat the 1-hour default as the full estimate for scheduling purposes.

---

## Conflicts Between Rules

If priority rules and chunking rules conflict -- for example, if an urgent task would need to be split but there is only one available slot long enough for part of it -- apply this resolution:

1. Schedule the largest possible block within the available slot.
2. Note the remaining hours as unscheduled for that task.
3. Continue placing other tasks.
4. At the end of scheduling, list the partial urgent task in the notes and flag it for the user.

Do not leave urgent tasks entirely unscheduled if any slot exists, even a short one.

---

## Quality Check

Before finalizing the schedule, confirm that:

- Urgent tasks have their first block within the first two available days.
- High-priority tasks have their first block within the first three available days.
- Tasks due today or tomorrow are treated as urgent and placed first.
- All task blocks for tasks with due dates this week are placed before the due date.
- Low-priority tasks are placed last and may be omitted if the week is full.
- Unschedulable tasks are listed clearly in the output with priority, due date, and unscheduled hours noted.
- Partial urgent tasks are flagged for user review.
