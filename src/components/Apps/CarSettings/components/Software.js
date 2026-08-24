import React, { useState } from 'react';
import { useSetting } from '../vehicleSettings';
import { Colorizer } from './Colorizer';
import {
  Pane, Section, Row, Segmented, SwitchRow, InfoRow, Action, Meter, ChevronRow,
} from './ui/SettingsUI';

/**
 * Software.
 *
 * The update state is the page: when there is nothing to install this is a
 * short block of version figures, and when there is, the same block grows a
 * progress meter and an Install button.
 */
export const Software = () => {
  const [preference, setPreference] = useSetting('softwarePreference');
  const [dataSharing, setDataSharing] = useSetting('dataSharing');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulated download so the meter and the Install button can be seen working.
  const startDownload = () => {
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(tick);
          return 100;
        }
        return p + 4;
      });
    }, 120);
  };

  return (
    <Pane>
      <Section title="Version">
        <InfoRow label="Software Version" value="2026.8.3" />
        <InfoRow label="Release Notes" value="View" />
        <InfoRow label="VIN" value="7SAYGDEE8PF000000" />
        <InfoRow label="Odometer" value="24,918 mi" />
      </Section>

      <Colorizer />

      <Section
        title="Update"
        note={progress >= 100
          ? 'Update ready to install. The car cannot be driven while installing.'
          : 'Updates download over Wi-Fi. The car must be parked to install.'}
      >
        {downloading ? (
          <>
            <Row stack>
              <Meter percent={progress} />
            </Row>
            <InfoRow
              label={progress >= 100 ? 'Downloaded' : 'Downloading 2026.8.4'}
              value={`${Math.min(100, progress)}%`}
            />
            {progress >= 100 && (
              <Row label="Install Now">
                <Action label="Install" primary />
              </Row>
            )}
          </>
        ) : (
          <Row
            label="Software Update"
            description="Your car is up to date. Check again to look for a newer release."
          >
            <Action label="Check for Updates" onClick={startDownload} />
          </Row>
        )}
      </Section>

      <Section title="Preferences">
        <Row
          label="Update Preference"
          description="Advanced installs updates as soon as they are available for your car;
                       Standard waits until the release is more widely deployed."
        >
          <Segmented
            options={['Standard', 'Advanced']}
            value={preference}
            onChange={setPreference}
          />
        </Row>
        <SwitchRow
          label="Data Sharing"
          description="Shares anonymised analytics, and road-segment video clips, with Tesla to
                       improve the fleet's driver-assist features."
          checked={dataSharing}
          onChange={setDataSharing}
        />
        <ChevronRow label="Additional Vehicle Information" value="View" />
      </Section>
    </Pane>
  );
};

export default Software;
