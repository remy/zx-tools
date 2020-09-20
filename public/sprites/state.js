/**
 * @typedef { import("./SpriteSheet").default } SpriteSheet
 * @typedef { import("./TileMap").default } TileMap
 * @typedef { import("./Animate").Palette } Animate
 */

/**
 *
 * @param {object} options
 * @param {SpriteSheet} options.spriteSheet
 * @param {TileMap} options.tileMap
 * @param {Palette} options.palette
 * @param {Animate} options.animate
 */
export function saveState({ spriteSheet, tileMap, palette, animate }) {
  localStorage.setItem('tileMap', JSON.stringify(tileMap.serialize()));
  localStorage.setItem('spriteSheet', JSON.stringify(spriteSheet.serialize()));
  localStorage.setItem('palette', JSON.stringify(palette.serialize()));
  localStorage.setItem('animate', JSON.stringify(animate.serialize()));
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
  };
}
