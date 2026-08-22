/**
 * The car fleet, straight out of Tesla's own asset pack.
 *
 * The Tesla Android app embeds a real Godot runtime (`libgodot_android.so`) and
 * ships the same `Ego/*` scenes the car's own screen renders — the manifest
 * entries still carry their `res://Ego/3_High/Model3_High.tscn` source paths.
 * They were exported to glTF and meshopt/WebP-compressed by the
 * tesla-3d-renders pipeline, which is why 12 vehicles plus 54 wheel designs fit
 * in roughly the space the single marketplace model used to take.
 *
 * `manifest.json` carries, per vehicle: wheel mount matrices, the wheel designs
 * that fit it, markers (seats, steering wheel, front/rear extents), interior
 * material slots, and the names of the paint materials to tint.
 *
 * Pick with `?vehicle=modely_juniper`, or from the picker in the car card.
 */

import manifest from './teslaManifest.json';
import colorData from './teslaColors.json';

export const MANIFEST = manifest;
export const VEHICLES = manifest.vehicles;
export const WHEELS = manifest.wheels;
export const COLORS = colorData.colors;
export const COLOR_FALLBACK = colorData.fallback;

/** Display names, in the order the app lists them. */
export const VEHICLE_LABELS = {
  model3: 'Model 3',
  model3_highland: 'Model 3 (Highland)',
  modely: 'Model Y',
  modely_juniper: 'Model Y (Juniper)',
  modely_e41: 'Model Y (E41)',
  modely_e80: 'Model Y (E80)',
  models: 'Model S',
  models_palladium: 'Model S (Palladium)',
  modelx: 'Model X',
  modelx_palladium: 'Model X (Palladium)',
  cybertruck: 'Cybertruck',
  semi: 'Semi',
};

export const VEHICLE_IDS = Object.keys(VEHICLE_LABELS).filter((id) => VEHICLES[id]);

/** Where the .glb files live under public/. */
export const MODEL_BASE = 'tesla/';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

function pick(key, allowed, fallback) {
  const v = params.get(key);
  return v && allowed.includes(v) ? v : fallback;
}

export const DEFAULT_VEHICLE = pick('vehicle', VEHICLE_IDS, 'model3_highland');
export const DEFAULT_COLOR = pick('color', COLORS.map((c) => c.key), 'PearlWhite');

/** Wheel designs that actually fit a given vehicle, sorted for display. */
export function wheelsFor(vehicleId) {
  const v = VEHICLES[vehicleId];
  if (!v) return [];
  const tol = 0.2;
  return (v.wheels || [])
    .map((k) => ({ key: k, ...WHEELS[k] }))
    .filter((w) => w.file && Math.abs(w.radius - v.wheel_radius) / v.wheel_radius < tol)
    .sort((a, b) => (a.label || a.key).localeCompare(b.label || b.key));
}

export function colorByKey(key) {
  return COLORS.find((c) => c.key === key) || COLORS.find((c) => c.key === COLOR_FALLBACK) || COLORS[0];
}

/**
 * Tesla node names for the parts the UI animates. These hold across the whole
 * Ego family, which is why the fleet can share one component.
 */
export const PARTS = {
  frunk: 'Hood',
  trunk: 'Trunk',
  doors: ['Door_LF', 'Door_LR', 'Door_RF', 'Door_RR'],
  // The falcon doors on the X are a different node again.
  falconDoors: ['Door_LR_Falcon', 'Door_RR_Falcon'],
};
