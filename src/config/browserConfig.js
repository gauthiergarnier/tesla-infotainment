/**
 * Configuration for the in-dash web browser simulator.
 *
 * The real car runs Chromium behind Tesla's own Qt-drawn chrome — every
 * chromium instance in the firmware is launched with `--disable-toolbar
 * --disable-location-bar --disable-tab-strip`, so the URL field, the
 * back/forward/reload buttons and the favourites folder you see on screen are
 * Tesla UI, not Chrome UI. That is what `Browser.js` recreates.
 *
 * CONTENT MODES
 * -------------
 *   'live'    renders the site in an <iframe>. Only works for origins that
 *             allow being framed (see FRAMING below).
 *   'screens' renders a scripted sequence of stills / video from
 *             `public/demo/`. Use this to record a walkthrough of features
 *             that cannot be framed, or that need a logged-in session.
 *
 * FRAMING
 * -------
 * As of this writing codriver.io responds with:
 *
 *     x-frame-options: DENY
 *     content-security-policy-report-only: ... frame-ancestors 'none' ...
 *
 * so it will NOT render in 'live' mode until the origin running this
 * simulator is allow-listed. To enable live mode, serve codriver.io with:
 *
 *     Content-Security-Policy: frame-ancestors 'self' http://localhost:3000
 *                              https://<your-gh-pages-domain>;
 *
 * and drop the `x-frame-options: DENY` header for those paths (XFO has no
 * allow-list syntax — `frame-ancestors` supersedes it in modern browsers, but
 * XFO: DENY still wins where both are present).
 *
 * Pointing at a local dev server (http://localhost:5173 etc.) is usually the
 * fastest path: you control the headers there.
 */

export const USER_AGENT_SUFFIX = ' Tesla/2026.8.3-11442';

/** Where the browser lands when the app is opened cold. */
export const HOME_URL = 'https://codriver.io';

/**
 * Favourites, shown in the drop-down that the folder-with-star button opens.
 * `label` is what appears under the tile.
 */
export const BOOKMARKS = [
  { label: 'CoDriver', url: 'https://codriver.io' },
  { label: 'Dashboard', url: 'https://codriver.io/dashboard' },
  { label: 'Trips', url: 'https://codriver.io/trips' },
  { label: 'Local dev', url: 'http://localhost:5173' },
  { label: 'Tesla', url: 'https://www.tesla.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
];

/**
 * Scripted walkthrough used by 'screens' mode.
 *
 * Drop stills or a screen recording into `public/demo/` and list them here.
 * Each step is one "page" — the address bar shows `url`, and stepping through
 * them with the on-screen arrows (or the ← / → keys) advances the story, so a
 * single screen recording of this simulator produces a clean feature demo
 * even when the real site refuses to be framed.
 *
 * `src` may be an image (.png/.jpg/.webp) or a video (.mp4/.webm).
 */
export const DEMO_SCREENS = [
  {
    url: 'https://codriver.io',
    title: 'CoDriver',
    src: null, // e.g. `${process.env.PUBLIC_URL}/demo/01-home.png`
    caption: 'Drop a screenshot at public/demo/01-home.png to fill this frame.',
  },
];

/** Simulated network latency for the loading bar, in milliseconds. */
export const LOAD_TIME_MS = 900;

/**
 * Normalises whatever the user typed in the address bar into a URL.
 * Mirrors the real thing: anything that does not look like a host becomes a
 * search query.
 */
export function normaliseInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (/^localhost(:\d+)?(\/|$)/i.test(value)) return `http://${value}`;
  if (/^[^\s/]+\.[^\s/]{2,}(\/|$|:)/.test(value)) return `https://${value}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

/** Strips the scheme for display, the way the car's address bar does. */
export function displayUrl(url) {
  return String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
