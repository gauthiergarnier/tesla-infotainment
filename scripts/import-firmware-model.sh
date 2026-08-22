#!/usr/bin/env bash
#
# Copy the car model the MCU actually renders on its own screen into
# public/car-models/, so the simulator can draw the real thing instead of a
# marketplace lookalike.
#
#   ./scripts/import-firmware-model.sh /path/to/tesla-3d-renders-fw
#
# then set REACT_APP_CAR_MODEL=firmware in .env and restart the dev server.
#
# The source is the output of the tesla-3d-renders firmware pipeline
# (pipeline/build_fw.sh), which unpacks /usr/tesla/UI/assets/ap_visualization.zip
# out of an .mcu2 SquashFS image and exports the Godot scenes to glTF.
#
# The imported file is Tesla's asset and is gitignored — publishing it from a
# public fork is your call to make, not this script's.
set -euo pipefail

SRC_REPO="${1:?usage: import-firmware-model.sh <path-to-tesla-3d-renders-fw>}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/car-models"

MODEL="Ego__3_High__Model3_High.glb"
SRC="$SRC_REPO/site2/models/$MODEL"

if [[ ! -f "$SRC" ]]; then
  echo "error: $SRC not found." >&2
  echo "Run the firmware pipeline first:" >&2
  echo "  cd $SRC_REPO && ./pipeline/build_fw.sh /path/to/<version>.mcu2" >&2
  exit 1
fi

mkdir -p "$DEST"
cp -f "$SRC" "$DEST/$MODEL"

# The sidecar carries the node/material tables — handy when mapping part names.
[[ -f "${SRC%.glb}.json" ]] && cp -f "${SRC%.glb}.json" "$DEST/${MODEL%.glb}.json"

echo "imported $(du -h "$DEST/$MODEL" | cut -f1)  ->  public/car-models/$MODEL"
echo
echo "Next:"
echo "  1. echo 'REACT_APP_CAR_MODEL=firmware' >> .env"
echo "  2. npm start"
echo
echo "Part names are mapped in src/config/vehicleConfig.js. The two models do"
echo "not share a scale or resting orientation, so expect to tune the transform."
