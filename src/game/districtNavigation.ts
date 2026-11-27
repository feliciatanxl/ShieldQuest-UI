import { Point } from '../data/districts';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/worldMap';

type Walkable = (x: number, y: number) => boolean;
const GRID = 16;
const COLS = Math.floor(WORLD_WIDTH / GRID) + 1;
const ROWS = Math.floor(WORLD_HEIGHT / GRID) + 1;
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Reuse normal movement for tap-to-walk, with waypoints around painted obstacles. */
export function findWalkRoute(start: Point, goal: Point, walkable: Walkable): Point[] {
  const clear = (a: Point, b: Point) => {
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let i = 1; i <= count; i++) {
      if (!walkable(a.x + (b.x - a.x) * i / count, a.y + (b.y - a.y) * i / count)) return false;
    }
    return true;
  };
  if (clear(start, goal)) return [goal];
  const point = (key: number) => ({ x: key % COLS * GRID, y: Math.floor(key / COLS) * GRID });
  const seeds = (p: Point) => {
    const keys: number[] = [];
    const x = Math.round(p.x / GRID);
    const y = Math.round(p.y / GRID);
    for (let iy = Math.max(0, y - 1); iy <= Math.min(ROWS - 1, y + 1); iy++) {
      for (let ix = Math.max(0, x - 1); ix <= Math.min(COLS - 1, x + 1); ix++) {
        const key = iy * COLS + ix;
        if (clear(p, point(key))) keys.push(key);
      }
    }
    return keys;
  };
  const queue = seeds(start);
  const goals = new Set(seeds(goal));
  const parent = new Map(queue.map((key) => [key, -1]));
  for (let head = 0; head < queue.length; head++) {
    const key = queue[head];
    if (goals.has(key)) {
      const raw = [goal];
      for (let node = key; node !== -1; node = parent.get(node)!) raw.push(point(node));
      raw.reverse();
      const path: Point[] = [];
      let from = start;
      for (let i = 0; i < raw.length;) {
        let next = i;
        while (next + 1 < raw.length && clear(from, raw[next + 1])) next++;
        from = raw[next];
        path.push(from);
        i = next + 1;
      }
      return path;
    }
    const x = key % COLS;
    const y = Math.floor(key / COLS);
    for (const [dx, dy] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      const next = ny * COLS + nx;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || parent.has(next)) continue;
      if (!clear(point(key), point(next))) continue;
      parent.set(next, key);
      queue.push(next);
    }
  }
  return [];
}
