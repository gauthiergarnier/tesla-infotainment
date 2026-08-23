import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_SCENE } from '../config/sceneOptions';

/* The car's Display page offers Dark / Light / Auto, and Auto follows the
   clock. ?theme=day|night pins it, which keeps recorded takes deterministic. */
const initialAppearance = () => {
  if (typeof window === 'undefined') return 'auto';
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q === 'night') return 'dark';
  if (q === 'day') return 'light';
  return 'auto';
};

const isNightHour = () => {
  const hour = new Date().getHours();
  return hour < 7 || hour >= 19;
};

/**
 * Scene state shared between the Lights settings page and the car card.
 *
 * The settings page is rendered inside a slide-up panel that is unmounted when
 * closed, so this state cannot live there - it has to outlive the pane for the
 * headlights to stay on after you dismiss it.
 */
const SceneContext = createContext(null);

export const SceneProvider = ({ children }) => {
  const [lights, setLights] = useState(DEFAULT_SCENE.lights);
  const [environment, setEnvironment] = useState(DEFAULT_SCENE.environment);
  const [ambient, setAmbient] = useState(DEFAULT_SCENE.ambient);
  const [exposure, setExposure] = useState(DEFAULT_SCENE.exposure);
  /* Road speed in mph, shared so the speedometer and the visualisation cannot
     disagree - the wheels and the lane scroll are both derived from it. */
  const [speed, setSpeed] = useState(0);
  const [appearance, setAppearance] = useState(initialAppearance);
  const isDark = appearance === 'dark' || (appearance === 'auto' && isNightHour());

  const toggleLight = useCallback((key) => {
    setLights((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Hazards and the individual indicators are mutually exclusive on the
      // real car: arming hazards overrides a single indicator, and picking a
      // side cancels hazards.
      if (key === 'hazard' && next.hazard) { next.turnL = false; next.turnR = false; }
      if ((key === 'turnL' || key === 'turnR') && next[key]) next.hazard = false;
      return next;
    });
  }, []);

  const resetLights = useCallback(() => setLights(DEFAULT_SCENE.lights), []);

  const value = useMemo(
    () => ({ lights, toggleLight, resetLights, environment, setEnvironment,
             ambient, setAmbient, exposure, setExposure, speed, setSpeed,
             appearance, setAppearance, isDark }),
    [lights, toggleLight, resetLights, environment, ambient, exposure, speed, appearance, isDark]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
};

export const useScene = () => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside <SceneProvider>');
  return ctx;
};

export default SceneContext;
