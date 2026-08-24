/**
 * App and control icons, in three tiers.
 *
 *  1. COLORED_FIRMWARE - the car's own coloured brand tiles for the streaming
 *     services, pulled from /opt/media-webapp/images/sources/ in the MCU image
 *     (Spotify green, Apple Music red, Tidal, YouTube Music). Rendered in full
 *     colour, exactly as the car shows them.
 *
 *  2. MONO_FIRMWARE - monochrome glyphs from /usr/tesla/UI/assets, used ONLY for
 *     basic car functions (wipers, defrost, seats, fan) and UI controls (the
 *     app-launcher grid). These are tinted to suit the surface they sit on.
 *
 *  3. Everything else falls through to the project's own coloured `app-*.svg`,
 *     which are proper brand/app tiles in their own right.
 *
 * So: apps are colourful, only genuine car-feature toggles are monochrome -
 * which is how the real dash draws them.
 *
 * Refresh with: npm run import:firmware-icons -- /path/to/tesla-3d-renders-fw
 */

const BASE = 'tesla/';

// Tier 1: coloured brand tiles (firmware).
export const COLORED_FIRMWARE = {
  spotify: 'apps/spotify.png',
  'apple-music': 'apps/apple-music.png',
  tidal: 'apps/tidal.png',
  'youtube-music': 'apps/youtube-music.png',
};

// Tier 2: monochrome glyphs - car features and controls only.
export const MONO_FIRMWARE = {
  // climate / comfort toggles (app/launcher)
  wipers: 'launcher/icon_wipers.png',
  'defrost-front': 'launcher/icon_front_defrost.png',
  'defrost-rear': 'launcher/icon_rear_defrost.png',
  'left-seat': 'launcher/icon_left_seat.png',
  'right-seat': 'launcher/icon_right_seat.png',
  fan: 'climate_icon.png',
  // the app-launcher grid button
  'open-shelf': 'dock_apps.png',
  'close-shelf': 'dock_apps.png',
};

/** Status-bar and chrome glyphs, same monochrome library. */
export const TESLA_UI_ICONS = {
  wifi: 'wifi_icon.png',
  lock: 'lock_icon.png',
  battery: 'battery_icon.png',
  autopilot: 'autopilot_icon.png',
  sentry: 'sentry_icon.png',
  tesla: 'tesla_icon.png',
  search: 'control_panel_search_icon.png',
};

/** Firmware file for a name, colour tier first, or null to fall back to SVG. */
export function teslaIconFile(name) {
  const f = COLORED_FIRMWARE[name] || MONO_FIRMWARE[name] || TESLA_UI_ICONS[name];
  return f ? BASE + f : null;
}

/** True when the icon is a monochrome glyph that must be tinted for its surface. */
export function isMonoIcon(name) {
  return !!MONO_FIRMWARE[name] || !!TESLA_UI_ICONS[name];
}

export default COLORED_FIRMWARE;
