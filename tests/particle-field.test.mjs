import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Load the standalone engine through its public API, with no browser fixture.
const source = readFileSync(new URL('../src/scripts/particle-field.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { ParticleField } = await import('data:text/javascript,' + encodeURIComponent(outputText));

function createField() {
  const field = new ParticleField({
    colors: [
      [8, 119, 173],
      [201, 193, 188],
      [8, 119, 173],
    ],
    density: 100,
    speed: 100,
    reducedMotion: false,
  });
  field.resize(599, 450);
  return field;
}

test('sampling a density fade does not retire particles until the explicit update', () => {
  const field = createField();
  field.setDensity(50, 0);
  const initial = field.frame(0);
  assert.equal(initial.orbit.length, 100);
  assert.equal(field.frame(1500).orbit.length, 50);
  assert.deepEqual(field.frame(0), initial, 'Sampling must not mutate the simulation');

  field.update(1500);
  assert.equal(field.frame(0).orbit.length, 50, 'Only update retires finished fades');
});

test('sampling a completed renewal does not change phase or expose mutable state', () => {
  const field = createField();
  const original = field.frame(0);
  const sampled = field.frame(0);
  sampled.orbit[0].x = -999;
  sampled.colors[0][0] = 999;
  assert.deepEqual(field.frame(0), original, 'Frame snapshots must not alias engine state');

  field.dropOrRenew(0);
  field.advance(5000, 5000);
  field.dropOrRenew(5000);
  field.advance(2250, 7250);
  const complete = field.frame(7250);
  assert.equal(complete.orbit.length, 100);
  assert.equal(field.phase, 'renewing');
  field.update(7250);
  assert.equal(field.phase, 'orbit');
  assert.equal(field.frame(7250).fallen.length, 0);
});
