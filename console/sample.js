/* The FliskOS demo on flisk.sh. The page is the real FliskOS frontend (see scripts/sync-console.mjs); this file answers its
   /api/ calls from sample-data.js, so nothing runs and nothing leaves the browser. Start, Stop and Restart change the sample
   state. Anything that would touch a real machine answers with DEMO_ONLY. */
(function () {
  const SAMPLE = window.FLISK_SAMPLE;
  const DEMO_ONLY = 'This is a demo with sample data. Install FliskOS to do this on your own projects.';
  const ORDERS = SAMPLE.projects.find((project) => project.name === 'orders-app');
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const projects = clone(SAMPLE.projects);
  const stopped = new Set();
  let fixed = false;
  let uiState = clone(SAMPLE.state);
  let jobs = [];

  const isOrders = (id) => id === ORDERS.id;

  function resourceState(project, resource) {
    if (stopped.has(project.id)) return { status: 'unknown', statusReason: 'not running' };
    if (isOrders(project.id) && !fixed) return { status: 'pending', statusReason: 'starting' };
    return { status: 'ready' };
  }

  function projectList() {
    return projects.map((project) => ({
      ...project,
      tiltRunning: !stopped.has(project.id),
      resources: project.resources.map((resource) => {
        const { statusReason, ...rest } = resource;
        return { ...rest, ...resourceState(project, resource) };
      }),
    }));
  }

  function doctor(id) {
    if (!isOrders(id)) return SAMPLE.doctor.menu;
    return fixed && !stopped.has(id) ? SAMPLE.doctor.fixed : SAMPLE.doctor.broken;
  }

  function logs(id, resource) {
    const project = projects.find((entry) => entry.id === id);
    const found = SAMPLE.logs[`${project?.name}/${resource}`] || { lines: [] };
    if (isOrders(id) && fixed && resource === 'api') return { lines: [] };
    return found;
  }

  function runAction({ project, operation }) {
    const job = { id: Math.random().toString(16).slice(2, 14), project, operation, state: 'running', message: '', startedAt: Date.now(), endedAt: null, elapsedMs: 1, progress: null };
    jobs = [job, ...jobs.filter((entry) => entry.project !== project)];
    window.setTimeout(() => {
      if (operation === 'stop') stopped.add(project);
      else stopped.delete(project);
      const failing = operation !== 'stop' && isOrders(project) && !fixed;
      Object.assign(job, {
        state: failing ? 'failed' : 'done',
        message: operation === 'stop' ? 'Stopped.' : failing ? 'api is not healthy. Open its logs to see why.' : 'all resources are ready.',
        endedAt: Date.now(),
        progress: operation === 'stop' || failing ? null : { step: 'Ready', percent: 100 },
      });
    }, 1800);
    return { job: { ...job } };
  }

  function route(method, url, body) {
    const path = url.pathname;
    const query = url.searchParams;
    if (method === 'GET') {
      if (path === '/api/projects') return { projects: projectList() };
      if (path === '/api/doctor') return doctor(query.get('project'));
      if (path === '/api/logs') return logs(query.get('project'), query.get('resource'));
      if (path === '/api/jobs') return { jobs: jobs.map((job) => ({ ...job, elapsedMs: (job.endedAt || Date.now()) - job.startedAt })) };
      if (path === '/api/cli') return SAMPLE.cli;
      if (path === '/api/meta') return SAMPLE.meta;
      if (path === '/api/state') return uiState;
      if (path === '/api/disk') return SAMPLE.disk;
      if (path === '/api/agents') return SAMPLE.agents;
      if (path === '/api/agents/threads') return { threads: SAMPLE.threads };
      if (path === '/api/agents/board') return { state: 'not-running', sessions: [] };
      if (path === '/api/agents/thread') return query.get('version') ? { unchanged: true } : { thread: SAMPLE.thread };
      if (path === '/api/apps') return query.get('project') ? SAMPLE.appsProject : SAMPLE.apps;
      if (path === '/api/config/log') return SAMPLE.configLog;
    }
    if (method === 'PUT' && path === '/api/state') {
      uiState = { ...uiState, ...body };
      return uiState;
    }
    if (method === 'POST' && path === '/api/actions') return runAction(body);
    return null;
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, options);
    let body = {};
    try { body = options.body ? JSON.parse(options.body) : {}; } catch { body = {}; }
    const result = route((options.method || 'GET').toUpperCase(), url, body);
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    const json = (status, value) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
    return result ? json(200, clone(result)) : json(400, { error: DEMO_ONLY });
  };

  /* The page that embeds the demo can drive it: open a project, a view, a log, or apply the fix. */
  const click = (selector) => {
    const target = document.querySelector(selector);
    if (target) target.click();
    return Boolean(target);
  };
  const sidebar = (label) => {
    const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.trim() === label);
    if (button) button.click();
  };
  const refresh = () => { if (typeof window.refreshData === 'function') void window.refreshData(); };

  const steps = {
    overview: () => sidebar('Overview'),
    project: () => click(`[data-select-project="${ORDERS.id}"]`),
    logs: () => {
      click(`[data-select-project="${ORDERS.id}"]`);
      window.setTimeout(() => click(`[data-action="logs"][data-project="${ORDERS.id}"][data-name="api"]`), 400);
    },
    agent: () => {
      sidebar('Agents');
      window.setTimeout(() => click(`[data-agent-thread="${SAMPLE.thread.id}"]`), 500);
    },
    fix: () => {
      fixed = true;
      stopped.delete(ORDERS.id);
      document.querySelector('dialog[open]')?.close();
      click(`[data-select-project="${ORDERS.id}"]`);
      window.setTimeout(() => {
        click(`[data-action="doctor-refresh"][data-project="${ORDERS.id}"]`);
        refresh();
      }, 300);
    },
    reset: () => {
      fixed = false;
      stopped.clear();
      jobs = [];
      document.querySelector('dialog[open]')?.close();
      sidebar('Overview');
      refresh();
    },
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const step = steps[event.data?.fliskDemo];
    if (step) step();
  });

  /* Opened by itself (not inside the homepage), the demo says what it is. */
  if (window.self === window.top) {
    window.addEventListener('DOMContentLoaded', () => {
      const note = document.createElement('a');
      note.href = '/';
      note.textContent = 'FliskOS demo with sample data. Back to flisk.sh';
      note.style.cssText = 'position:fixed;right:1rem;bottom:1rem;z-index:99;padding:0.5rem 0.9rem;border-radius:999px;background:#22C55E;color:#0a0a0e;font:600 0.8125rem system-ui,sans-serif;text-decoration:none';
      document.body.appendChild(note);
    });
  }
})();
