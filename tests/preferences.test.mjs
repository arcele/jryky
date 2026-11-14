import assert from 'node:assert/strict';
import test from 'node:test';
import { createPage } from './helpers/page.mjs';

test('density and speed settings save and restore before the first frame', () => {
  const saved = new Map();
  const page = createPage({ saved });
  page.setSlider(page.density, 125);
  page.setSlider(page.speed, 25);
  assert.equal(saved.get('jryky.dot-density'), '125');
  assert.equal(saved.get('jryky.dot-speed'), '25');

  const reload = createPage({ saved });
  assert.equal(reload.density.value, '125');
  assert.equal(reload.speed.value, '25');
  assert.equal(reload.orbitDots().length, 125);
  assert.equal(reload.density.getAttribute('aria-valuetext'), '125% of default');
  assert.equal(reload.speed.getAttribute('aria-valuetext'), '0.44× normal speed');
});

test('invalid numeric preferences fall back to defaults, while zero speed is valid', () => {
  for (const invalid of ['', 'NaN', 'Infinity', '-1', '9999', '100.5', 'invalid']) {
    const page = createPage({
      saved: new Map([
        ['jryky.dot-density', invalid],
        ['jryky.dot-speed', invalid],
      ]),
    });
    assert.equal(page.density.value, '100', invalid);
    assert.equal(page.speed.value, '100', invalid);
    assert.equal(page.orbitDots().length, 100);
  }
  const slow = createPage({ saved: new Map([['jryky.dot-speed', '0']]) });
  assert.equal(slow.speed.value, '0');
});

test('theme changes blend continuously, preserve geometry, and save the chosen palette', () => {
  const saved = new Map();
  const page = createPage({ saved });
  const initial = page.orbitDots();
  page.selectTheme('violet');
  assert.deepEqual(page.orbitDots(), initial, 'A theme switch begins at the displayed colors');
  assert.equal(saved.get('jryky.bubble-palette'), 'violet');
  assert.equal(page.root.style.getPropertyValue('--portrait-orbit-light'), '#7c3aed');
  assert.equal(page.root.style.getPropertyValue('--portrait-orbit-dark'), '#b497ff');

  page.advance(400);
  const blended = page.orbitDots();
  assert.notEqual(blended[0].color, initial[0].color);
  page.selectTheme('ocean');
  assert.deepEqual(page.orbitDots(), blended, 'Rapid switching continues from the current blend');
  page.advance(800);
  assert.equal(page.orbitDots()[0].color, initial[0].color);

  page.selectTheme('violet');
  const reload = createPage({ saved });
  assert.equal(reload.root.dataset.palette, 'violet');
  assert.equal(reload.theme.getAttribute('aria-valuetext'), 'Purple / Magenta');
  assert.equal(reload.panel.classList.contains('is-open'), false);
});

test('system dark mode updates the palette without restarting the field', () => {
  const page = createPage({ reducedMotion: true });
  page.selectTheme('violet');
  const before = page.orbitDots();
  page.setDark(true);
  const after = page.orbitDots();
  assert.deepEqual(
    after.map(({ x, y, radius }) => ({ x, y, radius })),
    before.map(({ x, y, radius }) => ({ x, y, radius })),
  );
  assert.notEqual(after[0].color, before[0].color);
  page.setDark(false);
  assert.deepEqual(page.orbitDots(), before);
});

test('custom colors apply only on confirmation and restore on reload', () => {
  const saved = new Map();
  const page = createPage({ saved });
  page.selectTheme('custom');
  page.frame();
  assert.equal(page.panel.classList.contains('is-open'), true);
  assert.equal(page.root.dataset.palette, 'ocean');

  const colors = ['#ff6600', '#33cc88', '#cc44ff'];
  page.swatches.forEach((swatch, index) => {
    swatch.value = colors[index];
  });
  page.apply.click();
  page.frame();
  assert.equal(page.panel.classList.contains('is-open'), false);
  assert.equal(page.root.dataset.palette, 'custom');
  assert.equal(saved.get('jryky.bubble-palette'), 'custom');
  assert.deepEqual(JSON.parse(saved.get('jryky.custom-palette')), colors);
  assert.equal(page.root.style.getPropertyValue('--portrait-orbit-light'), '#ff6600');

  const reload = createPage({ saved });
  assert.equal(reload.root.dataset.palette, 'custom');
  assert.equal(reload.panel.classList.contains('is-open'), false);
  assert.deepEqual(
    new Set(reload.orbitDots().map((dot) => dot.color)),
    new Set(['rgb(255, 102, 0)', 'rgb(51, 204, 136)', 'rgb(204, 68, 255)']),
  );
  reload.selectTheme('ocean');
  reload.selectTheme('custom');
  reload.frame();
  assert.deepEqual(
    reload.swatches.map((swatch) => swatch.value),
    colors,
  );
});

for (const action of ['cancel', 'escape']) {
  test(`custom palette ${action} discards unconfirmed edits`, () => {
    const saved = new Map([['jryky.bubble-palette', 'fall']]);
    const page = createPage({ saved });
    page.selectTheme('custom');
    page.frame();
    page.swatches[0].value = '#123456';
    if (action === 'cancel') page.cancel.click();
    else page.escape();
    assert.equal(page.panel.classList.contains('is-open'), false);
    assert.equal(page.root.dataset.palette, 'fall');
    assert.equal(page.theme.getAttribute('aria-valuetext'), 'Fall');
    assert.equal(saved.get('jryky.bubble-palette'), 'fall');
    assert.equal(saved.has('jryky.custom-palette'), false);
  });
}

test('invalid stored custom palettes cannot become the active theme', () => {
  for (const invalid of ['not json', 'null', '[]', '["#123456"]', '["red","green","blue"]']) {
    const page = createPage({
      saved: new Map([
        ['jryky.bubble-palette', 'custom'],
        ['jryky.custom-palette', invalid],
      ]),
    });
    assert.equal(page.root.dataset.palette, 'ocean', invalid);
    assert.equal(page.panel.classList.contains('is-open'), false);
  }
});

test('controls remain usable when browser storage is unavailable', () => {
  const page = createPage({ storageBlocked: true, reducedMotion: true });
  page.setSlider(page.density, 125);
  page.setSlider(page.speed, 150);
  assert.equal(page.orbitDots().length, 125);
  assert.equal(page.speed.getAttribute('aria-valuetext'), '1.73× normal speed');
  page.selectTheme('custom');
  page.frame();
  page.swatches[0].value = '#123456';
  page.apply.click();
  page.frame();
  assert.equal(page.root.dataset.palette, 'custom');
  assert.equal(page.root.style.getPropertyValue('--portrait-orbit-light'), '#123456');
  assert.equal(page.saved.size, 0);
});
