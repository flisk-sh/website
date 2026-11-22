/* Flisk Analytics: one pageview beacon and a click map, no cookies, no storage that identifies anyone.
   <script defer data-domain="example.com" src="https://flisk.sh/a.js"></script> */
(function () {
  var s = document.currentScript, d = s && s.getAttribute('data-domain');
  if (!d || navigator.webdriver || /Headless/i.test(navigator.userAgent)) return;
  // The analytics click heatmap shows the page in a preview frame marked #flisk-preview: not a visit.
  if (/(^|[#&])flisk-preview\b/.test(location.hash)) return;
  var api = (s.getAttribute('data-api') || 'https://analytics.flisk.si') + '/e', last = '';
  function sid() {
    try { var k = '_fa', v = sessionStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem(k, v); } return v; } catch (e) { return ''; }
  }
  // The theme the visitor sees: data-flisk-theme, else data-theme (light and dark are not themes). Read at send time.
  function theme() {
    var h = document.documentElement, t = h.getAttribute('data-flisk-theme');
    if (!t) { t = h.getAttribute('data-theme') || ''; if (/^\s*(light|dark)\s*$/i.test(t)) t = ''; }
    return String(t || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
  }
  function post(o) {
    o.d = d; o.s = sid(); o.t = theme();
    var body = JSON.stringify(o);
    if (navigator.sendBeacon) navigator.sendBeacon(api, body); else fetch(api, { method: 'POST', body: body, keepalive: true });
  }
  function send() {
    var p = location.pathname;
    if (p === last) return; // reloads and repeat route events count once
    last = p;
    post({ p: p, r: document.referrer, u: new URLSearchParams(location.search).get('utm_campaign') || '' });
  }
  // Link clicks: links that leave the site and file downloads. Host and path only, never the query.
  addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'), u;
    if (!a) return;
    try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (!/^https?:$/.test(u.protocol)) return;
    if (u.host !== location.host || /\.(zip|pdf|dmg|exe|pkg|tgz|gz|csv|xlsx?|mp4)$/i.test(u.pathname)) post({ e: 'click', p: location.pathname, l: u.host + u.pathname });
  }, true);
  // Click map: every click with its place on the page (x as a share of the page width, y in px from the top) and a
  // short label of what was clicked. Sent in batches of 20 and on pagehide. Skipped with Do Not Track or Global Privacy Control.
  if (navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl) {
    var q = [], qp = '';
    var flush = function () { if (!q.length) return; var c = q; q = []; post({ e: 'clicks', p: qp, v: innerWidth < 768 ? 'mobile' : 'desktop', c: c }); };
    addEventListener('click', function (e) {
      var t = e.target, c = t && t.closest && t.closest('a,button,input,label,select,textarea,summary,[role=button],[role=tab]'), l;
      if (location.pathname !== qp) { flush(); qp = location.pathname; }
      // A field is labelled by its kind, never by what is typed in it.
      if (c) l = c.matches('input,textarea,select,label') ? (c.type || c.tagName).toLowerCase() : (c.getAttribute('aria-label') || c.innerText || c.tagName).replace(/\s+/g, ' ').trim().slice(0, 30);
      else l = t && t.tagName ? t.tagName.toLowerCase() : '';
      q.push({ x: +(e.pageX / (document.documentElement.scrollWidth || 1)).toFixed(3), y: Math.round(e.pageY), k: c ? 'ctl' : 'dead', t: l });
      if (q.length >= 20) flush();
    }, true);
    addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  }
  var ps = history.pushState; // single-page apps
  if (ps) history.pushState = function () { ps.apply(this, arguments); setTimeout(send, 0); };
  addEventListener('popstate', send);
  if (document.visibilityState === 'prerender') document.addEventListener('visibilitychange', send, { once: true }); else send();
})();
