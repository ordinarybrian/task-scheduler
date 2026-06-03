require('dotenv').config();

const fs   = require('fs').promises;
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { getISOWeek, getSchedulePaths } = require('./lib/week');

const RULES_DIR = path.join(__dirname, '..', 'rules');

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    schedule_md: { type: 'string' },
    time_blocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:       { type: 'string' },
          start:       { type: 'string' },
          end:         { type: 'string' },
          description: { type: 'string' },
          colorId:     { type: 'string' },
        },
        required: ['title', 'start', 'end', 'description'],
        additionalProperties: false,
      },
    },
  },
  required: ['schedule_md', 'time_blocks'],
  additionalProperties: false,
};

async function readRules() {
  const [scheduling, chunking, priority] = await Promise.all([
    fs.readFile(path.join(RULES_DIR, 'scheduling-rules.md'), 'utf8'),
    fs.readFile(path.join(RULES_DIR, 'chunking-rules.md'), 'utf8'),
    fs.readFile(path.join(RULES_DIR, 'priority-rules.md'), 'utf8'),
  ]);
  return { scheduling, chunking, priority };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in .env');
  }

  const week  = getISOWeek();
  const paths = getSchedulePaths(week);

  let tasks, calendar;
  try {
    tasks = JSON.parse(await fs.readFile(paths.tasksFile, 'utf8'));
  } catch {
    throw new Error(`tasks.json not found at:\n  ${paths.tasksFile}\nRun: npm run fetch-tasks`);
  }
  try {
    calendar = JSON.parse(await fs.readFile(paths.calendarFile, 'utf8'));
  } catch {
    throw new Error(`calendar.json not found at:\n  ${paths.calendarFile}\nRun: npm run fetch-calendar`);
  }

  const rules = await readRules();
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const systemPrompt = [
    'You are a scheduling assistant. Generate a time-blocked weekly schedule based on the provided tasks and calendar.',
    '',
    '## Scheduling Rules',
    rules.scheduling,
    '',
    '## Chunking Rules',
    rules.chunking,
    '',
    '## Priority Rules',
    rules.priority,
  ].join('\n');

  const userMessage = [
    `Generate a schedule for week ${week}. Today is ${today} and the current time is ${currentTime}.`,
    '',
    '## Open Tasks',
    JSON.stringify(tasks),
    '',
    '## Calendar Events (existing busy blocks)',
    JSON.stringify(calendar),
    '',
    'Return a JSON object with:',
    '- "schedule_md": the full schedule as a markdown document organized by day',
    '- "time_blocks": array of calendar events ready for import. For each block:',
    '    title: "[folder] task name (chunk N of M)" — use the task\'s folder field as the client label, e.g. "Acme Corp | Website Redesign (2 of 3)"',
    '    start: ISO 8601 local datetime',
    '    end: ISO 8601 local datetime',
    '    description: begin with the ClickUp task URL on its own line ("https://app.clickup.com/t/{task_id}"), then a blank line, then block details (block N of M, remaining estimate after this block)',
    '    colorId: optional string',
  ].join('\n');

  const client = new Anthropic();

  const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';

  console.log(`Contacting Claude (${model}) for week ${week}...`);

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: OUTPUT_SCHEMA,
      },
    },
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');

  let result;
  try {
    result = JSON.parse(textBlock.text);
  } catch (err) {
    throw new Error(`Failed to parse Claude response as JSON: ${err.message}`);
  }

  await fs.mkdir(paths.output, { recursive: true });
  await fs.writeFile(paths.scheduleFile, result.schedule_md);
  await fs.writeFile(paths.blocksFile, JSON.stringify(result.time_blocks, null, 2));

  console.log(`Schedule saved:     ${paths.scheduleFile}`);
  console.log(`Time blocks saved:  ${paths.blocksFile} (${result.time_blocks.length} block(s))`);

  const used = response.usage;
  if (used) {
    const cached = used.cache_read_input_tokens ?? 0;
    console.log(`Tokens: ${used.input_tokens} in, ${used.output_tokens} out${cached ? `, ${cached} from cache` : ''}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
