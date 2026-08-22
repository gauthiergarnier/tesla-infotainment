import React, { useState } from 'react';
import './TripPlanner.css';
import DEMO_TRIP from '../../config/demoTrip';

/**
 * The navigation panel the car shows while a trip with charging stops is
 * planned: a tab strip, the route summary, the stop list with arrival time,
 * state of charge and weather, and a pinned strip describing the current leg.
 *
 * On the real display this is a column pinned to the left edge of the map, and
 * the map keeps its full width behind it.
 */

const BatteryPip = ({ soc }) => (
  <span className="tpBattery" title={`${soc}%`}>
    <span className="tpBatteryShell">
      <span className="tpBatteryFill" style={{ width: `${Math.max(4, soc)}%` }} />
    </span>
    <span className="tpBatteryLabel">{soc}%</span>
  </span>
);

const WeatherGlyph = ({ kind }) => (
  <span className={`tpWeather tpWeather--${kind}`} aria-hidden>
    {kind === 'sun' ? '☀' : '☁'}
  </span>
);

export const TripPlanner = ({ trip = DEMO_TRIP, onEndTrip }) => {
  const [tab, setTab] = useState(trip.activeTab || trip.tabs[0]);
  const leg = trip.currentLeg;

  return (
    <aside className="tripPlanner">
      <div className="tpTabs" role="tablist">
        {trip.tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tab}
            className={`tpTab${t === tab ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="tpCard">
        <div className="tpSummary">
          <div className="tpSummaryRow">
            <span className="tpStrong">{trip.totalDuration}</span>
            <span className="tpStrong">{trip.totalDistance}</span>
          </div>
          <div className="tpSummaryRow tpDim">
            <span>{trip.stopCount} stops</span>
            <span>{trip.arrival}</span>
          </div>
        </div>

        <ol className="tpStops">
          {trip.stops.map((s, i) => (
            <li key={s.name} className={`tpStop${s.destination ? ' destination' : ''}`}>
              <span className={`tpPin${s.destination ? ' tpPin--dest' : ''}`} aria-hidden />
              {i < trip.stops.length - 1 && <span className="tpThread" aria-hidden />}
              <div className="tpStopBody">
                <div className="tpStopHead">
                  <span className="tpStopName">{s.name}</span>
                  <span className="tpStopEta">{s.eta}</span>
                </div>
                <div className="tpStopMeta">
                  <span className="tpStopKind">{s.kind || ' '}</span>
                  <span className="tpStopWeather">
                    <WeatherGlyph kind={s.icon} />
                    {s.weather}
                  </span>
                </div>
                <div className="tpStopMeta">
                  <BatteryPip soc={s.soc} />
                  {s.charge && <span className="tpCharge">⚡ {s.charge}</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="tpLinks">
          <button className="tpLink">Set Arrival Energy</button>
          <button className="tpLink">Remove all charging stops</button>
        </div>
      </div>

      <div className="tpLeg">
        <div className="tpLegRow">
          <span className="tpStrong">{leg.eta}</span>
          <span className="tpStrong">{leg.duration}</span>
          <span className="tpStrong">{leg.distance}</span>
        </div>
        <div className="tpLegRow tpDim">
          <span className="tpLegTarget">{leg.target}</span>
          <BatteryPip soc={leg.soc} />
        </div>
        <div className="tpProgress">
          <span className="tpProgressFill" style={{ width: `${leg.progress * 100}%` }} />
        </div>
        <div className="tpLegActions">
          <button className="tpEndTrip" onClick={onEndTrip}>End Trip</button>
          <button className="tpMore" aria-label="More">···</button>
        </div>
      </div>
    </aside>
  );
};

export default TripPlanner;
