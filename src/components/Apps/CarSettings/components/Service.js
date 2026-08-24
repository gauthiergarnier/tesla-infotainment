import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, SwitchRow, InfoRow, Action, ChevronRow, Segmented,
} from './ui/SettingsUI';

/**
 * Service.
 *
 * Mostly read-only identification plus the few things an owner is expected to
 * change after work is done on the car — wheel size after a tyre swap, and the
 * service-mode switch a technician uses.
 */
export const Service = () => {
  const [serviceMode, setServiceMode] = useSetting('serviceMode');
  const [wheelType, setWheelType] = useSetting('wheelType');

  return (
    <Pane>
      <Section title="Vehicle">
        <InfoRow label="VIN" value="7SAYGDEE8PF000000" />
        <InfoRow label="Model" value="Model Y Long Range AWD" />
        <InfoRow label="Odometer" value="24,918 mi" />
        <InfoRow label="Firmware" value="2026.8.3" />
      </Section>

      <Section title="Wheels and Tires">
        <Row
          label="Wheel Type"
          description="Set this after changing wheels so range and speedometer stay accurate."
        >
          <Segmented
            options={['19" Gemini', '20" Induction']}
            value={wheelType}
            onChange={setWheelType}
          />
        </Row>
        <InfoRow label="Front Tire Pressure" value="42 / 42 psi" />
        <InfoRow label="Rear Tire Pressure" value="42 / 41 psi" />
        <Row label="Tire Configuration">
          <Action label="Change" />
        </Row>
      </Section>

      <Section title="Service">
        <SwitchRow
          label="Service Mode"
          description="For use by technicians. Disables some vehicle functions and shows
                       diagnostic information."
          checked={serviceMode}
          onChange={setServiceMode}
        />
        <ChevronRow label="Schedule Service" value="Open" />
        <ChevronRow label="Roadside Assistance" value="Call" />
      </Section>

      <Section
        title="Reset"
        note="A factory reset erases all personal data and restores the car to its delivered
              settings. It cannot be undone."
      >
        <Row label="Factory Reset">
          <Action label="Reset" />
        </Row>
      </Section>
    </Pane>
  );
};

export default Service;
