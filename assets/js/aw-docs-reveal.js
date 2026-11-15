/* Docs: fade each block in once as it scrolls into view, and draw the
   architecture diagram layer by layer. Opacity and transform only.
   Does nothing when the visitor prefers reduced motion, when
   IntersectionObserver is missing, or when JS is off, so content is never
   hidden by default. */
(function () {
  var body = document.querySelector('.aw-docs-body');
  if (!body || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = body.querySelectorAll(
    ':scope > h2, :scope > .aw-codeblock, :scope > .aw-docs-table, :scope > .aw-docs-figure, :scope > .aw-faq-list, :scope > .aw-docs-jump'
  );
  if (!targets.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) {
    var r = el.getBoundingClientRect();
    el.classList.add('aw-reveal');
    if (r.top < window.innerHeight * 0.92) {
      requestAnimationFrame(function () { el.classList.add('is-in'); });
    } else {
      io.observe(el);
    }
  });
})();
