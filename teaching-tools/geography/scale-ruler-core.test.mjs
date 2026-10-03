import assert from 'node:assert/strict';
import {
  clampScale,
  sliderToScale,
  scaleToSlider,
  computeMeasurement,
  formatLength,
  chooseTickStep,
  computeTwoWorldMeasurement,
  chooseAdaptiveTickStep
} from './scale-ruler-core.mjs';

function approx(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, actual + ' != ' + expected);
}

assert.equal(clampScale(0.001), 0.01);
assert.equal(clampScale(20000), 10000);
assert.equal(clampScale(12.5), 12.5);

approx(sliderToScale(0), 0.01);
approx(sliderToScale(1), 10000);
approx(scaleToSlider(0.01), 0);
approx(scaleToSlider(10000), 1);
approx(sliderToScale(scaleToSlider(37.5)), 37.5, 1e-8);

assert.deepEqual(computeMeasurement(2, 7, 1000), {
  pointAcm: 2,
  pointBcm: 7,
  measuredCm: 5,
  actualCm: 5000
});
assert.deepEqual(computeMeasurement(7, 2, 0.01), {
  pointAcm: 7,
  pointBcm: 2,
  measuredCm: 5,
  actualCm: 0.05
});

assert.equal(formatLength(0.05), '0.5 mm');
assert.equal(formatLength(5), '5 cm');
assert.equal(formatLength(250), '2.5 m');
assert.equal(formatLength(250000), '2.5 km');

assert.equal(chooseTickStep(120), 0.1);
assert.equal(chooseTickStep(30), 0.5);
assert.equal(chooseTickStep(10), 1);
assert.equal(chooseTickStep(2), 5);

console.log('scale-ruler-core tests passed');


assert.deepEqual(
  computeTwoWorldMeasurement(120, 60, 30),
  { pixelDistance: 120, mapCm: 2, rulerCm: 4, scaleFactor: 2 }
);
assert.deepEqual(
  computeTwoWorldMeasurement(120, 60, 15),
  { pixelDistance: 120, mapCm: 2, rulerCm: 8, scaleFactor: 4 }
);
assert.deepEqual(
  computeTwoWorldMeasurement(120, 60, 240),
  { pixelDistance: 120, mapCm: 2, rulerCm: 0.5, scaleFactor: 0.25 }
);
assert.deepEqual(
  computeTwoWorldMeasurement(60, 60, 12),
  { pixelDistance: 60, mapCm: 1, rulerCm: 5, scaleFactor: 5 }
);

assert.equal(chooseAdaptiveTickStep(6000), 0.01);
assert.equal(chooseAdaptiveTickStep(60), 0.5);
assert.equal(chooseAdaptiveTickStep(6), 5);
assert.equal(chooseAdaptiveTickStep(0.006), 5000);

console.log('two-world model tests passed');
