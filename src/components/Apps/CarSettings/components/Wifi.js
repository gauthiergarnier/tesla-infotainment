import React, { useState } from 'react';
import { useSetting } from '../vehicleSettings';
import { Pane, Section, Row, SwitchRow, InfoRow, Action } from './ui/SettingsUI';
import '../settings-ui.css';

/**
 * Wi-Fi.
 *
 * The one settings page built around a list. Each network is a row with a
 * signal glyph and a lock, and the connected one carries its status where the
 * other rows carry their security type.
 */
const NETWORKS = [
  { ssid: 'Home 5G', strength: 4, secured: true },
  { ssid: 'Home 2.4G', strength: 3, secured: true },
  { ssid: 'Tesla Service', strength: 2, secured: true },
  { ssid: 'xfinitywifi', strength: 2, secured: false },
  { ssid: 'NETGEAR47', strength: 1, secured: true },
];

/** Four-bar signal glyph, drawn rather than shipped as an asset. */
const Signal = ({ strength }) => (
  <span className="tsSignal" aria-label={`Signal ${strength} of 4`}>
    {[1, 2, 3, 4].map((bar) => (
      <i key={bar} className={bar <= strength ? 'on' : ''} style={{ height: `${bar * 3 + 3}px` }} />
    ))}
  </span>
);

export const Wifi = () => {
  const [enabled, setEnabled] = useSetting('wifiEnabled');
  const [connected, setConnected] = useSetting('wifiNetwork');
  const [scanning, setScanning] = useState(false);

  const rescan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1200);
  };

  return (
    <Pane>
      <Section title="Wi-Fi">
        <SwitchRow
          label="Wi-Fi"
          description="The car uses Wi-Fi for software updates, maps and streaming when it is in
                       range of a known network."
          checked={enabled}
          onChange={setEnabled}
        />
      </Section>

      {enabled && (
        <Section title={scanning ? 'Scanning…' : 'Available Networks'}>
          <div className="tsNetList">
            {NETWORKS.map((net) => {
              const isConnected = net.ssid === connected;
              return (
                <button
                  key={net.ssid}
                  type="button"
                  className={`tsNetRow${isConnected ? ' on' : ''}`}
                  onClick={() => setConnected(net.ssid)}
                >
                  <span className="tsNetName">
                    {net.ssid}
                    {net.secured && <span className="tsLockGlyph" aria-label="Secured">🔒</span>}
                  </span>
                  <span className="tsNetRight">
                    <span className="tsValue">
                      {isConnected ? 'Connected' : net.secured ? 'WPA2' : 'Open'}
                    </span>
                    <Signal strength={net.strength} />
                  </span>
                </button>
              );
            })}
          </div>

          <Row label="Other Network">
            <Action label={scanning ? 'Scanning…' : 'Rescan'} onClick={rescan} />
          </Row>
        </Section>
      )}

      <Section title="Connection">
        <InfoRow label="Connected To" value={enabled ? connected : 'Wi-Fi off'} />
        <InfoRow label="Cellular" value="LTE — Strong" />
        <InfoRow label="Streaming Connectivity" value="Premium — active" />
      </Section>

    </Pane>
  );
};

export default Wifi;
