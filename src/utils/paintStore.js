import { useSyncExternalStore, useCallback } from 'react';
import { DEFAULT_COLOR } from '../config/vehicleConfig';

/**
 * Paint Shop state — colour, paint type, trim and the current wrap.
 *
 * The car keeps this in its Colorizer (Software → paint override), and both the
 * settings UI and the 3D car card need it, so it lives outside React as a
 * module store rather than in either component. Provider-free, like
 * vehicleSettings, so nothing has to be re-parented in App.js.
 */

const defaults = {
  colorKey: DEFAULT_COLOR,
  paintType: 'Metallic',   // Solid | Metallic | Matte
  trim: 'Chrome',          // Chrome | Black  (the car's "chrome delete")
  wrap: null,              // wrap descriptor, or null for bare paint
  customWraps: [],         // wraps the user uploaded this session
};

let state = { ...defaults };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export const getPaint = () => state;

export function setPaint(patch) {
  const next = { ...state, ...patch };
  let changed = false;
  for (const k of Object.keys(patch)) if (!Object.is(state[k], next[k])) changed = true;
  if (!changed) return;
  state = next;
  emit();
}

export function resetPaint() {
  // Keep uploads: the car's one-time reset restores the paint, not your library.
  state = { ...defaults, customWraps: state.customWraps };
  emit();
}

export function addCustomWrap(wrap) {
  state = { ...state, customWraps: [...state.customWraps, wrap], wrap };
  emit();
}

export function removeCustomWrap(key) {
  const wrap = state.wrap && state.wrap.key === key ? null : state.wrap;
  state = { ...state, customWraps: state.customWraps.filter((w) => w.key !== key), wrap };
  emit();
}

/** Subscribe to the whole paint state. */
export function usePaint() {
  return useSyncExternalStore(subscribe, () => state, () => defaults);
}

/** Subscribe to one key — `const [v, set] = usePaintValue('colorKey')`. */
export function usePaintValue(key) {
  const value = useSyncExternalStore(subscribe, () => state[key], () => defaults[key]);
  const set = useCallback((v) => setPaint({ [key]: v }), [key]);
  return [value, set];
}

/**
 * Paint type is a finish, not a colour: it rides on top of whatever the swatch
 * declares. Metallic keeps the firmware's own metalness/roughness for that
 * colour; Solid drops the flake and stays glossy; Matte kills both the flake
 * and the gloss, which is what Tesla's matte PPF options look like.
 */
export function finishFor(color, paintType) {
  if (paintType === 'Solid') return { metalness: 0, roughness: Math.max(0.05, color.roughness) };
  if (paintType === 'Matte') return { metalness: 0, roughness: 0.62 };
  return { metalness: color.metallic, roughness: color.roughness };
}

/** Window surrounds and mirror caps: bright, or the chrome-delete black. */
export const TRIMS = {
  Chrome: { color: 0xd8dade, metalness: 1.0, roughness: 0.12 },
  Black: { color: 0x121214, metalness: 0.55, roughness: 0.38 },
};

export default defaults;
