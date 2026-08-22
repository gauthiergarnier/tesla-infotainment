import { teslaIconFile } from '../config/teslaIcons';

export function getImagePath(imageName) {
    const baseUrl = process.env.PUBLIC_URL || '';
    return `${baseUrl}/img/${imageName}`;
}

export function getCarModelPath(modelName) {
    const baseUrl = process.env.PUBLIC_URL || '';
    return `${baseUrl}/car-models/${modelName}`;
}

/**
 * Icon for an app tile. Prefers the car's own artwork wherever the firmware
 * exposes it as a loose file, and falls back to the project's SVG otherwise
 * (the third-party music services are not in the image).
 */
export function getAppIconPath(appName) {
    const tesla = teslaIconFile(appName);
    return getImagePath(tesla || `app-${appName}.svg`);
}

/** True when the tile is being drawn with Tesla's own artwork. */
export function isTeslaIcon(appName) {
    return !!teslaIconFile(appName);
}
