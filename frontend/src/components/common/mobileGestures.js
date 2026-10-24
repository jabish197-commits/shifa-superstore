export function tabSwipeDirection(dx, dy, elapsed) {
  if (Math.abs(dx) < 72 || Math.abs(dy) > 48 || Math.abs(dx) < Math.abs(dy) * 1.8 || elapsed > 700) return 0;
  return dx < 0 ? 1 : -1;
}

export function sheetSwipeDown(dx, dy) {
  return dy > 60 && Math.abs(dx) < 45;
}
