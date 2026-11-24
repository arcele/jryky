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

test('wind accelerates either way from the existing positions without changing bubble opacity', () => {
  for (const direction of [-1, 1]) {
    const field = createField();
    const original = field.frame(0).orbit;
    field.blowOrRenew(0, direction);
    assert.equal(field.windDirection, direction);
    assert.deepEqual(field.frame(0).gust, original);
    assert.equal(field.frame(0).orbit.length, 0);
    const positions = [original[0].x];
    for (let time = 100; time <= 300; time += 100) {
      field.advance(100, time);
      const gust = field.frame(time).gust;
      positions.push(gust[0].x);
      for (const dot of gust) {
        const reference = original.find((before) => before.radius === dot.radius);
        assert.equal(dot.alpha, reference.alpha);
        assert.equal(dot.color, reference.color);
        assert.ok(direction * (dot.x - reference.x) > 0);
      }
    }
    const firstTravel = direction * (positions[1] - positions[0]);
    const laterTravel = direction * (positions[3] - positions[2]);
    assert.ok(
      laterTravel > firstTravel * 2,
      'The gust should build instead of starting at full speed',
    );
    const snapshot = field.frame(300);
    snapshot.gust[0].x = -999;
    assert.notEqual(field.frame(300).gust[0].x, -999);
    field.advance(5000, 5300);
    field.update(5300);
    assert.equal(field.phase, 'blown');
    assert.equal(field.frame(5300).gust.length, 0);
    field.blowOrRenew(5300, direction);
    field.advance(750, 6050);
    field.update(6050);
    assert.equal(field.phase, 'orbit');
    assert.equal(field.frame(6050).orbit.length, 100);
  }
});

test('wind substeps produce consistent trajectories for different frame lengths', () => {
  const coarse = createField();
  const fine = createField();
  coarse.blowOrRenew(0, 1);
  fine.blowOrRenew(0, 1);
  coarse.advance(800, 800);
  for (let time = 16; time <= 800; time += 16) fine.advance(16, time);
  const expected = fine.frame(800).gust;
  const actual = coarse.frame(800).gust;
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < actual.length; index++) {
    assert.ok(Math.abs(actual[index].x - expected[index].x) < 1e-8);
    assert.ok(Math.abs(actual[index].y - expected[index].y) < 1e-8);
  }
});
