require('dotenv').config();

const fs                             = require('fs').promises;
const { google }                     = require('googleapis');
const { getAuthClient }              = require('./lib/auth');
const { getISOWeek, getWeekBounds, getSchedulePaths } = require('./lib/week');

const BUSY_CALENDARS = (process.env.BUSY_CALENDARS || process.env.GOOGLE_CALENDAR_ID || 'primary')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function normalizeEvent(event, calendarId) {
  const start = event.start?.dateTime ?? event.start?.date;
  const end   = event.end?.dateTime   ?? event.end?.date;

  // Google Calendar uses 'transparency' for busy/free
  // opaque (default, or absent) = busy | transparent = free
  const status = event.transparency === 'transparent' ? 'free' : 'busy';

  return {
    id:         event.id,
    title:      event.summary || '(no title)',
    start,
    end,
    status,
    calendarId,
  };
}

async function fetchFromCalendar(calendar, calendarId, timeMin, timeMax) {
  const res = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy:      'startTime',
  });

  return (res.data.items || [])
    .filter(e => e.status !== 'cancelled')
    .map(e => normalizeEvent(e, calendarId));
}

async function main() {
  const auth     = await getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const week               = getISOWeek();
  const { monday, sunday } = getWeekBounds();

  console.log(`Fetching calendar events for week ${week}...`);
  console.log(`  Range: ${monday.toDateString()} to ${sunday.toDateString()}`);
  console.log(`  Calendars: ${BUSY_CALENDARS.join(', ')}`);

  const timeMin = monday.toISOString();
  const timeMax = sunday.toISOString();

  const results = await Promise.all(
    BUSY_CALENDARS.map(id => fetchFromCalendar(calendar, id, timeMin, timeMax))
  );

  // Merge and deduplicate by event ID (same event can appear on multiple calendars)
  const seen   = new Set();
  const events = results.flat().filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Sort by start time after merging
  events.sort((a, b) => (a.start > b.start ? 1 : -1));

  const busyCount = events.filter(e => e.status === 'busy').length;
  const freeCount = events.filter(e => e.status === 'free').length;

  const paths = getSchedulePaths(week);
  await fs.mkdir(paths.input, { recursive: true });
  await fs.writeFile(paths.calendarFile, JSON.stringify(events, null, 2));

  console.log(`\nSaved ${events.length} event(s) (${busyCount} busy, ${freeCount} free) to: ${paths.calendarFile}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
