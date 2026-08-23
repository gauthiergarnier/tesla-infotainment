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
  ambient: 5.5,
  exposure: 1.45,
};

/**
 * The driving visualisation's road.
 *
 * The app never moves the car: VehicleManager spins the wheel nodes from speed
 * and wheel radius, and Road.gd scrolls the lane materials' uv1_offset. These
 * are its own numbers - road.tscn puts the lane lines at +/-1.8 m and -5.2 m,
 * and spline_mesh.tres makes each line 0.1 m wide over 100 m with the dash
 * texture tiled 8 times, i.e. one dash cycle every 12.5 m.
 */
export const LANES = [
  // Far edge and the near shoulder read white; the centre line is the yellow
  // divider, which is what the day visualisation shows on a US road.
  { x: -5.2, dashed: false, color: '#f4f4f4' },
  { x: -1.8, dashed: true, color: '#e0b53c' },
  { x: 1.8, dashed: false, color: '#f4f4f4' },
];

export const ROAD_SURFACE = '#9a9da1';
// The surface plane's opacity. 0 leaves only the lane markings, floating on the
// screen background - which is what "transparent road" asks for.
export const ROAD_SURFACE_OPACITY = 0;
export const LANE_WIDTH = 0.1;
export const ROAD_LENGTH = 240;
export const DASH_CYCLE_M = 12.5;
export const LANE_TEXTURE = base.replace('/env/', '/road/') + 'dashed_lane.png';
