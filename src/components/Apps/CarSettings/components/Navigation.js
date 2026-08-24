import React from 'react';
import { useSetting } from '../vehicleSettings';
import {
  Pane, Section, Row, SwitchRow, SliderRow, ChevronRow, InfoRow, Action,
} from './ui/SettingsUI';

/**
 * Navigation.
 *
 * Routing preferences first, then what is drawn on the map, then the offline
 * map data. The routing block matters on the car because it decides whether a
 * route comes from Tesla's servers or from the on-board offline router.
 */
export const Navigation = () => {
  const [avoidTolls, setAvoidTolls] = useSetting('navAvoidTolls');
  const [avoidFerries, setAvoidFerries] = useSetting('navAvoidFerries');
  const [onlineRouting, setOnlineRouting] = useSetting('navOnlineRouting');
  const [autoNavigate, setAutoNavigate] = useSetting('navAutoNavigate');
  const [tripPlanner, setTripPlanner] = useSetting('navTripPlanner');
  const [avoidHighways, setAvoidHighways] = useSetting('navAvoidHighways');
  const [useHov, setUseHov] = useSetting('navUseHov');
  const [navVolume, setNavVolume] = useSetting('navVolume');

  return (
    <Pane>
      <Section title="Routing">
        <SwitchRow
          label="Online Routing"
          description="Routes are calculated by Tesla's servers using live traffic. When off, the
                       car uses its on-board offline map data instead."
          checked={onlineRouting}
          onChange={setOnlineRouting}
        />
        <SwitchRow
          label="Avoid Tolls"
          checked={avoidTolls}
          onChange={setAvoidTolls}
        />
        <SwitchRow
          label="Avoid Ferries"
          checked={avoidFerries}
          onChange={setAvoidFerries}
        />
        <SwitchRow
          label="Avoid Highways"
          checked={avoidHighways}
          onChange={setAvoidHighways}
        />
        <SwitchRow
          label="Use HOV Lanes"
          description="Routes through carpool lanes where your vehicle is eligible."
          checked={useHov}
          onChange={setUseHov}
        />
      </Section>

      <Section title="Trip Planner">
        <SwitchRow
          label="Trip Planner"
          description="Adds Supercharger stops to long routes and tells you how long to stay at
                       each one."
          checked={tripPlanner}
          onChange={setTripPlanner}
        />
        <SwitchRow
          label="Automatic Navigation"
          description="Suggests a destination from your calendar and recent trips when you start
                       driving."
          checked={autoNavigate}
          onChange={setAutoNavigate}
        />
      </Section>

      <Section title="Map">
        <Row label="Navigation Volume" stack>
          <SliderRow
            value={navVolume}
            min={0}
            max={10}
            onChange={setNavVolume}
            format={(v) => `${v}`}
          />
        </Row>
        <ChevronRow label="Home Address" value="Set" />
        <ChevronRow label="Work Address" value="Not set" />
      </Section>

      <Section title="Offline Maps">
        <InfoRow label="Map Region" value="North America" />
        <InfoRow label="Map Version" value="2026.8-14831" />
        <Row
          label="Map Updates"
          description="Offline maps download over Wi-Fi and are used when there is no connection."
        >
          <Action label="Check for Updates" />
        </Row>
      </Section>
    </Pane>
  );
};

export default Navigation;
