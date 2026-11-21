import assert from 'node:assert/strict';
import test from 'node:test';
import { coverMetrics, GROUND_Y, spriteBox } from '../src/ground.js';

test('a 16:9 frame puts the floor line on row 640', () => {
  const metrics = coverMetrics(1280, 720);
  assert.equal(metrics.ground, GROUND_Y);
  assert.equal(metrics.offsetY, 0);
});

test('a tall phone crops the sides and keeps the floor at the painting ratio', () => {
  const metrics = coverMetrics(390, 844);
  assert.ok(Math.abs(metrics.ground - 844 * (GROUND_Y / 720)) < 0.001);
  assert.equal(metrics.offsetY, 0);
});

test('a 768 wide stage still tracks the painting, not the element percent', () => {
  const metrics = coverMetrics(768, 1024);
  assert.ok(Math.abs(metrics.ground - 1024 * (GROUND_Y / 720)) < 0.001);
});

test('a wide short stage crops vertically from the center and keeps the floor inside', () => {
  const metrics = coverMetrics(1440, 640);
  assert.ok(metrics.ground > 500 && metrics.ground < 640);
  assert.ok(metrics.offsetY < 0);
});

test('sprite feet land on the ground line, including a non-zero offset', () => {
  const box = spriteBox({
    ground: 640,
    frameWidth: 126,
    frameHeight: 121,
    scale: 3,
    feetAnchorX: 61,
    feetOffset: 0,
  });
  assert.equal(box.feet, 640);
  assert.equal(box.width, 378);
  assert.equal(box.anchor, 183);

  const lifted = spriteBox({
    ground: 500,
    frameWidth: 100,
    frameHeight: 80,
    scale: 2,
    feetAnchorX: 40,
    feetOffset: 4,
  });
  assert.equal(lifted.feet, 500);
  assert.equal(lifted.top, 500 - 160 + 8);
});
