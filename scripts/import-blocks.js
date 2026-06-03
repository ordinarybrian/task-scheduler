require('dotenv').config();

const fs                        = require('fs').promises;
const { google }                = require('googleapis');
const { getAuthClient }         = require('./lib/auth');
const { getISOWeek, getSchedulePaths } = require('./lib/week');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Default color for scheduled task blocks.
// Google Calendar color IDs:
//   1 Lavender  2 Sage     3 Grape    4 Flamingo  5 Banana
//   6 Tangerine 7 Peacock  8 Graphite 9 Blueberry 10 Basil  11 Tomato
const DEFAULT_COLOR = process.env.SCHEDULE_BLOCK_COLOR || '7'; // Peacock

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

async function createEvent(calendar, block) {
  const resource = {
    summary:     block.title,
    description: block.description || '',
    colorId:     block.colorId || DEFAULT_COLOR,
    start: { dateTime: block.start, timeZone: TIMEZONE },
    end:   { dateTime: block.end,   timeZone: TIMEZONE },
  };

  const res = await calendar.events.insert({ calendarId: CALENDAR_ID, resource });
  return res.data;
}

async function main() {
  const week  = getISOWeek();
  const paths = getSchedulePaths(week);

  let blocks;
  try {
    const raw = await fs.readFile(paths.blocksFile, 'utf8');
    blocks = JSON.parse(raw);
  } catch {
    throw new Error(
      `time-blocks.json not found at:\n  ${paths.blocksFile}\n` +
      'Run schedule generation first and approve the schedule.md before importing.'
    );
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.log('No blocks to import.');
    return;
  }

  console.log(`Importing ${blocks.length} time block(s) to Google Calendar...`);
  console.log(`  Week:     ${week}`);
  console.log(`  Calendar: ${CALENDAR_ID}`);
  console.log(`  Timezone: ${TIMEZONE}\n`);

  const auth     = await getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  let created = 0;
  let failed  = 0;
  const failures = [];

  for (const block of blocks) {
    try {
      const event = await createEvent(calendar, block);
      console.log(`  [ok] ${block.title}`);
      created++;
    } catch (err) {
      console.error(`  [fail] ${block.title} -- ${err.message}`);
      failures.push({ title: block.title, error: err.message });
      failed++;
    }
  }

  console.log(`\nDone. ${created} created, ${failed} failed.`);

  if (failures.length > 0) {
    console.log('\nFailed blocks:');
    failures.forEach(f => console.log(`  - ${f.title}: ${f.error}`));
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
