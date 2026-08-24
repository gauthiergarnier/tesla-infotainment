import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, Segmented, SwitchRow, Stepper, ChevronRow,
} from './ui/SettingsUI';

/**
 * Autopilot.
 *
 * Split the way the car splits it: the driving-assist behaviours first, then
 * the active-safety features that stay on whether or not Autopilot is engaged,
 * then the alert chimes.
 */
export const Autopilot = () => {
  const [followDistance, setFollowDistance] = useSetting('followDistance');
  const [speedOffset, setSpeedOffset] = useSetting('autosteerSpeedOffset');
  const [autoLaneChange, setAutoLaneChange] = useSetting('autoLaneChange');
  const [navOnAp, setNavOnAp] = useSetting('navigateOnAutopilot');
  const [summon, setSummon] = useSetting('summonStandby');
  const [laneAvoid, setLaneAvoid] = useSetting('lanesDepartureAvoidance');
  const [emergencyLane, setEmergencyLane] = useSetting('emergencyLaneAvoidance');
  const [fcw, setFcw] = useSetting('forwardCollisionWarning');
  const [obstacleAccel, setObstacleAccel] = useSetting('obstacleAwareAccel');
  const [apChime, setApChime] = useSetting('autopilotChime');
  const [greenChime, setGreenChime] = useSetting('greenLightChime');

  return (
    <Pane>
      <Section title="Autopilot Controls">
        <Row
          label="Cruise Follow Distance"
          description="The gap Traffic-Aware Cruise Control keeps from the vehicle ahead."
        >
          <Stepper
            value={followDistance}
            min={1}
            max={7}
            onChange={setFollowDistance}
          />
        </Row>

        <Row
          label="Set Speed Offset"
          description="How far above the detected speed limit Autosteer will set its speed."
        >
          <Stepper
            value={speedOffset}
            min={-10}
            max={15}
            onChange={setSpeedOffset}
            format={(v) => `${v > 0 ? '+' : ''}${v} mph`}
          />
        </Row>

        <SwitchRow
          label="Auto Lane Change"
          description="Changes lanes when you signal, if Autosteer judges the lane clear."
          checked={autoLaneChange}
          onChange={setAutoLaneChange}
        />

        <SwitchRow
          label="Navigate on Autopilot"
          description="Suggests and takes interchanges and exits along a navigation route."
          checked={navOnAp}
          onChange={setNavOnAp}
        />

        <SwitchRow
          label="Summon Standby Mode"
          description="Keeps the car awake so it responds to Summon more quickly. Increases
                       standby energy use."
          checked={summon}
          onChange={setSummon}
        />
      </Section>

      <Section title="Active Safety Features">
        <Row
          label="Lane Departure Avoidance"
          description="Steers back into the lane if the car drifts across a marking without a
                       turn signal."
        >
          <Segmented
            options={['Off', 'Warning', 'Assist']}
            value={laneAvoid}
            onChange={setLaneAvoid}
          />
        </Row>

        <SwitchRow
          label="Emergency Lane Departure Avoidance"
          description="Steers back into the lane when leaving it would risk a collision."
          checked={emergencyLane}
          onChange={setEmergencyLane}
        />

        <Row
          label="Forward Collision Warning"
          description="How early the car warns about a likely collision ahead."
        >
          <Segmented
            options={['Off', 'Late', 'Medium', 'Early']}
            value={fcw}
            onChange={setFcw}
          />
        </Row>

        <SwitchRow
          label="Obstacle-Aware Acceleration"
          description="Reduces acceleration when an obstacle is detected close in front of the car."
          checked={obstacleAccel}
          onChange={setObstacleAccel}
        />
      </Section>

      <Section title="Chimes">
        <SwitchRow
          label="Autopilot Engage/Disengage Chime"
          checked={apChime}
          onChange={setApChime}
        />
        <SwitchRow
          label="Green Traffic Light Chime"
          description="Sounds when a light you are stopped at turns green."
          checked={greenChime}
          onChange={setGreenChime}
        />
        <ChevronRow label="Full Self-Driving (Supervised)" value="Learn More" />
      </Section>
    </Pane>
  );
};

export default Autopilot;
