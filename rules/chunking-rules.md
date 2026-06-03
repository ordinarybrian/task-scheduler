# Chunking Rules

## Purpose

Use this file to govern how tasks are split into time blocks and how related tasks are batched into shared work windows.

The goal is to create blocks that are long enough to be productive but short enough to stay realistic across a week, and to reduce context-switching by grouping related work.

---

## Time Estimate Conversion

ClickUp exports time estimates in milliseconds. Convert to hours before applying any chunking logic.

Conversion: divide milliseconds by 3,600,000.

Examples:
- 3,600,000 ms = 1 hour
- 7,200,000 ms = 2 hours
- 14,400,000 ms = 4 hours
- 28,800,000 ms = 8 hours

If a task has no time estimate, apply the default estimate defined in the No Estimate Rule section below.

---

## Minimum Block Size

The minimum block size is 30 minutes.

Do not create blocks shorter than 30 minutes. If a task estimate is less than 30 minutes, round up to 30 minutes.

If multiple small tasks are batched together into a shared window, each task contributes to the total block duration. The combined block must still meet the 30-minute minimum.

---

## Maximum Block Size

The maximum block size is 3 hours.

Do not create a single block longer than 3 hours. Tasks with estimates longer than 3 hours must be split into multiple blocks.

If a task estimate is exactly 3 hours or less, it can be scheduled as a single block.

---

## Chunking by Estimate Size

Apply these rules based on the task's total time estimate:

### Under 1 hour
Schedule as a single block. Do not split.

### 1 to 3 hours
Schedule as a single block. Do not split unless no slot of sufficient length is available, in which case split into two blocks and note the reason.

### 3 to 6 hours
Split into 2 blocks. Aim for roughly equal block sizes. Prefer placing blocks on different days unless the task has a deadline that requires same-day or next-day completion.

Example: a 5-hour task becomes a 2.5-hour block and a 2.5-hour block.

### 6 to 9 hours
Split into 3 blocks. Distribute across at least 2 days. Aim for blocks of 2 to 3 hours each.

Example: an 8-hour task becomes a 3-hour block, a 3-hour block, and a 2-hour block.

### Over 9 hours
Split into 4 or more blocks. Distribute across at least 3 days. No single block should exceed 3 hours. Note the total estimate and the number of blocks in the schedule output.

If the total estimate would require more blocks than the week can accommodate, apply priority rules and schedule as many blocks as possible. List the remaining hours under "Could Not Schedule This Week."

---

## No Estimate Rule

If a task has no time estimate, apply a default estimate of 1 hour.

Note in the schedule output that the estimate was defaulted. Flag the task so the user knows to review it.

Do not skip tasks with no estimate.

---

## Batching Logic

Batching means placing blocks for two or more tasks into the same work window so the user can switch between them during that time.

Apply batching when:

- Two or more tasks belong to the same ClickUp list or project.
- Two or more tasks share tags that suggest related work.
- Two or more tasks are both small (under 1.5 hours each) and would benefit from being grouped rather than scattered.

Batching rules:

- A batched block should not exceed 3 hours total.
- A batched block should include no more than 3 tasks.
- Each task in a batched block should have its individual time allocation noted in the schedule.
- Do not batch tasks from unrelated lists or projects unless they are both small and no better grouping is available.

Example of a batched block:

```
Tuesday 10:00 AM - 12:00 PM (2 hours)
Tasks: Task A (1h) + Task B (1h)
Both from: Client Website project
```

---

## Block Title Format

Each block in `time-blocks.json` should use this title format:

For a single task: `[Task Name] ([chunk] of [total])`
Example: `Write Homepage Copy (1 of 2)`

For a batched block: `[List/Project Name]: [Task A] + [Task B]`
Example: `Client Website: Write Homepage Copy + Review Sitemap`

If a task is a single unchunked block, omit the chunk notation:
Example: `Write Meta Descriptions`

---

## Rounding

Round all block durations to the nearest 15 minutes.

Examples:
- 1 hour 10 minutes → 1 hour 15 minutes
- 2 hours 40 minutes → 2 hours 45 minutes
- 50 minutes → 1 hour (due to 30-minute minimum floor)

---

## Quality Check

Before finalizing chunks, confirm that:

- All time estimates have been converted from milliseconds to hours.
- No block is shorter than 30 minutes.
- No block is longer than 3 hours.
- Tasks over 3 hours have been split into multiple blocks.
- Tasks over 9 hours are distributed across at least 3 days.
- Tasks with no estimate have been defaulted to 1 hour and flagged.
- Batched blocks contain related tasks and do not exceed 3 hours or 3 tasks.
- Block titles follow the defined format.
- All durations are rounded to the nearest 15 minutes.
