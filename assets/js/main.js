// TDK CLI Website - Main JavaScript

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
  const exploreMenu = navigation?.querySelector('.aw-nav-more');

  if (!navigation || !menuButton || !menu || navigation.dataset.navigationReady) return;
  navigation.dataset.navigationReady = 'true';

  const closeNavigation = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    if (exploreMenu) exploreMenu.open = false;
  };

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
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNavigation();
      menuButton.focus();
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
    if (pre.querySelector('.copy-code-button')) return;
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

function initializeSite() {
  initNavigation();
  addCopyButtons();
  initInstallCopy();
  initInstallMethods();
  initBenchTabs();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSite);
} else {
  initializeSite();
}

// Live GitHub star count for tdk-cli-core on every [data-gh-stars] badge.
(function showGitHubStars() {
  const badges = document.querySelectorAll('[data-gh-stars]');
  if (!badges.length) return;

  const cacheKey = 'tdk-gh-stars';
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

  fetch('https://api.github.com/repos/flisk-sh/tdk-cli-core')
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

// Latest tdk-cli-core release tag on every [data-latest-release] pill.
(function showLatestRelease() {
  const labels = document.querySelectorAll('[data-latest-release]');
  if (!labels.length) return;

  const cacheKey = 'tdk-latest-release';
  const render = (tag) => {
    if (typeof tag !== 'string' || !tag) return;
    labels.forEach((el) => {
      el.textContent = `TDK CLI ${tag} released`;
    });
  };

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.at < 3600000) {
      render(cached.tag);
      return;
    }
  } catch (e) { /* storage unavailable */ }

  fetch('https://api.github.com/repos/flisk-sh/tdk-cli-core/releases/latest')
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
