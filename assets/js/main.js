// Flisk CLI Website - Main JavaScript

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add active class to navigation based on scroll position
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= (sectionTop - 200)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

// Shared navigation behavior
function initNavigation() {
  const navigation = document.querySelector('.aw-nav');
  const menuButton = navigation?.querySelector('.aw-nav-burger');
  const menu = navigation?.querySelector('.aw-nav-links');
  const dropdowns = Array.from(navigation?.querySelectorAll('.aw-nav-more') || []);

  if (!navigation || !menuButton || !menu || navigation.dataset.navigationReady) return;
  navigation.dataset.navigationReady = 'true';

  const closeNavigation = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    dropdowns.forEach((d) => { d.open = false; });
  };

  // One dropdown open at a time.
  dropdowns.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) dropdowns.forEach((other) => { if (other !== d) other.open = false; });
  }));

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('click', event => {
    if (!navigation.contains(event.target)) closeNavigation();
    else if (!event.target.closest('.aw-nav-more')) dropdowns.forEach((d) => { d.open = false; });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const openDropdown = dropdowns.find((d) => d.open);
      const menuWasOpen = navigation.classList.contains('is-open');
      closeNavigation();
      if (openDropdown) openDropdown.querySelector('summary').focus();
      else if (menuWasOpen) menuButton.focus();
    }
  });

  const updateNavigation = () => {
    navigation.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', updateNavigation, { passive: true });
  updateNavigation();
}

// Copy code blocks
function addCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    // Explorer excerpts are partial files and "Recently shipped" snippets are examples;
    // both link to the source instead.
    if (pre.querySelector('.copy-code-button') || pre.closest('[data-gen], [data-new]')) return;
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-light copy-code-button';
    button.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.75rem;';
    button.innerHTML = '<i class="bi bi-clipboard"></i>';
    button.setAttribute('aria-label', 'Copy to clipboard');

    button.addEventListener('click', () => {
      const code = pre.querySelector('code');
      const text = code ? code.innerText : pre.innerText;

      navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '<i class="bi bi-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="bi bi-clipboard"></i>';
        }, 2000);
      });
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });
}

function initInstallCopy() {
  const button = document.querySelector('[data-copy-install]');
  const command = document.getElementById('aw-install-command');
  const status = document.querySelector('[data-copy-status]');
  if (!button || !command) return;

  button.addEventListener('click', async () => {
    const label = button.querySelector('span');
    const text = command.textContent.trim();
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (error) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
      document.body.removeChild(field);
    }
    if (copied) {
      if (label) label.textContent = 'Copied';
      if (status) status.textContent = 'Install command copied to clipboard.';
    } else if (status) {
      status.textContent = 'Could not copy automatically. Select and copy the command above.';
    }
    window.setTimeout(() => {
      if (label) label.textContent = 'Copy';
    }, 1800);
  });
}

function initInstallMethods() {
  const methods = document.querySelectorAll('.aw-install-method');
  const command = document.getElementById('aw-install-command');
  const note = document.querySelector('[data-install-note]');
  const label = document.querySelector('[data-copy-install] span');
  if (!methods.length || !command) return;

  methods.forEach((btn) => {
    btn.addEventListener('click', () => {
      methods.forEach((m) => {
        const on = m === btn;
        m.classList.toggle('is-active', on);
        m.setAttribute('aria-pressed', String(on));
      });
      command.textContent = btn.dataset.cmd;
      if (note) note.textContent = btn.dataset.note;
      if (label) label.textContent = 'Copy';
    });
  });
}

function initBenchTabs() {
  const root = document.querySelector('[data-bench]');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;

  const stopRealtime = () => {
    cancelAnimationFrame(frame);
    root.querySelectorAll('.aw-bench-bar').forEach((bar) => { bar.style.cssText = ''; });
    root.querySelectorAll('[data-bench-clock]').forEach((clock) => { clock.hidden = true; });
    root.classList.remove('is-resetting');
  };

  // Time-based panels replay in real time at data-speed x: each bar fills as the clock reaches its seconds.
  // The value labels always show the measured result; only the clock in the panel header counts up.
  const playRealtime = (panel) => {
    const speed = Number(panel.dataset.speed);
    const clock = panel.querySelector('[data-bench-clock]');
    const rows = Array.from(panel.querySelectorAll('.aw-bench-row')).map((row) => ({
      bar: row.querySelector('.aw-bench-bar'),
      secs: Number(row.dataset.value),
      full: Number(row.dataset.v),
    }));
    const longest = Math.max(...rows.map((r) => r.secs));
    const start = performance.now();
    if (clock) clock.hidden = false;
    const tick = (now) => {
      const t = Math.min(((now - start) / 1000) * speed, longest);
      rows.forEach((r) => {
        r.bar.style.transition = 'none';
        r.bar.style.transform = `scaleX(${Math.min(t / r.secs, 1) * r.full})`;
      });
      if (clock) clock.textContent = `clock ${t.toFixed(1)}s · ${speed}×`;
      if (t < longest) frame = requestAnimationFrame(tick);
      else stopRealtime();
    };
    frame = requestAnimationFrame(tick);
  };

  // Grow the bars from zero, like a fresh run.
  const replay = () => {
    stopRealtime();
    const panel = root.querySelector('.aw-bench-panel:not([hidden])');
    root.classList.add('is-resetting');
    if (panel && panel.dataset.speed && !reduceMotion) {
      playRealtime(panel);
      return;
    }
    void root.offsetWidth;
    root.classList.remove('is-resetting');
  };

  const select = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    replay();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });

  root.querySelectorAll('[data-bench-replay]').forEach((btn) => btn.addEventListener('click', replay));

  // First run plays when the panel scrolls into view.
  if ('IntersectionObserver' in window) {
    root.classList.add('is-resetting');
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      replay();
    }, { threshold: 0.3 });
    observer.observe(root);
  }
}

// Small per-language tinting for the explorer; text is escaped before any markup is added.
const GEN_TOKENS = {
  json: /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)/g,
  yaml: /(^\s*(?:-\s+)?)([\w.$-]+)(\s*:)|("(?:[^"\\]|\\.)*"|'[^']*')|(\b\d+(?:\.\d+)?[A-Za-z]*\b)/g,
  ts: /\b(import|from|export|default|const|true|false)\b|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([\w$]+)(?=:)/g,
  dockerfile: /^(\s*)([A-Z]+)\b|\b(AS)\b|("(?:[^"\\]|\\.)*")/g,
};

function tintGeneratedLine(text, lang) {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const span = (cls, s) => `<span class="${cls}">${esc(s)}</span>`;
  const trimmed = text.trimStart();
  if (/^(#|\/\/)/.test(trimmed)) return span('t-c', text);
  const re = GEN_TOKENS[lang];
  if (!re) return esc(text);
  let out = '';
  let last = 0;
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (!m[0]) { re.lastIndex += 1; continue; }
    out += esc(text.slice(last, m.index));
    if (lang === 'json') out += m[2] ? span('t-k', m[1]) + esc(m[2]) : m[1] ? span('t-s', m[1]) : span('t-n', m[3]);
    if (lang === 'yaml') out += m[2] ? esc(m[1]) + span('t-k', m[2]) + esc(m[3]) : m[4] ? span('t-s', m[4]) : span('t-n', m[5]);
    if (lang === 'ts') out += m[1] ? span('t-i', m[1]) : m[2] ? span('t-s', m[2]) : m[3] ? span('t-n', m[3]) : span('t-k', m[4]);
    if (lang === 'dockerfile') out += m[2] ? esc(m[1]) + span('t-i', m[2]) : m[3] ? span('t-i', m[3]) : span('t-s', m[4]);
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

// Homepage generated-files explorer: tabs, file tree, and number keys share one selection;
// annotated line ranges show their note beside the cursor.
function initGeneratedExplorer() {
  const root = document.querySelector('[data-gen]');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const files = Array.from(root.querySelectorAll('[data-gen-target]'));

  root.querySelectorAll('.aw-gen-code').forEach((code) => {
    code.querySelectorAll('.aw-gen-line code').forEach((line) => {
      line.innerHTML = tintGeneratedLine(line.textContent, code.dataset.lang);
    });
    // Keep callouts inside the visible part of a horizontally scrolled file.
    code.addEventListener('scroll', () => code.style.setProperty('--tip-x', `${code.scrollLeft}px`), { passive: true });
  });

  root.querySelectorAll('.aw-gen-block').forEach((block) => {
    const tip = block.querySelector('.aw-gen-tip');
    block.addEventListener('mousemove', (event) => {
      const box = block.getBoundingClientRect();
      const y = Math.min(Math.max(event.clientY - box.top + 18, 0), Math.max(box.height - 8, 0));
      tip.style.setProperty('--tip-y', `${y}px`);
    });
    block.addEventListener('mouseleave', () => tip.style.removeProperty('--tip-y'));
  });

  const select = (tab) => {
    const id = tab.getAttribute('aria-controls').replace('aw-gen-', '');
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    root.querySelectorAll('[data-gen-desc]').forEach((d) => { d.hidden = d.dataset.genDesc !== id; });

    // Open the folders on the active file's path; the nearest one is filled.
    const file = files.find((f) => f.dataset.genTarget === id);
    files.forEach((f) => f.classList.toggle('is-active', f === file));
    root.querySelectorAll('[data-gen-dir]').forEach((dir) => {
      dir.classList.toggle('is-open', dir.contains(file));
      dir.classList.remove('is-current');
    });
    if (file) file.closest('[data-gen-dir]').classList.add('is-current');

    // Keep the active tab visible when the tab strip scrolls on narrow screens.
    const strip = tab.parentElement;
    if (strip.scrollWidth > strip.clientWidth) {
      const offset = tab.getBoundingClientRect().left - strip.getBoundingClientRect().left;
      strip.scrollTo({ left: strip.scrollLeft + offset - (strip.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });

  files.forEach((file) => file.addEventListener('click', () => {
    select(document.getElementById(`aw-gen-tab-${file.dataset.genTarget}`));
  }));

  // Number keys switch files while the explorer is on screen and nothing editable has focus.
  let onScreen = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
    }, { threshold: 0.3 }).observe(root);
  }
  document.addEventListener('keydown', (event) => {
    if (!onScreen || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const tab = tabs[Number(event.key) - 1];
    if (tab) select(tab);
  });

  select(tabs[0]);
}

// Homepage "Recently shipped": a vertical tab list that swaps the detail panel.
function initRecentlyShipped() {
  const root = document.querySelector('[data-new]');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

  const select = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    // On narrow screens the list is a sideways strip; keep the chosen item in view.
    const strip = tab.parentElement;
    if (strip.scrollWidth > strip.clientWidth) {
      const offset = tab.getBoundingClientRect().left - strip.getBoundingClientRect().left;
      strip.scrollTo({ left: strip.scrollLeft + offset - 16, behavior: 'smooth' });
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
}

// Homepage section index: slides in once the hero is gone, marks the section in view,
// and jumps on its letter key when nothing editable has focus.
function initSectionIndex() {
  const bar = document.querySelector('[data-aw-index]');
  const hero = document.querySelector('.aw-hero');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;
  const links = Array.from(bar.querySelectorAll('[data-index-key]'));
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  new IntersectionObserver(([entry]) => {
    const on = !entry.isIntersecting;
    bar.classList.toggle('is-on', on);
    document.body.classList.toggle('aw-index-on', on);
  }).observe(hero);

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => spy.observe(t));

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const link = links.find((a) => a.dataset.indexKey === event.key.toUpperCase());
    if (!link) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
}

function initializeSite() {
  initNavigation();
  addCopyButtons();
  initInstallCopy();
  initInstallMethods();
  initBenchTabs();
  initGeneratedExplorer();
  initRecentlyShipped();
  initSectionIndex();
  // Standalone code excerpts (e.g. /layers/) use the same tint as the explorer.
  document.querySelectorAll('[data-tint-lang]').forEach((pre) => {
    pre.querySelectorAll('.aw-gen-line code').forEach((line) => {
      line.innerHTML = tintGeneratedLine(line.textContent, pre.dataset.tintLang);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSite);
} else {
  initializeSite();
}

// Live GitHub star count for the CLI repo on every [data-gh-stars] badge.
(function showGitHubStars() {
  const badges = document.querySelectorAll('[data-gh-stars]');
  if (!badges.length) return;

  const cacheKey = 'flisk-gh-stars';
  const render = (count) => {
    if (typeof count !== 'number') return;
    const label = count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(count);
    badges.forEach((el) => {
      el.textContent = label;
      el.hidden = false;
    });
  };

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.at < 3600000) {
      render(cached.count);
      return;
    }
  } catch (e) { /* storage unavailable */ }

  fetch('https://api.github.com/repos/flisk-sh/flisk')
    .then((res) => (res.ok ? res.json() : null))
    .then((repo) => {
      if (!repo) return;
      render(repo.stargazers_count);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ count: repo.stargazers_count, at: Date.now() }));
      } catch (e) { /* storage unavailable */ }
    })
    .catch(() => {});
})();

// Latest CLI repo release tag on every [data-latest-release] pill.
(function showLatestRelease() {
  const labels = document.querySelectorAll('[data-latest-release]');
  if (!labels.length) return;

  const cacheKey = 'flisk-latest-release';
  const render = (tag) => {
    if (typeof tag !== 'string' || !tag) return;
    labels.forEach((el) => {
      el.textContent = `Flisk CLI ${tag} released`;
    });
  };

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.at < 3600000) {
      render(cached.tag);
      return;
    }
  } catch (e) { /* storage unavailable */ }

  fetch('https://api.github.com/repos/flisk-sh/flisk/releases/latest')
    .then((res) => (res.ok ? res.json() : null))
    .then((release) => {
      if (!release) return;
      render(release.tag_name);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ tag: release.tag_name, at: Date.now() }));
      } catch (e) { /* storage unavailable */ }
    })
    .catch(() => {});
})();
