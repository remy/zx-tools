/**
 * @typedef { import("./SpriteSheet").default } SpriteSheet
 * @typedef { import("./TileMap").default } TileMap
 * @typedef { import("./Animate").Palette } Animate
 */

/**
 * Saves object to localStorage so long as it implements the serialize method
 *
 * @param {object} settings
 */
export function saveState(settings) {
  Object.keys(settings).forEach((key) => {
    localStorage.setItem(key, JSON.stringify(settings[key].serialize()));
  });

  localStorage.setItem('lastSaved', Date.now());
}

/**
 * @returns {object} Serialised sprite data
 */
export function restoreState() {
  return {
    lastSaved: parseInt(localStorage.getItem('lastSaved'), 10),
    tileMap: JSON.parse(localStorage.getItem('tileMap')),
    spriteSheet: JSON.parse(localStorage.getItem('spriteSheet')),
    palette: JSON.parse(localStorage.getItem('palette')),
    animate: JSON.parse(localStorage.getItem('animate')),
    exporter: JSON.parse(localStorage.getItem('exporter')),
  };
}
