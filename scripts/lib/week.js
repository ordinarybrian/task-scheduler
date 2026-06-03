const path = require('path');

const WORKSPACE = path.join(__dirname, '../../..');

/**
 * Returns the ISO week string for a given date.
 * Format: YYYY-WW (e.g. 2026-23)
 */
function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns Monday 00:00 and Sunday 23:59 for the week containing the given date.
 */
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * Returns absolute file paths for all inputs and outputs for a given week.
 */
function getSchedulePaths(week) {
  const base = path.join(WORKSPACE, 'task-scheduler/schedules', week);
  return {
    base,
    input:        path.join(base, 'input'),
    output:       path.join(base, 'output'),
    tasksFile:    path.join(base, 'input',  'tasks.json'),
    calendarFile: path.join(base, 'input',  'calendar.json'),
    scheduleFile: path.join(base, 'output', 'schedule.md'),
    blocksFile:   path.join(base, 'output', 'time-blocks.json'),
  };
}

module.exports = { getISOWeek, getWeekBounds, getSchedulePaths };
