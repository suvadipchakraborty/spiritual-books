/**
 * Spiritual Library — Cloudflare Worker
 *
 * The app itself is a static, offline-capable frontend (see /public).
 * This Worker's only job is to serve those assets and add a couple of
 * sane defaults (security headers, cache hints) on the way out.
 *
 * Deploy: connect this repo to Cloudflare Workers via the Git integration.
 * Build command: (none needed)  |  Deploy command: npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    const response = await env.ASSETS.fetch(request);

    // Clone so we can add headers to an immutable Response.
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    const url = new URL(request.url);
    // Long-cache immutable static assets, short-cache the HTML shell so
    // updates roll out quickly without breaking the PWA offline story.
    if (/\.(css|js|svg|png|jpg|webp|woff2?)$/.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (url.pathname.endsWith(".html") || url.pathname === "/") {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
