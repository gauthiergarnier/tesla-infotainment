// Where the Browser app's web view points (ALL-25).
//
// codriver ships a demo mode behind `?demo=1` — a synthetic driver that routes
// between two addresses and drives the polyline, accelerating to the road limit
// and braking for corners. Framing it inside the simulator's Browser app is how
// codriver gets shown on a car screen without a car.
//
// The environment picks the codriver deployment: a staging build of this
// simulator frames staging, a production build frames production. That pairing
// is deliberate — a staging codriver is the one that gets broken, and it should
// only ever be able to break a staging screen.
const CODRIVER_HOSTS = {
  production: 'https://app.codriver.io',
  staging: 'https://app.staging.codriver.io',
};

const DEFAULT_ENV = 'staging';

/**
 * Which codriver deployment this build talks to.
 *
 * `REACT_APP_CODRIVER_ENV` wins when it names a known deployment; otherwise a
 * production build defaults to production and everything else to staging, so a
 * `npm start` on a laptop never points at the live driver app by accident.
 */
export function codriverEnv() {
  const named = process.env.REACT_APP_CODRIVER_ENV;
  if (named && CODRIVER_HOSTS[named]) return named;
  return process.env.NODE_ENV === 'production' ? 'production' : DEFAULT_ENV;
}

/** Origin of the codriver deployment this build talks to. */
export function codriverOrigin() {
  return CODRIVER_HOSTS[codriverEnv()];
}

/**
 * The URL the Browser app opens on.
 *
 * `REACT_APP_CODRIVER_DEMO_URL` overrides the whole thing — that is the escape
 * hatch for pointing at a codriver running on localhost while working on both
 * repos at once. It is used verbatim, `?demo=1` included, because a local
 * server rarely lives at the root of its origin.
 */
export function codriverDemoUrl() {
  const override = process.env.REACT_APP_CODRIVER_DEMO_URL;
  if (override) return override;
  return `${codriverOrigin()}/?demo=1`;
}

/**
 * Is this URL a codriver demo page — one that will answer the Browser app's
 * handshake?
 *
 * Both halves matter: a codriver page without `demo=1` never loads demo.js and
 * so never says hello, and the explicit override can point anywhere at all
 * (a localhost port, most often), which is still a demo.
 */
export function isCodriverDemoUrl(url) {
  let parsed;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return false;
  }
  if (parsed.searchParams.get('demo') !== '1') return false;
  if (parsed.origin === codriverOrigin()) return true;
  const override = process.env.REACT_APP_CODRIVER_DEMO_URL;
  return Boolean(override) && url === override;
}
