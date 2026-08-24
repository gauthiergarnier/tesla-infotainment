import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, SwitchRow, SliderRow, Stepper, Action, InfoRow,
} from './ui/SettingsUI';

/**
 * Charging.
 *
 * The charge limit is the one control on this page the car gives a full-width
 * slider to, with the daily/trip split marked on it; current and schedules sit
 * underneath as ordinary rows.
 */
export const Charging = () => {
  const [limit, setLimit] = useSetting('chargeLimit');
  const [current, setCurrent] = useSetting('chargeCurrent');
  const [portUnlock, setPortUnlock] = useSetting('chargePortUnlock');
  const [chargeOnSolar, setChargeOnSolar] = useSetting('chargeOnSolar');
  const [scheduled, setScheduled] = useSetting('scheduledCharging');
  const [departure, setDeparture] = useSetting('scheduledDeparture');

  // The car labels everything up to 90% as the daily range and above it as trip
  // charging, and warns that the top of the range is not for everyday use.
  const band = limit <= 90 ? 'Daily' : 'Trip';

  return (
    <Pane>
      <Section
        title="Charge Limit"
        note={band === 'Trip'
          ? 'Charging above 90% is recommended for trips only. Frequent full charges reduce battery longevity.'
          : 'Recommended for daily use.'}
      >
        <Row stack>
          <SliderRow
            value={limit}
            min={50}
            max={100}
            step={1}
            onChange={setLimit}
            format={(v) => `${v}%`}
          />
        </Row>
        <InfoRow label="Range at limit" value={`${Math.round((limit / 100) * 330)} mi`} />
      </Section>

      <Section title="Charge Current">
        <Row
          label="Charge Current"
          description="Reduce if the circuit you are plugged into cannot supply the full current."
        >
          <Stepper
            value={current}
            min={5}
            max={48}
            step={1}
            onChange={setCurrent}
            format={(v) => `${v} A`}
          />
        </Row>
      </Section>

      <Section title="Schedule">
        <SwitchRow
          label="Scheduled Charging"
          description="Start charging at a set time, for example when off-peak rates begin."
          checked={scheduled}
          onChange={(v) => { setScheduled(v); if (v) setDeparture(false); }}
        />
        <SwitchRow
          label="Scheduled Departure"
          description="Be ready to drive at a set time. The car finishes charging and preconditions
                       the cabin just before you leave."
          checked={departure}
          onChange={(v) => { setDeparture(v); if (v) setScheduled(false); }}
        />
      </Section>

      <Section title="Solar">
        <SwitchRow
          label="Charge on Solar"
          description="Charges only from surplus solar generation reported by your Powerwall."
          checked={chargeOnSolar}
          onChange={setChargeOnSolar}
        />
      </Section>

      <Section title="Charge Port">
        <SwitchRow
          label="Unlock Charge Port When Unlocked"
          description="Lets the cable be removed whenever the car is unlocked."
          checked={portUnlock}
          onChange={setPortUnlock}
        />
        <Row label="Charge Port Door">
          <Action label="Open" />
        </Row>
      </Section>
    </Pane>
  );
};

export default Charging;
