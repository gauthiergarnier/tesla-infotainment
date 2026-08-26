import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, colorByKey, wheelsFor } from '../../../../config/vehicleConfig';
import {
  MODELS, yearsFor, versionsFor, resolveVehicle, entryFor,
} from '../../../../config/vehicleCatalog';
import {
  usePaint, setPaint, setVehicle, resetPaint, addCustomWrap, removeCustomWrap,
} from '../../../../utils/paintStore';
import { customWrapFromFile } from '../../../../utils/wrapLayer';
import { Section, Row, Segmented, Action, Dropdown } from './ui/SettingsUI';
import './Colorizer.css';

/**
 * The Colorizer — the car's paint override.
 *
 * In the firmware this hangs off the Software panel as `CarViewAndPaintOverride`
 * (registered between AboutCar and SoftwareBundleList) and opens ColorizerPopup,
 * whose editing view carries a colour picker, a Paint Type switch of
 * Solid / Metallic / Matte and a Trim switch of Black / Chrome. That is the
 * shape reproduced here, with the wrap catalogue added: the car applies wraps
 * from the Paint Shop rather than from this popup, but they are the same
 * vinyl-over-paint layer and belong with the colour controls.
 *
 * Swatches cannot show the raw albedo. The app's paint colours are near-black
 * linear values that read almost entirely as tinted reflection, so a swatch
 * painted with the literal RGB would be a grid of black squares. The lift below
 * is the viewer's own approximation: scale by metalness, then gamma out.
 */
function swatchCss(c) {
  const lift = (x) => Math.round(
    255 * Math.pow(Math.min(1, x * (1 + 2.2 * c.metallic) + 0.06), 1 / 2.0),
  );
  return `rgb(${lift(c.rgb[0])},${lift(c.rgb[1])},${lift(c.rgb[2])})`;
}

const WRAP_BASE = `${process.env.PUBLIC_URL || ''}/wraps/`;

export const Colorizer = () => {
  const paint = usePaint();
  const [catalogue, setCatalogue] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const fileRef = useRef(null);
  const uploadCount = useRef(0);

  const vehicleId = paint.vehicleId;
  const active = colorByKey(paint.colorKey);

  // Model / year / version are three views of one choice: the vehicle id. Each
  // dropdown re-resolves the id, and resolveVehicle absorbs a selection that the
  // new model or year no longer offers.
  const entry = entryFor(vehicleId) || {};
  const years = yearsFor(entry.model);
  const year = years.includes(paint.year) ? paint.year : (entry.to || years[0]);
  const versions = versionsFor(entry.model, year);
  const rims = wheelsFor(vehicleId);

  const choose = (model, y, version) => {
    const id = resolveVehicle(model, y, version);
    setPaint({ year: y });
    setVehicle(id);
  };

  // The wrap catalogue is imported separately (scripts/import-wraps.sh) because
  // it is ~108MB, so treat a missing manifest as "no wraps installed" rather
  // than an error the user has to care about.
  useEffect(() => {
    let cancelled = false;
    fetch(`${WRAP_BASE}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no manifest'))))
      .then((j) => { if (!cancelled) setCatalogue(j); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  const wraps = useMemo(() => {
    const list = (catalogue && catalogue[vehicleId]) || [];
    return list.map((w) => ({
      ...w,
      url: w.url.replace(/^\.\/wraps\//, WRAP_BASE),
      thumb: `${WRAP_BASE}thumbs/${w.url.split('/').pop()}`,
      repeat: 1,
      metallic: 0,
      roughness: 0.9,
    }));
  }, [catalogue, vehicleId]);

  const wrapsSupported = !loadError && (catalogue ? wraps.length > 0 : true);

  const onUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';   // let the same file be picked again
    if (!file) return;
    const wrap = await customWrapFromFile(file, uploadCount.current++);
    if (wrap) addCustomWrap(wrap);
  };

  return (
    <>
      <Section
        title="Vehicle"
        note="Picks which car the screen shows. The wrap catalogue follows it, since
              every template is cut for one body."
      >
        <Row label="Model">
          <Dropdown
            ariaLabel="Model"
            value={entry.model}
            options={MODELS}
            onChange={(m) => choose(m, year, entry.version)}
          />
        </Row>

        <Row label="Year">
          <Dropdown
            ariaLabel="Model year"
            value={String(year)}
            options={years.map((y) => String(y))}
            onChange={(y) => choose(entry.model, Number(y), entry.version)}
          />
        </Row>

        <Row label="Version">
          <Dropdown
            ariaLabel="Version"
            value={entry.version}
            disabled={versions.length < 2}
            options={versions.map((v) => v.version)}
            onChange={(v) => choose(entry.model, year, v)}
          />
        </Row>

        <Row label="Rims">
          <Dropdown
            ariaLabel="Rims"
            value={paint.wheelKey || ''}
            disabled={rims.length < 2}
            options={rims.map((w) => ({
              value: w.key,
              label: w.label || w.key.replace(/_/g, ' '),
            }))}
            onChange={(k) => setPaint({ wheelKey: k })}
          />
        </Row>
      </Section>

      <Section
        title="Paint"
        note="Changes what the car looks like on screen. It does not affect the
              vehicle's registered colour."
      >
        <div className="czSwatches">
          {COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`czSwatch${c.key === paint.colorKey ? ' on' : ''}`}
              style={{ background: swatchCss(c) }}
              title={c.name}
              aria-label={c.name}
              aria-pressed={c.key === paint.colorKey}
              onClick={() => setPaint({ colorKey: c.key })}
            />
          ))}
        </div>
        <div className="czActiveName">{active.name}</div>

        <Row label="Paint Type">
          <Segmented
            options={['Solid', 'Metallic', 'Matte']}
            value={paint.paintType}
            onChange={(v) => setPaint({ paintType: v })}
          />
        </Row>

        <Row label="Trim" description="Chrome delete blacks out the window surrounds.">
          <Segmented
            options={['Chrome', 'Black']}
            value={paint.trim}
            onChange={(v) => setPaint({ trim: v })}
          />
        </Row>
      </Section>

      <Section
        title="Wrap"
        note={wrapsSupported
          ? 'A wrap is vinyl over the paint: where the design is transparent, the paint colour still shows through.'
          : 'This vehicle has no wrap UVs, so the Paint Shop catalogue cannot be placed on it. Uploads are unavailable too.'}
      >
        <div className="czWraps">
          <button
            type="button"
            className={`czWrap czNone${!paint.wrap ? ' on' : ''}`}
            onClick={() => setPaint({ wrap: null })}
          >
            None
          </button>

          {paint.customWraps.map((w) => (
            <div key={w.key} className="czWrapCell">
              <button
                type="button"
                className={`czWrap${paint.wrap && paint.wrap.key === w.key ? ' on' : ''}`}
                onClick={() => setPaint({ wrap: w })}
                title={w.name}
              >
                <img src={w.thumb} alt={w.name} loading="lazy" />
              </button>
              <button
                type="button"
                className="czRemove"
                aria-label={`Remove ${w.name}`}
                onClick={() => removeCustomWrap(w.key)}
              >
                ×
              </button>
              <span className="czWrapName">{w.name}</span>
            </div>
          ))}

          {wraps.map((w) => (
            <div key={w.key} className="czWrapCell">
              <button
                type="button"
                className={`czWrap${paint.wrap && paint.wrap.key === w.key ? ' on' : ''}`}
                onClick={() => setPaint({ wrap: w })}
                title={w.name}
              >
                <img src={w.thumb} alt={w.name} loading="lazy" decoding="async" />
              </button>
              <span className="czWrapName">{w.name}</span>
            </div>
          ))}
        </div>

        <Row
          label="Add a wrap"
          description="Any PNG laid out on the vehicle's wrap template. Transparent areas are
                       left as bare paint; a design on solid black is keyed the same way."
        >
          <Action label="Upload" onClick={() => fileRef.current && fileRef.current.click()} />
        </Row>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="czFile"
          onChange={onUpload}
        />
      </Section>

      <Section>
        <Row
          label="Reset Paint"
          description="Restores the delivered colour, finish and trim. Wraps you uploaded are kept."
        >
          <Action label="Reset" onClick={resetPaint} />
        </Row>
      </Section>
    </>
  );
};

export default Colorizer;
