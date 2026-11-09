/* Homepage journey: the press-Enter terminal, the "your own app" path tabs, the collapsed license form, the phone button. */
(function () {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The transcript is in the HTML, so it reads without JavaScript or with reduced motion. This only replays it. */
  function initTerminal() {
    const root = document.querySelector('[data-try]');
    if (!root) return;
    const body = root.querySelector('[data-try-body]');
    const shot = root.querySelector('[data-try-shot]');
    const controls = root.querySelector('[data-try-controls]');
    const run = root.querySelector('[data-try-run]');
    const runLabel = root.querySelector('[data-try-run-label]');
    const own = root.querySelector('[data-try-own]');
    const replay = root.querySelector('[data-try-replay]');
    const title = root.querySelector('[data-try-title]');
    const tabBar = root.querySelector('[data-try-tabs]');
    const tabs = Array.from(root.querySelectorAll('[data-try-scene]'));
    const TITLES = { 1: 'try flisk', 2: 'your compose app', 3: 'a broken app' };
    const lines = Array.from(body.querySelectorAll('.aw-tline'));
    const scene = (n) => lines.filter((line) => line.dataset.scene === String(n));
    const step = (s) => scene(3).filter((line) => line.dataset.step === String(s));
    /* Reduced motion keeps the clicks and drops the typing and the pauses. */
    const wait = (ms) => (REDUCED ? Promise.resolve() : new Promise((resolve) => window.setTimeout(resolve, ms)));
    let current = 0; // bumped by every play, so an older one stops
    let active = 1;

    lines.forEach((line) => {
      const text = line.querySelector('[data-text]');
      if (text) text.dataset.full = text.textContent;
    });

    function clear() {
      lines.forEach((line) => {
        line.hidden = true;
        const text = line.querySelector('[data-text]');
        if (text) text.textContent = text.dataset.full;
      });
      shot.classList.remove('is-open');
      body.scrollTop = 0;
      run.hidden = true;
      own.hidden = true;
      replay.hidden = true;
    }

    function setRun(label, cta, next) {
      runLabel.textContent = label;
      run.dataset.cta = cta;
      run.hidden = false;
      run.onclick = next;
    }

    async function type(line, id) {
      if (REDUCED) return;
      const text = line.querySelector('[data-text]');
      const full = text.dataset.full;
      for (let i = 0; i <= full.length; i += 1) {
        if (id !== current) return;
        text.textContent = full.slice(0, i);
        await wait(22);
      }
      await wait(160);
    }

    /* Resolves false when a newer play took over. */
    async function show(list, id) {
      for (const line of list) {
        line.hidden = false;
        if ('cmd' in line.dataset) {
          body.scrollTop = body.scrollHeight;
          await type(line, id);
        } else {
          await wait(Number(line.dataset.wait || 150));
        }
        if (id !== current) return false;
        body.scrollTop = body.scrollHeight;
      }
      return true;
    }

    function finish() {
      own.hidden = false;
      replay.hidden = false;
    }

    async function playStep(s, id) {
      run.hidden = true;
      if (!(await show(step(s), id))) return;
      const next = step(s + 1)[0];
      if (next) setRun(next.dataset.stepLabel, `try_step_${s + 1}`, () => playStep(s + 1, id));
      else finish();
    }

    async function play(n) {
      current += 1;
      const id = current;
      active = n;
      tabs.forEach((tab) => {
        const on = tab.dataset.tryScene === String(n);
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-pressed', String(on));
      });
      clear();
      title.textContent = TITLES[n];
      if (n === 3) {
        await playStep(1, id);
        return;
      }
      if (!(await show(scene(n), id))) return;
      if (n === 1) {
        title.textContent = 'localhost:3001';
        await wait(700);
        if (id !== current) return;
        shot.classList.add('is-open');
        setRun('Now save one line', 'try_run_save', () => play(2));
        replay.hidden = false;
      } else {
        finish();
      }
    }

    root.classList.add('is-live');
    controls.hidden = false;
    tabBar.hidden = false;
    clear();
    tabs.forEach((tab) => tab.addEventListener('click', () => play(Number(tab.dataset.tryScene))));
    replay.addEventListener('click', () => play(active));

    /* The demo plays by itself the first time it is on screen. */
    const onScreen = () => {
      const box = root.getBoundingClientRect();
      return box.top < window.innerHeight && box.bottom > 0;
    };
    if (onScreen() || !('IntersectionObserver' in window)) {
      play(1);
    } else {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (current === 0) play(1);
      }, { threshold: 0.25 });
      observer.observe(root);
    }

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      if (run.hidden || root.getBoundingClientRect().bottom < 0) return;
      event.preventDefault();
      run.click();
    });
  }

  function initTabs(root) {
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach((item) => {
        const on = item === tab;
        item.classList.toggle('is-active', on);
        item.setAttribute('aria-selected', String(on));
        item.tabIndex = on ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  }

  /* The guide above the console drives the FliskOS demo in the frame (console/sample.js listens). */
  function initStage() {
    const frame = document.querySelector('[data-stage-frame]');
    const guide = document.querySelector('[data-stage-guide]');
    if (!frame || !guide) return;

    /* The window's address line follows the open tab, and a live site loads the first time its tab opens. */
    const stage = document.querySelector('[data-stage]');
    const host = stage.querySelector('[data-stage-host]');
    const open = stage.querySelector('[data-stage-open]');
    stage.querySelectorAll('[role="tab"]').forEach((tab) => {
      const show = () => {
        host.textContent = tab.dataset.stageHostName;
        open.href = tab.dataset.stageUrl;
        const site = document.getElementById(tab.getAttribute('aria-controls')).querySelector('iframe[data-src]');
        if (site && !site.src) site.src = site.dataset.src;
      };
      tab.addEventListener('click', show);
      tab.addEventListener('focus', () => { if (tab.getAttribute('aria-selected') === 'true') show(); });
    });
    const steps = Array.from(guide.querySelectorAll('[data-stage-step]'));
    guide.addEventListener('click', (event) => {
      const button = event.target.closest('[data-stage-step]');
      if (!button) return;
      const name = button.dataset.stageStep;
      frame.contentWindow.postMessage({ fliskDemo: name }, window.location.origin);
      steps.forEach((step) => step.classList.toggle('is-active', step === button && name !== 'reset'));
      if (name === 'reset') steps.forEach((step) => step.classList.remove('is-done'));
      else button.classList.add('is-done');
    });
  }

  /* /#waitlist links (nav, footer, Premium card, other pages) must land on an open form. */
  function initLicense() {
    const details = document.querySelector('[data-license]');
    if (!details) return;
    const openIfAsked = () => { if (window.location.hash === '#waitlist') details.open = true; };
    openIfAsked();
    window.addEventListener('hashchange', openIfAsked);
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href$="#waitlist"]');
      if (link) details.open = true;
    });
  }

  /* Phones cannot run a CLI, so they keep a browser button in reach between the hero and the closing section. */
  function initPhoneBar() {
    const bar = document.querySelector('[data-phone-bar]');
    const hero = document.getElementById('top');
    const close = document.getElementById('try');
    if (!bar || !hero || !close || !('IntersectionObserver' in window)) return;
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      bar.hidden = visible.size > 0;
    });
    observer.observe(hero);
    observer.observe(close);
  }

  initTerminal();
  document.querySelectorAll('[data-paths], [data-tabs]').forEach(initTabs);
  initStage();
  initLicense();
  initPhoneBar();
})();
