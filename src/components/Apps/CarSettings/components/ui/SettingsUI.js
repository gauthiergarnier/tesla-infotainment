import React from 'react';
import '../../settings-ui.css';

/**
 * The parts every settings sub-menu is built from.
 *
 * The car's settings screen is far more repetitive than it looks: a page is a
 * stack of sections, a section is a stack of rows, and a row is a label (with
 * an optional grey helper line) paired with exactly one control. Only five
 * control shapes exist — segmented group, switch, tile, slider, stepper —
 * plus read-only and drill-in rows.
 *
 * Panels below import from here rather than hand-rolling divs, so a fidelity
 * fix (a radius, the exact blue, the seam between connected buttons) is made
 * once and lands on all thirteen pages.
 */

/* ------------------------------------------------------------------ layout */

export const Pane = ({ children, className = '' }) => (
  <div className={`tsPane ${className}`.trim()}>{children}</div>
);

export const Section = ({ title, note, children }) => (
  <section className="tsSection">
    {title && <div className="tsSectionTitle">{title}</div>}
    {children}
    {note && <p className="tsNote">{note}</p>}
  </section>
);

export const Divider = () => <hr className="tsDivider" />;

/**
 * `stack` puts the control on its own line under the label — what the car does
 * whenever the control is wider than about half the panel (long segmented
 * groups, sliders, tile grids).
 */
export const Row = ({ label, description, children, stack = false }) => (
  <div className={`tsRow${stack ? ' tsStack' : ''}`}>
    {(label || description) && (
      <div className="tsRowText">
        {label && <span className="tsLabel">{label}</span>}
        {description && <span className="tsDesc">{description}</span>}
      </div>
    )}
    {children && <div className="tsRowControl">{children}</div>}
  </div>
);

/* ---------------------------------------------------------------- controls */

/**
 * Connected button group. `options` accepts plain strings or
 * `{ value, label, disabled }` so a page can show a different caption than the
 * value it stores.
 */
export const Segmented = ({ options, value, onChange, fill = false }) => (
  <div className={`tsSeg${fill ? ' tsSegFill' : ''}`}>
    {options.map((opt) => {
      const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
      const active = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          className={`tsSegBtn${active ? ' on' : ''}`}
          aria-pressed={active}
          disabled={o.disabled}
          onClick={() => onChange && onChange(o.value)}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

/** A lone button that toggles, sitting apart from a group (e.g. High Beams). */
export const ToggleButton = ({ label, active, onClick, detached = false }) => (
  <button
    type="button"
    className={`tsSegBtn${active ? ' on' : ''}${detached ? ' tsSegDetached' : ''}`}
    aria-pressed={!!active}
    onClick={onClick}
  >
    {label}
  </button>
);

export const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!checked}
    aria-label={label}
    className={`tsSwitch${checked ? ' on' : ''}`}
    onClick={() => onChange && onChange(!checked)}
  />
);

/** Shorthand for the most common row on the whole screen. */
export const SwitchRow = ({ label, description, checked, onChange }) => (
  <Row label={label} description={description}>
    <Switch checked={checked} onChange={onChange} label={label} />
  </Row>
);

export const Tiles = ({ children, columns }) => (
  <div
    className="tsTiles"
    style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
  >
    {children}
  </div>
);

/** Vertically connected tiles inside one grid cell (Mirrors over Steering). */
export const TileGroup = ({ children }) => (
  <div className="tsTileGroup">{children}</div>
);

export const Tile = ({ label, sub, active, dot, onClick }) => (
  <button
    type="button"
    className={`tsTile${active ? ' on' : ''}`}
    aria-pressed={!!active}
    onClick={onClick}
  >
    <span className="tsTileLabelRow">
      {label}
      {dot && <span className="tsDot" />}
    </span>
    {sub && <span className="tsTileSub">{sub}</span>}
  </button>
);

/**
 * Range input with the filled portion painted up to the handle. WebKit gives no
 * styleable "filled track" pseudo-element, so the fill percentage is passed to
 * CSS as a custom property and rendered as a hard-stop gradient.
 */
export const Slider = ({
  value, min = 0, max = 100, step = 1, onChange, disabled = false,
}) => {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="tsSlider tsFilled"
      style={{ '--ts-fill': `${pct}%` }}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
    />
  );
};

export const SliderRow = ({
  value, min, max, step, onChange, disabled, format, trailing,
}) => (
  <div className="tsSliderRow">
    <div className="tsSliderShell">
      <Slider
        value={value} min={min} max={max} step={step}
        onChange={onChange} disabled={disabled}
      />
    </div>
    {format && <span className="tsSliderValue">{format(value)}</span>}
    {trailing}
  </div>
);

export const Stepper = ({ value, onChange, min = 0, max = 100, step = 1, format }) => (
  <div className="tsStepper">
    <button
      type="button"
      className="tsStepBtn"
      disabled={value <= min}
      onClick={() => onChange && onChange(Math.max(min, value - step))}
      aria-label="Decrease"
    >
      −
    </button>
    <div className="tsStepValue">{format ? format(value) : value}</div>
    <button
      type="button"
      className="tsStepBtn"
      disabled={value >= max}
      onClick={() => onChange && onChange(Math.min(max, value + step))}
      aria-label="Increase"
    >
      +
    </button>
  </div>
);

/**
 * Dropdown. The car's own `SettingsDropDownButton` is a radius-10 button on the
 * tertiary background that opens a list; a native <select> gives the same
 * affordance, keyboard behaviour and long-list scrolling for free.
 */
export const Dropdown = ({ value, options, onChange, disabled = false, ariaLabel }) => (
  <div className={`tsSelectShell${disabled ? ' off' : ''}`}>
    <select
      className="tsSelect"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {options.map((opt) => {
        const o = typeof opt === 'object' ? opt : { value: opt, label: String(opt) };
        return <option key={o.value} value={o.value}>{o.label}</option>;
      })}
    </select>
  </div>
);

export const Action = ({ label, onClick, primary = false, disabled = false }) => (
  <button
    type="button"
    className={`tsAction${primary ? ' tsPrimary' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </button>
);

export const InfoRow = ({ label, value, description }) => (
  <Row label={label} description={description}>
    <span className="tsValue">{value}</span>
  </Row>
);

export const ChevronRow = ({ label, description, value, onClick }) => (
  <Row label={label} description={description}>
    <button type="button" className="tsChevron" onClick={onClick}>
      {value}
    </button>
  </Row>
);

export const Meter = ({ percent }) => (
  <div className="tsMeter">
    <div className="tsMeterFill" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
  </div>
);
