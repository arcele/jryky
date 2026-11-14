import assert from 'node:assert/strict';
import test from 'node:test';
import { createPage } from './helpers/page.mjs';

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, message ?? `${actual} ≠ ${expected}`);
}

function byRadius(dots) {
  return new Map(dots.map((dot) => [dot.radius, dot]));
}

function sameGeometry(actual, expected) {
  const reference = byRadius(expected);
  assert.equal(actual.length, expected.length);
  for (const dot of actual) {
    const original = reference.get(dot.radius);
    assert.ok(original, 'The same particles must be present');
    near(dot.x, original.x);
    near(dot.y, original.y);
  }
}

function rotation(before, after, page) {
  const x = page.width / 2;
  const y = page.height * 0.43;
  return (before.x - x) * (after.y - y) - (before.y - y) * (after.x - x);
}

test('speed endpoints and midpoint apply from the first frame', () => {
  const normal = createPage();
  const fast = createPage({ saved: new Map([['jryky.dot-speed', '200']]) });
  const slow = createPage({ saved: new Map([['jryky.dot-speed', '0']]) });
  normal.advance(30);
  fast.advance(10);
  sameGeometry(fast.orbitDots(), normal.orbitDots());

  const reference = createPage();
  reference.advance(10);
  slow.advance(30);
  sameGeometry(slow.orbitDots(), reference.orbitDots());
  assert.equal(fast.speed.getAttribute('aria-valuetext'), '3.00× normal speed');
  assert.equal(slow.speed.getAttribute('aria-valuetext'), '0.33× normal speed');
});

test('changing speed preserves orbital position', () => {
  const page = createPage();
  page.advance(100);
  const before = page.orbitDots();
  page.setSlider(page.speed, 200);
  page.frame();
  sameGeometry(page.orbitDots(), before);
  page.advance(10);

  const reference = createPage();
  reference.advance(130);
  sameGeometry(page.orbitDots(), reference.orbitDots());
});

test('reversal slows through a stop and changes direction without a position jump', () => {
  const page = createPage();
  const initial = page.orbitDots()[0];
  page.advance(50);
  const before = page.orbitDots();
  const normalDirection = Math.sign(rotation(initial, before[0], page));

  page.reverse.click();
  page.frame();
  sameGeometry(page.orbitDots(), before);
  assert.equal(page.reverse.getAttribute('aria-pressed'), 'true');

  page.advance(500);
  const stopped = page.orbitDots()[0];
  page.advance(10);
  const afterStop = page.orbitDots()[0];
  const reference = createPage();
  const referenceStart = reference.orbitDots()[0];
  reference.advance(10);
  const normalDistance = Math.hypot(
    reference.orbitDots()[0].x - referenceStart.x,
    reference.orbitDots()[0].y - referenceStart.y,
  );
  assert.ok(Math.hypot(afterStop.x - stopped.x, afterStop.y - stopped.y) < normalDistance * 0.05);

  page.advance(490);
  const reversed = page.orbitDots()[0];
  page.advance(50);
  assert.equal(Math.sign(rotation(reversed, page.orbitDots()[0], page)), -normalDirection);

  page.reverse.click();
  page.advance(200);
  const duringTransition = page.orbitDots();
  page.reverse.click();
  page.frame();
  sameGeometry(page.orbitDots(), duringTransition);
  page.advance(1000);
  const afterRapidClicks = page.orbitDots()[0];
  page.advance(50);
  assert.equal(Math.sign(rotation(afterRapidClicks, page.orbitDots()[0], page)), -normalDirection);
});

test('density changes fade particles and replace removed dots with new ones', () => {
  const page = createPage();
  const original = byRadius(page.orbitDots());
  assert.equal(original.size, 100);

  page.setSlider(page.density, 50);
  page.frame();
  assert.equal(page.orbitDots().length, 100);
  page.advance(750);
  let fading = 0;
  for (const dot of page.orbitDots()) {
    const ratio = dot.alpha / original.get(dot.radius).alpha;
    if (Math.abs(ratio - 0.5) < 1e-9) fading++;
    else near(ratio, 1, 'Retained dots keep their opacity');
  }
  assert.equal(fading, 50);
  page.advance(750);
  const survivors = byRadius(page.orbitDots());
  assert.equal(survivors.size, 50);

  page.setSlider(page.density, 150);
  page.frame();
  assert.equal(page.orbitDots().length, 50, 'New particles start transparent');
  page.advance(375);
  const halfway = byRadius(page.orbitDots());
  assert.equal(halfway.size, 150);
  page.advance(375);
  for (const dot of page.orbitDots()) {
    if (survivors.has(dot.radius)) near(dot.alpha, survivors.get(dot.radius).alpha);
    else {
      assert.ok(!original.has(dot.radius), 'Removed identities must not be reused');
      near(halfway.get(dot.radius).alpha, dot.alpha / 2);
    }
  }
});

test('increasing density mid-removal creates new particles without reviving retiring ones', () => {
  const page = createPage();
  const original = byRadius(page.orbitDots());
  page.setSlider(page.density, 50);
  page.advance(300);
  const retiring = page.orbitDots().filter((dot) => dot.alpha < original.get(dot.radius).alpha);
  assert.equal(retiring.length, 50);

  page.setSlider(page.density, 100);
  page.advance(750);
  assert.equal(page.orbitDots().length, 150);
  for (const dot of page.orbitDots()) {
    if (retiring.some((old) => old.radius === dot.radius)) {
      near(dot.alpha, original.get(dot.radius).alpha * 0.3);
    }
  }
  page.advance(450);
  assert.equal(page.orbitDots().length, 100);
  assert.ok(page.orbitDots().every((dot) => !retiring.some((old) => old.radius === dot.radius)));
});

test('dropping preserves each visible particle’s geometry, color, and opacity', () => {
  const page = createPage();
  page.setSlider(page.density, 50);
  page.advance(375);
  const before = page
    .orbitDots()
    .filter(
      (dot) =>
        dot.x + dot.radius >= 0 &&
        dot.x - dot.radius <= page.width &&
        dot.y + dot.radius >= 0 &&
        dot.y - dot.radius <= page.height,
    );

  page.drop.click();
  assert.equal(page.orbitDots().length, 0);
  assert.deepEqual(page.fallenDots(), before);
  assert.equal(page.drop.getAttribute('aria-label'), 'Create a new dot field');
  assert.ok(page.drop.classList.contains('is-dropped'));
});

test('fallen particles bounce and settle exactly at the bottom', () => {
  const page = createPage();
  page.drop.click();
  let previous = byRadius(page.fallenDots());
  let bounced = false;
  for (let elapsed = 0; elapsed < 5000; elapsed += 50) {
    page.advance(50);
    for (const dot of page.fallenDots()) {
      assert.ok(dot.y + dot.radius <= page.height + 1e-9);
      if (dot.y < previous.get(dot.radius).y - 0.01) bounced = true;
    }
    previous = byRadius(page.fallenDots());
  }
  assert.ok(bounced, 'At least one particle must move upward after impact');
  for (const dot of page.fallenDots()) near(dot.y + dot.radius, page.height);
});

test('renewal finishes the old fade before showing the new field and ignores repeat clicks', () => {
  const page = createPage();
  page.drop.click();
  page.advance(5000);
  const oldDots = byRadius(page.fallenDots());
  page.drop.click();
  assert.equal(page.drop.disabled, true);
  page.drop.click();
  page.advance(750);
  assert.equal(page.orbitDots().length, 0);
  for (const dot of page.fallenDots()) near(dot.alpha, oldDots.get(dot.radius).alpha / 2);

  page.advance(750);
  assert.equal(page.fallenDots().length, 0);
  assert.equal(page.orbitDots().length, 0);
  page.advance(375);
  const halfway = byRadius(page.orbitDots());
  assert.equal(halfway.size, 100);
  assert.equal(page.drop.disabled, true);
  page.advance(375);
  assert.equal(page.drop.disabled, false);
  assert.equal(page.fallenDots().length, 0);
  for (const dot of page.orbitDots()) {
    assert.ok(!oldDots.has(dot.radius), 'The regenerated field must be fresh');
    near(halfway.get(dot.radius).alpha, dot.alpha / 2);
  }
});

test('reduced motion uses immediate density, drop, and renewal updates', () => {
  const page = createPage({ reducedMotion: true });
  const initial = page.orbitDots();
  page.advance(1000);
  assert.deepEqual(page.orbitDots(), initial);
  page.setSlider(page.density, 150);
  assert.equal(page.orbitDots().length, 150);
  page.drop.click();
  assert.equal(page.orbitDots().length, 0);
  for (const dot of page.fallenDots()) near(dot.y + dot.radius, page.height);
  page.drop.click();
  assert.equal(page.fallenDots().length, 0);
  assert.equal(page.orbitDots().length, 150);
  assert.equal(page.drop.disabled, false);
  assert.equal(page.pendingFrames(), 0);
});

test('hiding and restoring the tab preserves the orbital position', () => {
  const page = createPage();
  page.advance(100);
  const before = page.orbitDots();
  page.setHidden(true);
  page.advance(10000);
  sameGeometry(page.orbitDots(), before);
  page.setHidden(false);
  page.frame();
  sameGeometry(page.orbitDots(), before);
});

test('resizing a dropped field preserves its particles and lets them settle on the new floor', () => {
  const page = createPage();
  page.drop.click();
  page.advance(5000);
  const original = byRadius(page.fallenDots());
  page.resize(1200, 700);
  page.advance(5000);
  assert.equal(page.fallenDots().length, original.size);
  for (const dot of page.fallenDots()) {
    near(dot.alpha, original.get(dot.radius).alpha);
    near(dot.y + dot.radius, page.height);
  }
  page.setSlider(page.density, 75);
  page.drop.click();
  page.advance(2250);
  // The wider layout uses 220 dots at its default density.
  assert.ok(page.orbitDots().length > 100);
  assert.ok(page.orbitDots().length <= 165);
  assert.equal(page.fallenDots().length, 0);
});

test('enabling reduced motion during renewal completes the transition immediately', () => {
  const page = createPage();
  page.drop.click();
  page.advance(5000);
  page.drop.click();
  page.advance(300);
  assert.equal(page.drop.disabled, true);
  page.setReducedMotion(true);
  assert.equal(page.fallenDots().length, 0);
  assert.equal(page.orbitDots().length, 100);
  assert.equal(page.drop.disabled, false);
  assert.equal(page.pendingFrames(), 0);
});
