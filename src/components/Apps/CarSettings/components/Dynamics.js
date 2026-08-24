import React, { useState } from 'react';
import { useSetting } from '../vehicleSettings';
import { Pane, Section, Row, Segmented, SwitchRow, Action } from './ui/SettingsUI';

/**
 * Dynamics — how the car puts power down and how it stops.
 *
 * The three segmented rows at the top are the ones that change the drive feel;
 * everything below is a switch with an explanatory line, which is the shape the
 * car uses whenever a setting needs a caveat.
 */
export const Dynamics = () => {
  const [acceleration, setAcceleration] = useSetting('acceleration');
  const [steeringMode, setSteeringMode] = useSetting('steeringMode');
  const [stoppingMode, setStoppingMode] = useSetting('stoppingMode');
  const [applyBrakes, setApplyBrakes] = useSetting('applyBrakesRegen');
  const [offroad, setOffroad] = useSetting('offroadAssist');
  const [slipStart, setSlipStart] = useSetting('slipStart');
  const [trackOpen, setTrackOpen] = useState(false);

  return (
    <Pane>
      <Section>
        <Row label="Acceleration">
          <Segmented
            options={['Chill', 'Standard']}
            value={acceleration}
            onChange={setAcceleration}
          />
        </Row>

        <Row label="Steering Mode">
          <Segmented
            options={['Comfort', 'Standard', 'Sport']}
            value={steeringMode}
            onChange={setSteeringMode}
          />
        </Row>
      </Section>

      <Section
        note="Maximizes range by extending regenerative braking to lower speeds and
              automatically blending in the brakes to hold the vehicle at a stop."
      >
        <Row label="Stopping Mode">
          <Segmented
            options={['Creep', 'Roll', 'Hold']}
            value={stoppingMode}
            onChange={setStoppingMode}
          />
        </Row>
      </Section>

      <Section>
        <SwitchRow
          label="Apply Brakes When Regenerative Braking is Limited"
          description="Regenerative braking is limited when the battery is cold or nearly full."
          checked={applyBrakes}
          onChange={setApplyBrakes}
        />

        <SwitchRow
          label="Off-Road Assist"
          description="Balances torque between the front and rear wheels to improve traction on
                       loose or uneven surfaces."
          checked={offroad}
          onChange={setOffroad}
        />

        <SwitchRow
          label="Slip Start"
          description="Use to help free a vehicle stuck in snow, sand, or mud. Allows the wheels
                       to spin at low speed."
          checked={slipStart}
          onChange={setSlipStart}
        />
      </Section>

      <Section title="Track Mode">
        <Row
          label="Track Mode"
          description="Adjusts stability control, traction control and regenerative braking for
                       closed-course driving. Not for use on public roads."
        >
          <Action label="Customize" onClick={() => setTrackOpen(true)} />
        </Row>
        {trackOpen && (
          <Row description="Track Mode is available on Performance vehicles only." />
        )}
      </Section>
    </Pane>
  );
};

export default Dynamics;
