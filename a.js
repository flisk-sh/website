/* Flisk Analytics: one pageview beacon, no cookies, no storage that identifies anyone.
   <script defer data-domain="example.com" src="https://flisk.sh/a.js"></script> */
(function () {
  var s = document.currentScript, d = s && s.getAttribute('data-domain');
  if (!d || navigator.webdriver || /Headless/i.test(navigator.userAgent)) return;
  var api = (s.getAttribute('data-api') || 'https://analytics.flisk.si') + '/e', last = '';
  function sid() {
    try { var k = '_fa', v = sessionStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem(k, v); } return v; } catch (e) { return ''; }
  }
  function send() {
    var p = location.pathname;
    if (p === last) return; // reloads and repeat route events count once
    last = p;
    var u = new URLSearchParams(location.search).get('utm_campaign') || '';
    var body = JSON.stringify({ d: d, p: p, r: document.referrer, s: sid(), u: u });
    if (navigator.sendBeacon) navigator.sendBeacon(api, body); else fetch(api, { method: 'POST', body: body, keepalive: true });
  }
  var ps = history.pushState; // single-page apps
  if (ps) history.pushState = function () { ps.apply(this, arguments); setTimeout(send, 0); };
  addEventListener('popstate', send);
  if (document.visibilityState === 'prerender') document.addEventListener('visibilitychange', send, { once: true }); else send();
})();
