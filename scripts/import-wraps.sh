#!/usr/bin/env bash
# Copy the Paint Shop wrap catalogue into public/wraps/.
#
# The wraps are the car's own skin textures, extracted in the tesla-3d-renders
# project (assets/godot/Ego/<Vehicle>/Textures/Skins/*.stex -> PNG). They are
# ~108MB, so they are gitignored here and imported on demand instead.
#
#   ./scripts/import-wraps.sh [path-to-tesla-3d-renders]
set -euo pipefail

SRC="${1:-$HOME/Projects/tesla-3d-renders}/site/wraps"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/wraps"

if [ ! -d "$SRC" ]; then
  echo "No wrap source at $SRC" >&2
  echo "Pass the path to your tesla-3d-renders checkout as the first argument." >&2
  exit 1
fi

mkdir -p "$DEST" "$DEST/thumbs"
cp -f "$SRC"/*.png "$SRC"/manifest.json "$DEST"/

# The wraps themselves are 1024px with alpha; a picker showing fifty of them at
# full size would decode hundreds of MB, so the grid uses 192px thumbnails.
if command -v sips >/dev/null 2>&1; then
  ls "$DEST"/*.png | xargs -P 8 -I{} sh -c \
    'sips -Z 192 "$1" --out "$2/$(basename "$1")" >/dev/null 2>&1' _ {} "$DEST/thumbs"
else
  echo "sips not found - copying full-size images as thumbnails" >&2
  cp -f "$DEST"/*.png "$DEST/thumbs"/
fi

echo "Imported $(ls -1 "$DEST"/*.png | wc -l | tr -d ' ') wraps into public/wraps/"
