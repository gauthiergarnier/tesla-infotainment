import { useSyncExternalStore, useCallback } from 'react';

/**
 * Vehicle settings store.
 *
 * Each sub-menu unmounts when you leave it, so component state would reset
 * every time you switched pages — on the car a toggle obviously stays where you
 * put it. This keeps one flat map of setting -> value outside React and lets
 * any panel subscribe to a single key.
 *
 * It is deliberately provider-free (useSyncExternalStore over a module-level
 * store) so CarSettings stays self-contained: no new wrapper in App.js, and the
 * same values are readable from anywhere else in the app later — the dock, the
 * car card — without re-parenting the tree.
 *
 * Defaults below are the car's own out-of-the-box values where the firmware or
 * the owner's manual states one.
 */

const defaults = {
  // Controls
  headlights: 'Auto',
  highBeams: false,
  foldMirrors: false,
  childLock: 'Off',
  windowLock: false,
  wipers: 'Auto',
  wiperSpeed: null,
  dashcam: true,
  sentry: false,
  brightness: 100,
  brightnessAuto: true,

  // Dynamics
  acceleration: 'Chill',
  steeringMode: 'Standard',
  stoppingMode: 'Hold',
  applyBrakesRegen: true,
  offroadAssist: false,
  slipStart: false,

  // Charging
  chargeLimit: 80,
  chargeCurrent: 32,
  chargePortUnlock: true,
  scheduledCharging: false,
  scheduledDeparture: false,

  // Autopilot
  autosteerSpeedOffset: 5,
  lanesDepartureAvoidance: 'Warning',
  emergencyLaneAvoidance: true,
  forwardCollisionWarning: 'Medium',
  obstacleAwareAccel: false,
  autopilotChime: true,
  greenLightChime: false,
  followDistance: 4,
  autoLaneChange: true,
  navigateOnAutopilot: false,
  summonStandby: false,

  // Locks
  walkAwayLock: true,
  unlockOnPark: false,
  driveAwayLock: true,
  excludeHome: false,
  phoneKeyOnly: false,
  pinToDrive: false,
  glovebox: false,

  // Lights (car's own, not the render rig)
  ambientLights: true,
  lightsAfterExit: 'On',
  autoHighBeam: true,
  puddleLights: true,

  // Display
  displayTheme: 'Auto',
  displayBrightnessAuto: true,
  touchscreenLanguage: 'English',
  distanceUnits: 'Miles',
  temperatureUnits: 'Fahrenheit',
  tirePressureUnits: 'PSI',
  energyUnits: 'Wh/mi',
  timeFormat: '12h',
  cleanScreen: false,

  // Navigation
  navAvoidTolls: false,
  navAvoidFerries: true,
  navOnlineRouting: true,
  navTrafficVisualization: true,
  navSatellite: false,
  navAutoNavigate: false,
  navMinimizeDrive: true,
  navTripPlanner: true,

  // Safety
  speedLimitWarning: 'Chime',
  speedLimitOffset: 5,
  lockConfirmSound: true,
  parkAssistChimes: true,
  cabinCameraAnalytics: false,
  cabinOverheatProtection: 'On',
  joeMode: false,

  // Service
  serviceMode: false,
  tirePressureFront: 42,
  tirePressureRear: 42,
  wheelType: '19" Gemini',

  // Software
  softwarePreference: 'Standard',
  autoUpdate: true,

  // Wifi
  wifiEnabled: true,
  wifiNetwork: 'Home 5G',
  hotspotEnabled: false,
};

let state = { ...defaults };
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSetting = (key) => state[key];

export const setSetting = (key, value) => {
  if (Object.is(state[key], value)) return;
  state = { ...state, [key]: value };
  emit();
};

export const resetSettings = () => {
  state = { ...defaults };
  emit();
};

/**
 * Read one setting and get a setter for it — `const [v, setV] = useSetting(k)`,
 * so panels read like ordinary useState consumers.
 */
export const useSetting = (key) => {
  const value = useSyncExternalStore(
    subscribe,
    () => state[key],
    () => defaults[key],
  );
  const set = useCallback((next) => setSetting(key, next), [key]);
  return [value, set];
};

/** Toggle helper for the many boolean rows. */
export const useToggle = (key) => {
  const [value, set] = useSetting(key);
  const toggle = useCallback(() => setSetting(key, !state[key]), [key]);
  return [value, toggle, set];
};

export default defaults;
