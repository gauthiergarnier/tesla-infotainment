/**
 * The lighting controls the tesla-3d-viewer exposes, ported so the car's own
 * Lights settings page can drive them.
 *
 * The light emission colours and the mesh classifier are taken from the viewer,
 * which read them out of the app's own materials: indicators bloom amber
 * Color(1, 0.529, 0), headlights and DRL warm white, brakes red.
 */

export const LIGHT_COLORS = {
  head: 0xfff6ec,     // warm white DRL / headlights
  brake: 0xff1a10,    // tail / brake red
  reverse: 0xf2f5ff,  // cool white reverse
  turn: 0xff8a00,     // amber indicator
  fog: 0xfff2e0,
};

/**
 * Which control a light mesh belongs to, from its node name.
 *
 * `beam` marks the flat pool projected on the road, so it can ride along with
 * its lamp - the front pool with the headlights, the rear one with the brakes.
 * Indicators carry a side so Left / Right / Hazards fire the right ones.
 */
export function classifyLight(name) {
  const n = String(name || '').toLowerCase();
  const beam = /projection|projections/.test(n);
  const side = /left|_l_|\bl\b|lf|lr/.test(n) ? 'L'
    : (/right|_r_|\br\b|rf|rr/.test(n) ? 'R' : null);
  if (/turn_signal|turn signal|blinker|indicator/.test(n)) {
    return { group: 'turn', side: side || 'L', beam };
  }
  if (/reverse/.test(n)) return { group: 'reverse', beam };
  if (/brake|stop|taillight|tail_light|bed_light/.test(n)) return { group: 'brake', beam };
  if (/fog/.test(n)) return { group: 'head', sub: 'fog', beam };
  return { group: 'head', beam };
}

/** Controls, in the order the viewer lists them. */
export const LIGHT_CONTROLS = [
  { key: 'head', label: 'Headlights' },
  { key: 'brake', label: 'Brake' },
  { key: 'reverse', label: 'Reverse' },
  { key: 'turnL', label: 'Left', glyph: '◀' },
  { key: 'turnR', label: 'Right', glyph: '▶' },
  { key: 'hazard', label: 'Hazards' },
];

/**
 * Environments. Only the backdrop differs - the viewer found the studio
 * panorama flattering enough that every environment borrows it for reflections,
 * so scene.environment stays the studio IBL throughout and this only changes
 * what sits behind the car.
 */
const base = (process.env.PUBLIC_URL || '') + '/env/';

export const ENVIRONMENTS = [
  { key: 'studio', name: 'Studio', kind: 'equirect', url: base + 'New_Studio.png' },
  { key: 'cloud', name: 'Clouds', kind: 'cube', dir: base + 'cloud/' },
  { key: 'star', name: 'Night', kind: 'cube', dir: base + 'star/' },
  { key: 'light', name: 'Light', kind: 'solid', color: 0xededed },
  { key: 'dark', name: 'Dark', kind: 'solid', color: 0x15171b },
];

/** Shared by every environment, per the viewer's own note. */
export const REFLECTION_URL = base + 'studio_ibl.png';

export const CUBE_FACES = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];

export const DEFAULT_SCENE = {
  lights: { head: false, brake: false, reverse: false, turnL: false, turnR: false, hazard: false },
  environment: 'dark',
  ambient: 3.5,
  exposure: 1.0,
};
