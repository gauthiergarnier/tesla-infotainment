import React from 'react';
import { useSetting } from '../vehicleSettings';
import { useScene } from '../../../../contexts/SceneContext';
import {
  Pane, Section, Row, Segmented, SwitchRow, SliderRow, Action, ChevronRow,
} from './ui/SettingsUI';

/**
 * Display — appearance, then the unit choices.
 *
 * The units block is the densest set of segmented rows in the whole settings
 * screen: six two- or three-way choices stacked with no descriptions, because
 * each one explains itself.
 */
export const Display = () => {
  // Display Mode is the one setting that reaches outside the vehicle store:
  // the theme lives in SceneContext (appearance -> isDark -> body.theme-dark),
  // shared with the car card and the render rig. Bridge the segmented labels
  // to that state so the control actually switches the screen. Auto follows
  // the clock (dark after 19:00).
  const { appearance, setAppearance } = useScene();
  const THEME_LABELS = { light: 'Light', dark: 'Dark', auto: 'Auto' };
  const theme = THEME_LABELS[appearance] || 'Auto';
  const setTheme = (label) => setAppearance(label.toLowerCase());
  const [brightness, setBrightness] = useSetting('brightness');
  const [brightnessAuto, setBrightnessAuto] = useSetting('brightnessAuto');
  const [distance, setDistance] = useSetting('distanceUnits');
  const [temperature, setTemperature] = useSetting('temperatureUnits');
  const [pressure, setPressure] = useSetting('tirePressureUnits');
  const [energy, setEnergy] = useSetting('energyUnits');
  const [timeFormat, setTimeFormat] = useSetting('timeFormat');
  const [cleanScreen, setCleanScreen] = useSetting('cleanScreen');
  const [textSize, setTextSize] = useSetting('textSize');

  return (
    <Pane>
      <Section title="Appearance">
        <Row
          label="Display Mode"
          description="Auto follows the headlights, switching to the dark theme after dark."
        >
          <Segmented
            options={['Light', 'Dark', 'Auto']}
            value={theme}
            onChange={setTheme}
          />
        </Row>

        <Row label="Brightness" stack>
          <SliderRow
            value={brightness}
            min={0}
            max={100}
            disabled={brightnessAuto}
            onChange={setBrightness}
            format={(v) => `${v}%`}
          />
        </Row>

        <SwitchRow
          label="Auto Brightness"
          description="Matches screen brightness to the light outside."
          checked={brightnessAuto}
          onChange={setBrightnessAuto}
        />
      </Section>

      <Section title="Text">
        <Row
          label="Text Size"
          description="Applies to lists and settings text, not the driving readouts."
        >
          <Segmented
            options={['Standard', 'Large', 'Largest']}
            value={textSize}
            onChange={setTextSize}
          />
        </Row>
      </Section>

      <Section title="Units">
        <Row label="Distance">
          <Segmented
            options={['Miles', 'Kilometers']}
            value={distance}
            onChange={setDistance}
          />
        </Row>
        <Row label="Temperature">
          <Segmented
            options={[
              { value: 'Fahrenheit', label: '°F' },
              { value: 'Celsius', label: '°C' },
            ]}
            value={temperature}
            onChange={setTemperature}
          />
        </Row>
        <Row label="Tire Pressure">
          <Segmented options={['PSI', 'BAR']} value={pressure} onChange={setPressure} />
        </Row>
        <Row label="Energy">
          <Segmented
            options={['Wh/mi', 'mi/kWh']}
            value={energy}
            onChange={setEnergy}
          />
        </Row>
        <Row label="Time">
          <Segmented
            options={[
              { value: '12h', label: '12 Hour' },
              { value: '24h', label: '24 Hour' },
            ]}
            value={timeFormat}
            onChange={setTimeFormat}
          />
        </Row>
      </Section>

      <Section title="Language">
        <ChevronRow
          label="Touchscreen Language"
          description="Changing the language restarts the touchscreen."
          value="English"
        />
        <ChevronRow label="Voice Recognition Language" value="English" />
        <ChevronRow label="Navigation Voice" value="English (US)" />
      </Section>

      <Section title="Maintenance">
        <Row
          label="Screen Clean Mode"
          description="Locks the touchscreen so it can be wiped. The car must be in Park."
        >
          <Action
            label={cleanScreen ? 'Cancel' : 'Start'}
            onClick={() => setCleanScreen(!cleanScreen)}
          />
        </Row>
      </Section>
    </Pane>
  );
};

export default Display;
