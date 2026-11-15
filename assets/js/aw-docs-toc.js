/* Right rail "On this page": the top-level h2 headings of the page, with the
   section in view highlighted. Also remembers which left menu groups the
   reader closed. No-op on pages with fewer than two sections. */
(function () {
  var body = document.querySelector('.aw-docs-body');
  var side = document.querySelector('.aw-docs-side');
  if (!body || !side) return;

  // Left menu groups: remember closed ones, and keep all open on a phone,
  // where the menu is one row of links.
  var groups = Array.prototype.slice.call(side.querySelectorAll('details.aw-docs-group'));
  var KEY = 'aw-docs-closed';
  var closed = [];
  try { closed = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { closed = []; }
  var phone = window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;
  function label(g) { return g.querySelector('summary').textContent.trim(); }
  groups.forEach(function (g) {
    var here = g.querySelector('a.is-active');
    if (!here && closed.indexOf(label(g)) !== -1) g.open = false;
    g.addEventListener('toggle', function () {
      if (phone && phone.matches) return;
      var name = label(g);
      closed = closed.filter(function (n) { return n !== name; });
      if (!g.open) closed.push(name);
      try { localStorage.setItem(KEY, JSON.stringify(closed)); } catch (e) { /* storage blocked */ }
    });
  });
  function openAllOnPhone() { if (phone && phone.matches) groups.forEach(function (g) { g.open = true; }); }
  openAllOnPhone();
  if (phone && phone.addEventListener) phone.addEventListener('change', openAllOnPhone);

  var headings = Array.prototype.slice.call(body.querySelectorAll(':scope > h2'));
  if (headings.length < 2) return;

  function slugify(text) {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  var rail = document.createElement('aside');
  rail.className = 'aw-docs-rail';
  rail.setAttribute('aria-label', 'On this page');
  var title = document.createElement('span');
  title.className = 'aw-docs-rail-title';
  title.textContent = 'On this page';
  var list = document.createElement('div');
  list.className = 'aw-docs-rail-list';
  rail.appendChild(title);
  rail.appendChild(list);

  var used = {};
  var entries = headings.map(function (h) {
    var id = h.id;
    if (!id) {
      var base = slugify(h.textContent) || 'section';
      id = base;
      var n = 2;
      while (used[id]) { id = base + '-' + (n++); }
      h.id = id;
    }
    used[id] = true;
    var a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent;
    list.appendChild(a);
    return { heading: h, link: a };
  });

  var meta = document.createElement('div');
  meta.className = 'aw-docs-rail-meta';
  var top = document.createElement('a');
  top.href = '#';
  top.textContent = 'Back to top';
  top.addEventListener('click', function (ev) {
    ev.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  var report = document.createElement('a');
  report.href = 'https://github.com/flisk-sh/website/issues/new?title=' +
    encodeURIComponent('Docs: ' + location.pathname);
  report.target = '_blank';
  report.rel = 'noopener';
  report.textContent = 'Report a problem with this page';
  meta.appendChild(top);
  meta.appendChild(report);
  rail.appendChild(meta);

  var wrap = body.parentNode;
  wrap.appendChild(rail);
  wrap.classList.add('has-rail');

  var current = null;
  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.3;
    var pick = entries[0];
    entries.forEach(function (e) {
      if (e.heading.getBoundingClientRect().top <= line) pick = e;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      pick = entries[entries.length - 1];
    }
    if (pick === current) return;
    if (current) current.link.classList.remove('is-active');
    pick.link.classList.add('is-active');
    current = pick;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* Previous and next page links at the end of every docs page, in the order
   of the sidebar, so a reader can go through the docs without scrolling back
   up to the menu. */
(function () {
  var body = document.querySelector('.aw-docs-body');
  var links = Array.prototype.slice.call(document.querySelectorAll('.aw-docs-side nav a'));
  if (!body || !links.length) return;

  // Only the pages of this site; the Helpdock link opens elsewhere.
  var pages = links.filter(function (a) { return a.host === location.host && !a.target && !a.closest('.aw-docs-rail'); });
  var here = -1;
  pages.forEach(function (a, i) { if (a.classList.contains('is-active')) here = i; });
  if (here < 0) return;

  var nav = document.createElement('nav');
  nav.className = 'aw-docs-pager';
  nav.setAttribute('aria-label', 'Previous and next page');

  function add(page, label, className) {
    if (!page) return;
    var a = document.createElement('a');
    a.className = className;
    a.href = page.href;
    var small = document.createElement('span');
    small.textContent = label;
    var title = document.createElement('strong');
    title.textContent = page.textContent.trim();
    a.appendChild(small);
    a.appendChild(title);
    nav.appendChild(a);
  }

  add(pages[here - 1], 'Previous', 'aw-docs-pager-prev');
  add(pages[here + 1], 'Next', 'aw-docs-pager-next');
  if (nav.children.length) body.appendChild(nav);
})();

/* On a phone the menu is one row that scrolls sideways. Start it at the
   current page's link, and mark which edges have more links past them so
   the CSS can fade those edges. */
(function () {
  var nav = document.querySelector('.aw-docs-side nav');
  if (!nav) return;

  function mark() {
    var more = [];
    if (nav.scrollLeft > 4) more.push('left');
    if (nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4) more.push('right');
    if (more.length) nav.setAttribute('data-more', more.join(' '));
    else nav.removeAttribute('data-more');
  }

  var active = nav.querySelector('a.is-active');
  if (active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = Math.max(0, active.offsetLeft - nav.offsetLeft - 24);
  }
  mark();
  nav.addEventListener('scroll', mark, { passive: true });
  window.addEventListener('resize', mark);
})();
