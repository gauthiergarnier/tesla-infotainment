/**
 * Every app and control icon, sourced from the MCU firmware for one consistent
 * look. Two tiers:
 *
 *  1. COLORED_FIRMWARE - the car's own coloured brand tiles for the streaming
 *     services, from /opt/media-webapp/images/sources/ (their transparent
 *     padding trimmed so they fill the tile like the rest). These are the only
 *     app icons the firmware ships in colour.
 *
 *  2. MONO_FIRMWARE - monochrome glyphs from /usr/tesla/UI/assets. Tesla's own
 *     apps (camera, dashcam, toybox...) and the car-feature toggles (wipers,
 *     defrost, seats, fan) are monochrome in the firmware - the coloured phone
 *     / bluetooth tiles on the real dash are drawn by QtCar, not shipped as
 *     files - so unifying on firmware means these are monochrome, tinted to
 *     suit the surface they sit on.
 *
 * Anything not listed falls through to the project's own `app-*.svg`.
 *
 * Refresh with: npm run import:firmware-icons -- /path/to/tesla-3d-renders-fw
 */

const BASE = 'tesla/';

// Tier 1: coloured brand tiles (firmware), padding trimmed.
export const COLORED_FIRMWARE = {
  spotify: 'apps/spotify.png',
  'apple-music': 'apps/apple-music.png',
  tidal: 'apps/tidal.png',
  'youtube-music': 'apps/youtube-music.png',
};

// Tier 2: monochrome firmware glyphs.
export const MONO_FIRMWARE = {
  // Tesla apps (ui-styled-dom/icons)
  camera: 'camera_icon.png',
  bluetooth: 'bluetooth_icon.png',
  dashcam: 'dashcam_icon.png',
  toybox: 'toybox_icon.png',
  arcade: 'arcade_icon.png',
  nav: 'nav_icon.png',
  phone: 'phone_icon.png',
  messages: 'message_icon.png',
  manual: 'manual_icon.png',
  caraoke: 'caraoke_icon.png',
  radio: 'radio_icon.png',
  theater: 'entertainment_icon.png',
  energy: 'charging_icon.png',

  // Car-feature toggles - single-frame HVAC glyphs (hvac/icons)
  wipers: 'feat/wipers.png',
  'defrost-front': 'feat/defrost-front.png',
  'defrost-rear': 'feat/defrost-rear.png',
  'left-seat': 'feat/left-seat.png',
  'right-seat': 'feat/right-seat.png',
  fan: 'feat/fan.png',

  // App-launcher grid button
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
