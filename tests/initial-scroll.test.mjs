import assert from 'node:assert/strict';
import test from 'node:test';
import { createPage } from './helpers/page.mjs';

for (const navigation of ['navigate', 'reload']) {
  test(`${navigation} applies the requested desktop and mobile scroll positions`, () => {
    const desktop = createPage({ width: 1000, navigation });
    const mobile = createPage({ width: 720, navigation });
    assert.deepEqual(desktop.scrolls, [82]);
    assert.deepEqual(mobile.scrolls, [115]);
  });
}

test('reload applies the offset after a previously scrolled position', () => {
  const page = createPage({ navigation: 'reload', scrollY: 500, width: 1000 });
  assert.deepEqual(page.scrolls, [82]);
});

test('anchor navigation, history restoration, and existing fresh-navigation scroll are respected', () => {
  for (const options of [
    { hash: '#about' },
    { hash: '#projects', navigation: 'reload' },
    { navigation: 'back_forward', scrollY: 500 },
    { scrollY: 300 },
  ]) {
    const page = createPage(options);
    assert.deepEqual(page.scrolls, []);
  }
  const restored = createPage({ readyState: 'loading' });
  restored.pageShow(true);
  assert.deepEqual(restored.scrolls, []);
});

test('interacting before page-show prevents the automatic scroll', () => {
  const page = createPage({ readyState: 'loading' });
  page.interact();
  page.pageShow();
  assert.deepEqual(page.scrolls, []);
});

test('a deferred page-show applies the offset once', () => {
  const page = createPage({ readyState: 'loading', width: 1000 });
  assert.deepEqual(page.scrolls, []);
  page.pageShow();
  page.pageShow();
  assert.deepEqual(page.scrolls, [82]);
});
