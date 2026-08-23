import React from 'react';
import { useScene } from '../../../../contexts/SceneContext';

const APPEARANCES = [
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' },
  { key: 'auto', label: 'Auto' },
];

/**
 * The Display settings page. Appearance is the control that matters here:
 * Dark / Light / Auto, with Auto following the clock the way the car does.
 * The choice drives the whole screen and the map style through SceneContext.
 */
export const Display = () => {
  const { appearance, setAppearance, isDark } = useScene();

  return (
    <div className="buttons-container">
      <div className="label">Appearance</div>
      <div className="flex-row row-1">
        {APPEARANCES.map(({ key, label }) => (
          <div
            key={key}
            className={`btn${appearance === key ? ' active' : ''}`}
            role="radio"
            aria-checked={appearance === key}
            onClick={() => setAppearance(key)}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="description">
        {appearance === 'auto'
          ? `Auto switches with the time of day. Currently ${isDark ? 'dark' : 'light'}.`
          : `Always ${appearance}. Pick Auto to follow the time of day.`}
      </div>
    </div>
  );
};

export default Display;
