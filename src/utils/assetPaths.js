import { teslaIconFile, isMonoIcon } from '../config/teslaIcons';

export function getImagePath(imageName) {
    const baseUrl = process.env.PUBLIC_URL || '';
    return `${baseUrl}/img/${imageName}`;
}

export function getCarModelPath(modelName) {
    const baseUrl = process.env.PUBLIC_URL || '';
    return `${baseUrl}/car-models/${modelName}`;
}

/**
 * Icon for an app or control tile.
 *
 * Streaming apps and car-feature controls resolve to the car's own artwork
 * (colour for the streaming brands, monochrome for the features); everything
 * else uses the project's own coloured `app-*.svg`. So apps stay colourful and
 * only genuine car functions are monochrome, matching the real dash.
 */
export function getAppIconPath(appName) {
    const tesla = teslaIconFile(appName);
    return getImagePath(tesla || `app-${appName}.svg`);
}

/** True when the tile is a monochrome glyph that must be tinted for its surface. */
export function isTintedIcon(appName) {
    return isMonoIcon(appName);
}
