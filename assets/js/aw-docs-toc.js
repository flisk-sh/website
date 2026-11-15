/* Lists the top-level h2 headings of the page under its link in the docs
   sidebar, and highlights the section currently in view. No-op on
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

  toc.setAttribute('aria-label', 'On this page');

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

  // The sections sit under the current page's link, as one tree. A page
  // that is not in the menu gets them at the end.
  var active = side.querySelector('nav a.is-active');
  if (active) active.insertAdjacentElement('afterend', toc);
  else side.appendChild(toc);

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
  var pages = links.filter(function (a) { return a.host === location.host && !a.target && !a.closest('.aw-docs-toc'); });
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
