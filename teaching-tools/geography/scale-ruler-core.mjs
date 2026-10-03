export function clampScale(value) {
  return Math.min(10000, Math.max(0.01, Number(value) || 0.01));
}

export function sliderToScale(position) {
  const p = Math.min(1, Math.max(0, Number(position) || 0));
  return 10 ** (-2 + p * 6);
}

export function scaleToSlider(scale) {
  const s = clampScale(scale);
  return (Math.log10(s) + 2) / 6;
}

export function computeMeasurement(pointAcm, pointBcm, scale) {
  const a = Number(pointAcm) || 0;
  const b = Number(pointBcm) || 0;
  const measuredCm = Math.abs(b - a);
  const actualCm = measuredCm * clampScale(scale);
  return { pointAcm: a, pointBcm: b, measuredCm, actualCm };
}

function trimNumber(value, digits = 2) {
  return Number(value.toFixed(digits)).toString();
}

export function formatLength(cm) {
  const value = Math.abs(Number(cm) || 0);
  if (value < 1) return trimNumber(value * 10) + ' mm';
  if (value < 100) return trimNumber(value) + ' cm';
  if (value < 100000) return trimNumber(value / 100) + ' m';
  return trimNumber(value / 100000) + ' km';
}

export function chooseTickStep(pixelsPerCm) {
  const p = Number(pixelsPerCm) || 0;
  if (p >= 80) return 0.1;
  if (p >= 20) return 0.5;
  if (p >= 5) return 1;
  return 5;
}


export function computeTwoWorldMeasurement(pixelDistance, mapPixelsPerCm, rulerPixelsPerCm) {
  const px = Math.abs(Number(pixelDistance) || 0);
  const mapPpcm = Math.max(0.000001, Math.abs(Number(mapPixelsPerCm) || 0));
  const rulerPpcm = Math.max(0.000001, Math.abs(Number(rulerPixelsPerCm) || 0));
  const mapCm = px / mapPpcm;
  const rulerCm = px / rulerPpcm;
  const scaleFactor = mapPpcm / rulerPpcm;
  return { pixelDistance: px, mapCm, rulerCm, scaleFactor };
}

export function chooseAdaptiveTickStep(pixelsPerCm) {
  const p = Math.max(0.000001, Math.abs(Number(pixelsPerCm) || 0));
  const raw = Math.max(0.01, 30 / p);
  const power = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / power;
  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * power;
}
