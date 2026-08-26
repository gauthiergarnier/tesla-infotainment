/**
 * Model / year / version taxonomy over the exported vehicles.
 *
 * The GLB ids are generation code names (`modely_juniper`, `models_palladium`,
 * `modely_e80`), which is how the app's own asset pack names them but not how
 * anyone shops for a car. This table is the bridge: pick a model, a year and a
 * version, and get back the id to load.
 *
 * The E-numbers are the Model Y variants that shipped alongside Juniper for
 * 2026: E41 is the cheaper Standard, and E80 is the six-seat Model Y L (matched
 * against the public wrap templates by UV overlap, not by its code name).
 */
export const CATALOG = [
  { id: 'model3', model: 'Model 3', version: 'Original', from: 2017, to: 2023 },
  { id: 'model3_highland', model: 'Model 3', version: 'Highland', from: 2024, to: 2026 },

  { id: 'modely', model: 'Model Y', version: 'Original', from: 2020, to: 2025 },
  { id: 'modely_juniper', model: 'Model Y', version: 'Juniper', from: 2025, to: 2026 },
  { id: 'modely_e41', model: 'Model Y', version: 'Standard', from: 2026, to: 2026 },
  { id: 'modely_e80', model: 'Model Y', version: 'L', from: 2026, to: 2026 },

  { id: 'models', model: 'Model S', version: 'Original', from: 2012, to: 2020 },
  { id: 'models_palladium', model: 'Model S', version: 'Palladium', from: 2021, to: 2026 },

  { id: 'modelx', model: 'Model X', version: 'Original', from: 2015, to: 2020 },
  { id: 'modelx_palladium', model: 'Model X', version: 'Palladium', from: 2021, to: 2026 },

  { id: 'cybertruck', model: 'Cybertruck', version: 'Standard', from: 2024, to: 2026 },
  { id: 'semi', model: 'Semi', version: 'Standard', from: 2022, to: 2026 },
];

const byId = new Map(CATALOG.map((e) => [e.id, e]));

export const entryFor = (id) => byId.get(id) || null;

/** Models, in the order the app lists them. */
export const MODELS = CATALOG.reduce(
  (acc, e) => (acc.includes(e.model) ? acc : [...acc, e.model]), [],
);

/** Model years offered for a model, newest first — that is how a picker reads. */
export function yearsFor(model) {
  const years = new Set();
  for (const e of CATALOG) {
    if (e.model !== model) continue;
    for (let y = e.from; y <= e.to; y++) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

/** Versions of a model sold in a given year. */
export function versionsFor(model, year) {
  return CATALOG.filter((e) => e.model === model && year >= e.from && year <= e.to);
}

/**
 * Resolve a (model, year, version) choice to a vehicle id, tolerating a
 * selection that no longer exists: changing the model or year can strand the
 * version, so fall back to the newest thing that does exist.
 */
export function resolveVehicle(model, year, version) {
  const inYear = versionsFor(model, year);
  const exact = inYear.find((e) => e.version === version);
  if (exact) return exact.id;
  if (inYear.length) return inYear[0].id;

  const anyYear = CATALOG.filter((e) => e.model === model);
  return anyYear.length ? anyYear[anyYear.length - 1].id : CATALOG[0].id;
}
