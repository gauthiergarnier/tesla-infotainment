import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, Segmented, SwitchRow, Stepper, ChevronRow,
} from './ui/SettingsUI';

/**
 * Safety.
 *
 * Speed warnings, then the audible confirmations, then the cabin protections.
 * The speed-limit offset only means anything when the warning is not Off, so it
 * greys out with it — the car does the same.
 */
export const Safety = () => {
  const [warning, setWarning] = useSetting('speedLimitWarning');
  const [offset, setOffset] = useSetting('speedLimitOffset');
  const [lockSound, setLockSound] = useSetting('lockConfirmSound');
  const [parkChimes, setParkChimes] = useSetting('parkAssistChimes');
  const [securityAlarm, setSecurityAlarm] = useSetting('securityAlarm');
  const [overheat, setOverheat] = useSetting('cabinOverheatProtection');
  const [joeMode, setJoeMode] = useSetting('joeMode');

  return (
    <Pane>
      <Section title="Speed Limit Warning">
        <Row label="Warning">
          <Segmented
            options={['Off', 'Display', 'Chime']}
            value={warning}
            onChange={setWarning}
          />
        </Row>
        <Row
          label="Warn Above Limit By"
          description="How far over the posted limit you can go before the warning fires."
        >
          <Stepper
            value={offset}
            min={0}
            max={25}
            step={1}
            onChange={warning === 'Off' ? undefined : setOffset}
            format={(v) => `${v} mph`}
          />
        </Row>
      </Section>

      <Section title="Sounds">
        <SwitchRow
          label="Lock Confirmation Sound"
          description="Chirps the horn briefly when the car locks."
          checked={lockSound}
          onChange={setLockSound}
        />
        <SwitchRow
          label="Park Assist Chimes"
          description="Sounds as the car approaches an obstacle while parking."
          checked={parkChimes}
          onChange={setParkChimes}
        />
        <SwitchRow
          label="Joe Mode"
          description="Reduces the volume of every chime except the critical safety alerts, so a
                       sleeping passenger is not woken."
          checked={joeMode}
          onChange={setJoeMode}
        />
      </Section>

      <Section title="Cabin">
        <Row
          label="Cabin Overheat Protection"
          description="Runs the fan, or the air conditioning, to keep the cabin below 105°F for up
                       to twelve hours after you leave."
        >
          <Segmented
            options={['Off', 'No A/C', 'On']}
            value={overheat}
            onChange={setOverheat}
          />
        </Row>
        <SwitchRow
          label="Security Alarm"
          description="Sounds the alarm if the car detects an intrusion while it is locked."
          checked={securityAlarm}
          onChange={setSecurityAlarm}
        />
      </Section>

      <Section title="Security">
        <ChevronRow
          label="Sentry Mode"
          description="Watches the car while it is parked and records events to the USB drive."
          value="Settings"
        />
        <ChevronRow label="Emergency Call" value="Test" />
      </Section>
    </Pane>
  );
};

export default Safety;
