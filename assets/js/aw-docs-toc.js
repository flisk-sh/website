/* Auto-builds an "On this page" sub-nav in the docs sidebar from top-level
   h2 headings, and highlights the section currently in view. No-op on
   pages that aren't docs pages, or that only have one section. */
(function () {
  var body = document.querySelector('.aw-docs-body');
  var side = document.querySelector('.aw-docs-side');
  if (!body || !side) return;

  var headings = Array.prototype.slice.call(body.querySelectorAll(':scope > h2'));
  if (headings.length < 2) return;

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  var toc = document.createElement('div');
  toc.className = 'aw-docs-toc';

  var label = document.createElement('div');
  label.className = 'aw-docs-toc-label';
  label.textContent = 'On this page';
  toc.appendChild(label);

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
    toc.appendChild(a);
    return { heading: h, link: a };
  });

  side.appendChild(toc);

  if ('IntersectionObserver' in window) {
    var current = null;
    var observer = new IntersectionObserver(
      function (observed) {
        observed.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = entries.filter(function (e) { return e.heading === entry.target; })[0];
          if (!match || match === current) return;
          if (current) current.link.classList.remove('is-active');
          match.link.classList.add('is-active');
          current = match;
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    entries.forEach(function (e) { observer.observe(e.heading); });
  }
})();

/* Previous and next page links at the end of every docs page, in the order
   of the sidebar, so a reader can go through the docs without scrolling back
   up to the menu. */
(function () {
  var body = document.querySelector('.aw-docs-body');
  var links = Array.prototype.slice.call(document.querySelectorAll('.aw-docs-side nav a'));
  if (!body || !links.length) return;

  // Only the pages of this site; the Helpdock link opens elsewhere.
  var pages = links.filter(function (a) { return a.host === location.host && !a.target; });
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
