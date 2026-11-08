/* Homepage journey: the press-Enter terminal, the "your own app" path tabs, the collapsed license form, the phone button. */
(function () {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The transcript is in the HTML, so it reads without JavaScript or with reduced motion. This only replays it. */
  function initTerminal() {
    const root = document.querySelector('[data-try]');
    if (!root || REDUCED) return;
    const body = root.querySelector('[data-try-body]');
    const shot = root.querySelector('[data-try-shot]');
    const controls = root.querySelector('[data-try-controls]');
    const run = root.querySelector('[data-try-run]');
    const runLabel = root.querySelector('[data-try-run-label]');
    const own = root.querySelector('[data-try-own]');
    const replay = root.querySelector('[data-try-replay]');
    const title = root.querySelector('[data-try-title]');
    const lines = Array.from(body.querySelectorAll('.aw-tline'));
    const scene = (n) => lines.filter((line) => line.dataset.scene === String(n));
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    let current = 0; // bumped by every replay, so an older one stops

    lines.forEach((line) => {
      const text = line.querySelector('[data-text]');
      if (text) text.dataset.full = text.textContent;
    });

    function clear() {
      lines.forEach((line) => { line.hidden = true; });
      shot.classList.remove('is-open');
      body.scrollTop = 0;
    }

    function setRun(label, cta, next) {
      runLabel.textContent = label;
      run.dataset.cta = cta;
      run.hidden = false;
      run.onclick = next;
    }

    function ready() {
      current += 1;
      clear();
      title.textContent = 'try flisk';
      scene(1)[0].hidden = false;
      own.hidden = true;
      replay.hidden = true;
      setRun('Run it', 'try_run_demo', () => play(1));
    }

    async function type(line, id) {
      const text = line.querySelector('[data-text]');
      const full = text.dataset.full;
      for (let i = 0; i <= full.length; i += 1) {
        if (id !== current) return;
        text.textContent = full.slice(0, i);
        await wait(22);
      }
      await wait(160);
    }

    async function play(n) {
      current += 1;
      const id = current;
      run.hidden = true;
      replay.hidden = true;
      if (n === 2) {
        clear();
        title.textContent = 'your compose app';
      }
      for (const [i, line] of scene(n).entries()) {
        if (n === 1 && i === 0) continue; // already on screen, waiting for Enter
        line.hidden = false;
        body.scrollTop = body.scrollHeight;
        if ('cmd' in line.dataset) await type(line, id);
        else await wait(Number(line.dataset.wait || 150));
        if (id !== current) return;
      }
      if (n === 1) {
        title.textContent = 'localhost:3001';
        await wait(700);
        if (id !== current) return;
        shot.classList.add('is-open');
        setRun('Now save one line', 'try_run_save', () => play(2));
      } else {
        own.hidden = false;
      }
      replay.hidden = false;
    }

    root.classList.add('is-live');
    controls.hidden = false;
    replay.addEventListener('click', ready);
    ready();

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      if (run.hidden || root.getBoundingClientRect().bottom < 0) return;
      event.preventDefault();
      run.click();
    });
  }

  function initPaths() {
    const root = document.querySelector('[data-paths]');
    if (!root) return;
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
  initPaths();
  initLicense();
  initPhoneBar();
})();
