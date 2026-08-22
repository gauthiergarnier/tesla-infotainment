/**
 * Which 3D car to draw in the left card, and what its moving parts are called.
 *
 * The upstream default is a generic 2018 Model 3 from a model marketplace:
 * 22 MB, and its node names are the exporter's (`bonnet_dummy`, `door_lf_dummy`).
 *
 * The 'firmware' preset points at the model the car actually draws on its own
 * screen, pulled out of the MCU image by the tesla-3d-renders pipeline
 * (`Ego/3_High/Model3_High` in the shipped Godot pack). It is ~3 MB — an order
 * of magnitude smaller, because it is built for an in-car GPU — and it is the
 * genuine article rather than a lookalike, with Tesla's own node naming.
 *
 * Select with REACT_APP_CAR_MODEL=firmware, after running:
 *
 *     npm run import:firmware-model -- /path/to/tesla-3d-renders-fw
 *
 * NOTE: the firmware model is Tesla's asset. The import script deliberately
 * writes into public/car-models/, which is gitignored for that file, so you do
 * not accidentally redistribute it from a public fork. Decide for yourself
 * whether to publish it.
 *
 * NOTE: the two models do not share an origin, scale or resting orientation.
 * The firmware preset carries its own transform below; expect to nudge it.
 */

const PRESETS = {
  marketplace: {
    file: 'tesla-model-3-2018.glb',
    parts: {
      frunk: 'bonnet_dummy',
      trunk: 'boot_dummy',
      doors: ['door_lf_dummy', 'door_lr_dummy', 'door_rf_dummy', 'door_rr_dummy'],
    },
    scale: 1,
    position: [0, 0, 0],
  },

  firmware: {
    file: 'Ego__3_High__Model3_High.glb',
    parts: {
      // Tesla's names, read straight out of the exported glTF node list.
      frunk: 'Hood',
      trunk: 'Trunk',
      doors: ['Door_LF', 'Door_LR', 'Door_RF', 'Door_RR'],
    },
    // Firmware models are authored in metres with the car's origin at the rear
    // axle; these are a starting point, not a calibrated answer.
    scale: 1,
    position: [0, 0, 0],
  },
};

const selected = process.env.REACT_APP_CAR_MODEL === 'firmware' ? 'firmware' : 'marketplace';

export const VEHICLE = PRESETS[selected];
export const VEHICLE_PRESET = selected;
export default VEHICLE;
