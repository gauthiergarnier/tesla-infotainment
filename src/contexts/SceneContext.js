import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_SCENE } from '../config/sceneOptions';

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
             ambient, setAmbient, exposure, setExposure }),
    [lights, toggleLight, resetLights, environment, ambient, exposure]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
};

export const useScene = () => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside <SceneProvider>');
  return ctx;
};

export default SceneContext;
