import React, { useState, useEffect } from 'react';
import CarWashMode from './CarWashMode/CarWashMode';
import { MirrorsAdjustment } from './MirrorsAdjustment';
import { SteeringAdjustment } from './SteeringAdjustment';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, Segmented, ToggleButton,
  Tiles, TileGroup, Tile, SliderRow,
} from './ui/SettingsUI';
import '../CarSettings.css';

/**
 * Controls — the landing page of the settings screen.
 *
 * Unlike every other sub-menu this one is a button board rather than a list of
 * labelled rows: the car puts the things you reach for while seated (lights,
 * wipers, mirrors, glovebox) on large targets with no section headings. The
 * order and grouping below follow the car screen.
 */
export const Controls = () => {
  const [headlights, setHeadlights] = useSetting('headlights');
  const [highBeams, setHighBeams] = useSetting('highBeams');
  const [foldMirrors, setFoldMirrors] = useSetting('foldMirrors');
  const [childLock, setChildLock] = useSetting('childLock');
  const [windowLock, setWindowLock] = useSetting('windowLock');
  const [wipers, setWipers] = useSetting('wipers');
  const [wiperSpeed, setWiperSpeed] = useSetting('wiperSpeed');
  const [dashcam, setDashcam] = useSetting('dashcam');
  const [sentry, setSentry] = useSetting('sentry');
  const [brightness, setBrightness] = useSetting('brightness');
  const [brightnessAuto, setBrightnessAuto] = useSetting('brightnessAuto');

  const [showChildLock, setShowChildLock] = useState(false);
  const [showCarWash, setShowCarWash] = useState(false);
  const [showMirrors, setShowMirrors] = useState(false);
  const [showSteering, setShowSteering] = useState(false);
  const [gloveboxOpen, setGloveboxOpen] = useState(false);

  // Wipers: picking a speed implies the manual mode, and Auto/Off clear it.
  const setWiperMode = (mode) => {
    setWipers(mode);
    if (mode !== 'On') setWiperSpeed(null);
  };

  const pickWiperSpeed = (speed) => {
    setWiperSpeed(speed);
    setWipers('On');
  };

  // The brightness slider dims the simulated screen itself, the way it does in
  // the car — kept from the original implementation.
  useEffect(() => {
    const wrapper = document.querySelector('.displayWrapper');
    if (!wrapper) return;
    wrapper.style.opacity = brightnessAuto
      ? '1'
      : String(Math.max(0.1, brightness / 100));
  }, [brightness, brightnessAuto]);

  // The glovebox button is momentary: it lights up, then releases.
  useEffect(() => {
    if (!gloveboxOpen) return undefined;
    const timer = setTimeout(() => setGloveboxOpen(false), 600);
    return () => clearTimeout(timer);
  }, [gloveboxOpen]);

  return (
    <Pane className="tsControls">
      {/* Headlights, with High Beams detached to its own target. */}
      <Section>
        <Row stack>
          <div className="tsHeadlightRow">
            <Segmented
              options={['Off', 'Parking', 'On', 'Auto']}
              value={headlights}
              onChange={setHeadlights}
              fill
            />
            <ToggleButton
              label="High Beams"
              active={highBeams}
              onClick={() => setHighBeams(!highBeams)}
              detached
            />
          </div>
        </Row>
      </Section>

      {/* Mirrors / child lock / window lock. */}
      <Section>
        <Tiles columns={3}>
          <Tile
            label="Fold Mirrors"
            active={foldMirrors}
            onClick={() => setFoldMirrors(!foldMirrors)}
          />
          <Tile
            label="Child Lock"
            sub={childLock !== 'Off' ? childLock : undefined}
            active={childLock !== 'Off'}
            onClick={() => setShowChildLock((v) => !v)}
          />
          <Tile
            label="Window Lock"
            active={windowLock}
            onClick={() => setWindowLock(!windowLock)}
          />
        </Tiles>

        {showChildLock && (
          <div className="child-lock-popup">
            <Segmented
              options={['Off', 'Left', 'Right', 'Both']}
              value={childLock}
              onChange={(v) => {
                setChildLock(v);
                setShowChildLock(false);
              }}
            />
          </div>
        )}
      </Section>

      {/* Wipers: mode and the four manual speeds in one connected group. */}
      <Section>
        <Segmented
          fill
          value={wipers === 'On' ? wiperSpeed : wipers}
          onChange={(v) => (['Off', 'Auto'].includes(v) ? setWiperMode(v) : pickWiperSpeed(v))}
          options={['Off', 'Auto', 'I', 'II', 'III', 'IIII']}
        />
      </Section>

      {/* Six tiles in three vertically-joined pairs. */}
      <Section>
        <Tiles columns={3}>
          <TileGroup>
            <Tile label="Mirrors" onClick={() => setShowMirrors(true)} />
            <Tile label="Steering" onClick={() => setShowSteering(true)} />
          </TileGroup>
          <TileGroup>
            <Tile label="Dashcam" active={dashcam} onClick={() => setDashcam(!dashcam)} />
            <Tile label="Sentry" active={sentry} dot={sentry} onClick={() => setSentry(!sentry)} />
          </TileGroup>
          <TileGroup>
            <Tile label="Car Wash" onClick={() => setShowCarWash(true)} />
            <Tile label="Glovebox" active={gloveboxOpen} onClick={() => setGloveboxOpen(true)} />
          </TileGroup>
        </Tiles>
      </Section>

      {/* Screen brightness. */}
      <Section>
        <SliderRow
          value={brightness}
          min={0}
          max={100}
          disabled={brightnessAuto}
          onChange={setBrightness}
          trailing={(
            <ToggleButton
              label="Auto"
              active={brightnessAuto}
              onClick={() => {
                const next = !brightnessAuto;
                setBrightnessAuto(next);
                if (next) setBrightness(100);
              }}
            />
          )}
        />
      </Section>

      {showCarWash && (
        <div className="car-wash-mode-popup">
          <CarWashMode onClose={() => setShowCarWash(false)} />
        </div>
      )}
      {showMirrors && (
        <div className="modal">
          <MirrorsAdjustment onClose={() => setShowMirrors(false)} />
        </div>
      )}
      {showSteering && (
        <div className="modal">
          <SteeringAdjustment onClose={() => setShowSteering(false)} />
        </div>
      )}
    </Pane>
  );
};

export default Controls;
