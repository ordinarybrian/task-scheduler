require('dotenv').config();

const fs   = require('fs').promises;
const { getISOWeek, getSchedulePaths } = require('./lib/week');

const CLICKUP_BASE = 'https://api.clickup.com/api/v2';
const TOKEN        = process.env.CLICKUP_TOKEN;
const TEAM_ID_ENV  = process.env.CLICKUP_TEAM_ID || '';
const STATUSES     = (process.env.CLICKUP_STATUSES || 'Open,In Progress')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const PRIORITY_MAP = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' };

async function clickup(path) {
  const res = await fetch(`${CLICKUP_BASE}${path}`, {
    headers: { Authorization: TOKEN },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ClickUp API error ${res.status} for ${path}: ${body}`);
  }
  return res.json();
}

async function getAuthedUser() {
  const data = await clickup('/user');
  return data.user;
}

async function getTeamId() {
  if (TEAM_ID_ENV) return TEAM_ID_ENV;

  const data = await clickup('/team');
  const teams = data.teams || [];

  if (teams.length === 0) throw new Error('No ClickUp workspaces found for this token.');
  if (teams.length === 1) return teams[0].id;

  const list = teams.map(t => `  ${t.id}  ${t.name}`).join('\n');
  throw new Error(
    `Multiple ClickUp workspaces found. Add CLICKUP_TEAM_ID to .env with the one to use:\n${list}`
  );
}

async function fetchAssignedTasks(teamId, userId) {
  const all = [];
  let page  = 0;

  while (true) {
    const params = new URLSearchParams({
      'assignees[]':               userId,
      include_closed:              'false',
      subtasks:                    'true',
      include_markdown_description: 'false',
      page:                        String(page),
    });
    for (const status of STATUSES) {
      params.append('statuses[]', status);
    }

    const data = await clickup(`/team/${teamId}/task?${params}`);
    const tasks = data.tasks || [];
    all.push(...tasks);

    if (tasks.length < 100) break;
    page++;
  }

  return all;
}

function normalizeTask(task) {
  const priorityVal = task.priority?.priority;
  const priority = PRIORITY_MAP[priorityVal] ?? priorityVal ?? 'normal';

  return {
    id:            task.id,
    name:          task.name,
    list:          task.list?.name || '',
    folder:        task.folder?.name || '',
    priority,
    time_estimate: task.time_estimate ?? null,
    due_date:      task.due_date
      ? new Date(Number(task.due_date)).toISOString().split('T')[0]
      : null,
    tags: (task.tags || []).map(t => t.name),
  };
}

async function main() {
  if (!TOKEN) throw new Error('CLICKUP_TOKEN is not set in .env');

  const user   = await getAuthedUser();
  const teamId = await getTeamId();

  console.log(`Fetching tasks assigned to: ${user.username} (ID: ${user.id})`);
  console.log(`Workspace ID: ${teamId}\n`);

  const raw   = await fetchAssignedTasks(teamId, user.id);
  const tasks = raw.map(normalizeTask);

  const week  = getISOWeek();
  const paths = getSchedulePaths(week);
  await fs.mkdir(paths.input, { recursive: true });
  await fs.writeFile(paths.tasksFile, JSON.stringify(tasks, null, 2));

  const noEstimate = tasks.filter(t => t.time_estimate === null).length;
  console.log(`Saved ${tasks.length} task(s) to: ${paths.tasksFile}`);
  console.log(`  Status filter: ${STATUSES.join(', ')}`);
  if (noEstimate > 0) {
    console.log(`  Note: ${noEstimate} task(s) have no time estimate and will default to 1 hour when scheduling.`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
