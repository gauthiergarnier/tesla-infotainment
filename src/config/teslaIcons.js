/**
 * The car's own icon set.
 *
 * Extracted from the MCU image at /usr/tesla/UI/assets/day/ - the main library
 * lives in ui-styled-dom/icons/ (50x50 grey-on-transparent PNGs), with the
 * climate and seat tiles in app/launcher/ and the browser chrome in web/.
 * "day" is the light theme; the image also carries a darkDay set.
 *
 * Anything absent from this map keeps the project's own SVG - the third-party
 * music services and a few app tiles are not loose files in the firmware.
 *
 * Refresh with: npm run import:firmware-icons -- /path/to/tesla-3d-renders-fw
 */

const BASE = 'tesla/';

export const TESLA_APP_ICONS = {
  // ui-styled-dom/icons
  arcade: 'arcade_icon.png',
  bluetooth: 'bluetooth_icon.png',
  caraoke: 'caraoke_icon.png',
  dashcam: 'dashcam_icon.png',
  theater: 'entertainment_icon.png',
  manual: 'manual_icon.png',
  messages: 'message_icon.png',
  nav: 'nav_icon.png',
  phone: 'phone_icon.png',
  radio: 'radio_icon.png',
  spotify: 'spotify_icon.png',
  tidal: 'tidal_icon.png',
  toybox: 'toybox_icon.png',
  energy: 'charging_icon.png',
  fan: 'climate_icon.png',

  // app/launcher - the climate strip along the top of the shelf
  camera: 'launcher/icon_camera_preview.png',
  wipers: 'launcher/icon_wipers.png',
  'defrost-front': 'launcher/icon_front_defrost.png',
  'defrost-rear': 'launcher/icon_rear_defrost.png',
  'left-seat': 'launcher/icon_left_seat.png',
  'right-seat': 'launcher/icon_right_seat.png',
};

/** Status-bar and chrome glyphs, same library. */
export const TESLA_UI_ICONS = {
  wifi: 'wifi_icon.png',
  lock: 'lock_icon.png',
  battery: 'battery_icon.png',
  autopilot: 'autopilot_icon.png',
  sentry: 'sentry_icon.png',
  tesla: 'tesla_icon.png',
  seats: 'seats_icon.png',
  software: 'software_icon.png',
  climate: 'climate_icon.png',
  charging: 'charging_icon.png',
  voice: 'voice_icon.png',
  search: 'control_panel_search_icon.png',
};

export function teslaIconFile(name) {
  const f = TESLA_APP_ICONS[name] || TESLA_UI_ICONS[name];
  return f ? BASE + f : null;
}

export default TESLA_APP_ICONS;
