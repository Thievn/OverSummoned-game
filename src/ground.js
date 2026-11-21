export const IMG_W = 1280;
export const IMG_H = 720;
export const GROUND_Y = 640;

/**
 * Map a source-image row onto an element using the same math as
 * background-size: cover and background-position: center center.
 * groundY is a pixel row in the painting (640 of 720), not a percent of the element.
 */
export function coverMetrics(
  containerW,
  containerH,
  imgW = IMG_W,
  imgH = IMG_H,
  groundY = GROUND_Y,
) {
  const scale = Math.max(containerW / imgW, containerH / imgH);
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;
  return {
    scale,
    offsetX,
    offsetY,
    renderedW,
    renderedH,
    ground: offsetY + groundY * scale,
  };
}

export function spriteBox({
  ground,
  frameWidth,
  frameHeight,
  scale,
  feetAnchorX,
  feetOffset = 0,
}) {
  const width = frameWidth * scale;
  const height = frameHeight * scale;
  const footLift = feetOffset * scale;
  const top = ground - height + footLift;
  const anchor = feetAnchorX * scale;
  return {
    width,
    height,
    top,
    anchor,
    feet: top + height - footLift,
  };
}
