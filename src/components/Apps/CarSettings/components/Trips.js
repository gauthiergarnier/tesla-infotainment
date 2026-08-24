import React, { useState } from 'react';
import { Pane, Section, Row, InfoRow, Action, Segmented } from './ui/SettingsUI';

/**
 * Trips — the odometer and the two resettable trip meters.
 *
 * Each meter is a small block of read-only figures with its own Reset, which is
 * why this page has no switches at all.
 */
const METERS = {
  'Trip A': { distance: '312.4 mi', energy: '241 Wh/mi', duration: '7h 42m', since: 'Reset 14 Mar' },
  'Trip B': { distance: '48.9 mi', energy: '263 Wh/mi', duration: '1h 09m', since: 'Reset 2 Apr' },
  'Since Last Charge': { distance: '86.2 mi', energy: '229 Wh/mi', duration: '2h 15m', since: 'Charged to 80%' },
};

export const Trips = () => {
  const [meter, setMeter] = useState('Trip A');
  const data = METERS[meter];

  return (
    <Pane>
      <Section title="Odometer">
        <InfoRow label="Odometer" value="24,918 mi" />
        <InfoRow label="Vehicle" value="Model Y Long Range AWD" />
      </Section>

      <Section title="Trip Meters">
        <Row stack>
          <Segmented
            fill
            options={Object.keys(METERS)}
            value={meter}
            onChange={setMeter}
          />
        </Row>

        <InfoRow label="Distance" value={data.distance} />
        <InfoRow label="Average Energy" value={data.energy} />
        <InfoRow label="Duration" value={data.duration} />
        <InfoRow label="Since" value={data.since} />

        <Row label={`Reset ${meter}`}>
          <Action label="Reset" />
        </Row>
      </Section>

      <Section
        title="Energy"
        note="Consumption is averaged over the distance shown. Projected range uses your recent
              driving rather than the rated figure."
      >
        <InfoRow label="Projected Range" value="268 mi" />
        <InfoRow label="Rated Range" value="330 mi" />
      </Section>
    </Pane>
  );
};

export default Trips;
