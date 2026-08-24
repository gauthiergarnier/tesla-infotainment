import React from 'react';
import { useScene } from '../../../../contexts/SceneContext';
import { LIGHT_CONTROLS, ENVIRONMENTS } from '../../../../config/sceneOptions';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, Segmented, SwitchRow, SliderRow, Action,
} from './ui/SettingsUI';
import './Lights.css';

/**
 * Lights.
 *
 * Two halves. The top is the car's own Lights page — the settings a driver
 * actually finds here. The bottom is this fork's addition: the same switches
 * wired to the 3D scene, so the car card in the left panel can be lit for a
 * recording without leaving the settings screen. The rig keeps its own styling
 * (Lights.css) because it is a tool, not a reproduction of a car screen.
 */
export const Lights = () => {
  const {
    lights, toggleLight, resetLights,
    environment, setEnvironment,
    ambient, setAmbient,
    exposure, setExposure,
  } = useScene();

  const [ambientLights, setAmbientLights] = useSetting('ambientLights');
  const [afterExit, setAfterExit] = useSetting('lightsAfterExit');
  const [autoHighBeam, setAutoHighBeam] = useSetting('autoHighBeam');
  const [fogLights, setFogLights] = useSetting('fogLights');

  const anyOn = Object.values(lights).some(Boolean);

  return (
    <Pane>
      <Section title="Vehicle Lights">
        <Row
          label="Headlights After Exit"
          description="How long the headlights stay on after you walk away."
        >
          <Segmented
            options={['Off', 'On', '1 min', '2 min']}
            value={afterExit}
            onChange={setAfterExit}
          />
        </Row>

        <SwitchRow
          label="Auto High Beam"
          description="Switches between high and low beams based on oncoming traffic."
          checked={autoHighBeam}
          onChange={setAutoHighBeam}
        />

        <SwitchRow
          label="Fog Lights"
          description="Front fog lamps, available when the headlights are on."
          checked={fogLights}
          onChange={setFogLights}
        />

        <SwitchRow
          label="Ambient Lights"
          description="Interior accent lighting on the dash and doors."
          checked={ambientLights}
          onChange={setAmbientLights}
        />

      </Section>

      {/* --- fork addition: lighting rig for the 3D car card --------------- */}

      <Section
        title="Exterior Lights (Render Rig)"
        note="Indicators blink and cancel each other the way they do on the car; hazards
              fire both. Each lamp lights its own projected pool on the road."
      >
        <Row stack>
          <div className="lsHead">
            <span className="tsDesc">Drives the car in the left panel live.</span>
            {anyOn && <Action label="All off" onClick={resetLights} />}
          </div>
          <div className="lsChips">
            {LIGHT_CONTROLS.map(({ key, label, glyph }) => (
              <button
                key={key}
                type="button"
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
        </Row>
      </Section>

      <Section
        title="Environment"
        note="Only the backdrop changes. Reflections always come from the studio panorama,
              which is what keeps the paint reading the way the app does."
      >
        <Row stack>
          <div className="lsChips">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.key}
                type="button"
                className={`lsChip${environment === env.key ? ' on' : ''}`}
                aria-pressed={environment === env.key}
                onClick={() => setEnvironment(env.key)}
              >
                {env.name}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Exposure">
        <Row label="Ambient light" stack>
          <SliderRow
            value={ambient}
            min={0}
            max={8}
            step={0.1}
            onChange={setAmbient}
            format={(v) => v.toFixed(1)}
          />
        </Row>
        <Row label="Exposure" stack>
          <SliderRow
            value={exposure}
            min={0.2}
            max={2.5}
            step={0.05}
            onChange={setExposure}
            format={(v) => v.toFixed(2)}
          />
        </Row>
      </Section>
    </Pane>
  );
};

export default Lights;
