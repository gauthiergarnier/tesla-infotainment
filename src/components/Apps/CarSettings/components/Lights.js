import React from 'react';
import { useScene } from '../../../../contexts/SceneContext';
import { LIGHT_CONTROLS, ENVIRONMENTS } from '../../../../config/sceneOptions';
import './Lights.css';

/**
 * The Lights settings page, wired to the same controls the tesla-3d-viewer
 * exposes: the car's own switchable light states, the backdrop, and the two
 * global exposure controls.
 *
 * Everything here drives the car card in the left panel live, so it doubles as
 * the lighting rig for a recording.
 */
export const Lights = () => {
  const {
    lights, toggleLight, resetLights,
    environment, setEnvironment,
    ambient, setAmbient,
    exposure, setExposure,
  } = useScene();

  const anyOn = Object.values(lights).some(Boolean);

  return (
    <div className="lightsPane">
      <section className="lsSection">
        <div className="lsHead">
          <span className="lsLabel">Exterior Lights</span>
          {anyOn && (
            <button className="lsReset" onClick={resetLights}>All off</button>
          )}
        </div>
        <div className="lsChips">
          {LIGHT_CONTROLS.map(({ key, label, glyph }) => (
            <button
              key={key}
              className={`lsChip${lights[key] ? ' on' : ''}`}
              aria-pressed={!!lights[key]}
              onClick={() => toggleLight(key)}
            >
              {glyph && key === 'turnL' && <span className="lsGlyph">{glyph}</span>}
              {label}
              {glyph && key === 'turnR' && <span className="lsGlyph">{glyph}</span>}
            </button>
          ))}
        </div>
        <p className="lsDescription">
          Indicators blink and cancel each other the way they do on the car;
          hazards fire both. Each lamp lights its own projected pool on the road.
        </p>
      </section>

      <section className="lsSection">
        <div className="lsLabel">Environment</div>
        <div className="lsChips">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env.key}
              className={`lsChip${environment === env.key ? ' on' : ''}`}
              aria-pressed={environment === env.key}
              onClick={() => setEnvironment(env.key)}
            >
              {env.name}
            </button>
          ))}
        </div>
        <p className="lsDescription">
          Only the backdrop changes. Reflections always come from the studio
          panorama, which is what keeps the paint reading the way the app does.
        </p>
      </section>

      <section className="lsSection">
        <div className="lsLabel">Exposure</div>

        <label className="lsSlider">
          <span className="lsSliderName">Ambient light</span>
          <input
            type="range" min="0" max="8" step="0.1"
            value={ambient}
            onChange={(e) => setAmbient(parseFloat(e.target.value))}
          />
          <span className="lsSliderValue">{ambient.toFixed(1)}</span>
        </label>

        <label className="lsSlider">
          <span className="lsSliderName">Exposure</span>
          <input
            type="range" min="0.2" max="2.5" step="0.05"
            value={exposure}
            onChange={(e) => setExposure(parseFloat(e.target.value))}
          />
          <span className="lsSliderValue">{exposure.toFixed(2)}</span>
        </label>
      </section>
    </div>
  );
};

export default Lights;
