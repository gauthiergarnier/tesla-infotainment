import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, SwitchRow, Action, ChevronRow, InfoRow,
} from './ui/SettingsUI';

/**
 * Locks — keys and the automatic lock/unlock behaviours.
 *
 * The key list sits at the top because it is the only part of this page that is
 * a list rather than a switch; everything under it is a plain on/off with a
 * line of explanation.
 */
export const Locks = () => {
  const [walkAway, setWalkAway] = useSetting('walkAwayLock');
  const [unlockOnPark, setUnlockOnPark] = useSetting('unlockOnPark');
  const [driveAway, setDriveAway] = useSetting('driveAwayLock');
  const [excludeHome, setExcludeHome] = useSetting('excludeHome');
  const [phoneKeyOnly, setPhoneKeyOnly] = useSetting('phoneKeyOnly');
  const [pinToDrive, setPinToDrive] = useSetting('pinToDrive');

  return (
    <Pane>
      <Section title="Keys">
        <InfoRow label="Phone Key — James's iPhone" value="Connected" />
        <InfoRow label="Key Card" value="2 paired" />
        <Row label="Add or remove a key">
          <Action label="Manage Keys" />
        </Row>
      </Section>

      <Section title="Automatic Locks">
        <SwitchRow
          label="Walk-Away Door Lock"
          description="Locks the car when your phone key moves out of range."
          checked={walkAway}
          onChange={setWalkAway}
        />
        <SwitchRow
          label="Exclude Home"
          description="Skips Walk-Away Door Lock when parked at your home address."
          checked={excludeHome}
          onChange={setExcludeHome}
        />
        <SwitchRow
          label="Unlock on Park"
          description="Unlocks all doors when you shift into Park."
          checked={unlockOnPark}
          onChange={setUnlockOnPark}
        />
        <SwitchRow
          label="Drive-Away Door Lock"
          description="Locks the doors automatically once the car starts moving."
          checked={driveAway}
          onChange={setDriveAway}
        />
      </Section>

      <Section title="Security">
        <SwitchRow
          label="Require Phone Key or Key Card"
          description="Requires an authenticated key to be present before the car will drive."
          checked={phoneKeyOnly}
          onChange={setPhoneKeyOnly}
        />
        <SwitchRow
          label="PIN to Drive"
          description="Requires a four-digit code before the car can be driven."
          checked={pinToDrive}
          onChange={setPinToDrive}
        />
        <ChevronRow
          label="Glovebox PIN"
          description="Locks the glovebox behind its own code."
          value="Set"
        />
        <ChevronRow
          label="Valet Mode"
          description="Limits speed and power, and locks the glovebox and front trunk."
          value="Off"
        />
        <ChevronRow
          label="Speed Limit Mode"
          description="Caps the car's top speed between 50 and 90 mph."
          value="Off"
        />
      </Section>
    </Pane>
  );
};

export default Locks;
