// Security headers for flisk.sh and www.flisk.sh (GitHub Pages cannot set headers itself).
// Deployed as the Cloudflare Worker "flisk-apex-headers"; routes are in wrangler.toml.
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://flisk.si https://flisk.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com https://cdn.jsdelivr.net; font-src 'self' data: https://fonts.gstatic.com https://cdn.fontshare.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:; object-src 'none'; frame-ancestors 'self' https://analytics.flisk.si; base-uri 'self'; form-action 'self' https:";
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default {
  async fetch(request) {
    const res = await fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
    out.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    // analytics.flisk.si frames the site for the click heatmap. X-Frame-Options is not sent: it cannot allowlist another origin.
    out.headers.set("Content-Security-Policy", CSP);
    return out;
  },
};
