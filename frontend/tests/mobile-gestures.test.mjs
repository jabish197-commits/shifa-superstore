import test from 'node:test';
import assert from 'node:assert/strict';
import { tabSwipeDirection, sheetSwipeDown } from '../src/components/common/mobileGestures.js';

test('a deliberate horizontal swipe moves to the neighbouring tab', () => {
  assert.equal(tabSwipeDirection(-130, 14, 280), 1);
  assert.equal(tabSwipeDirection(110, -12, 330), -1);
});
test('vertical scrolling, diagonal scrolling and small taps do not switch tabs', () => {
  for (const gesture of [[-18, 150, 250], [95, 65, 300], [72, 45, 200], [35, 2, 180], [0, 0, 80]]) {
    assert.equal(tabSwipeDirection(...gesture), 0);
  }
});
test('slow drags do not unexpectedly change pages', () => {
  assert.equal(tabSwipeDirection(-140, 0, 1200), 0);
});
test('only a deliberate downward pull on the sheet header dismisses it', () => {
  assert.equal(sheetSwipeDown(8, 100), true);
  assert.equal(sheetSwipeDown(10, -100), false);
  assert.equal(sheetSwipeDown(110, 90), false);
  assert.equal(sheetSwipeDown(5, 25), false);
});
