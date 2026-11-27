import { Point } from '../data/districts';
import { isTileWalkable } from '../data/singaporeWorld';
import { isoToWorld, MAP_COLS, MAP_ROWS, tileAtWorld } from './isoGrid';

type Walkable = (x: number, y: number) => boolean;

const STEPS: readonly [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/**
 * Tile-grid BFS pathfinding on the 64x64 isometric map with line-of-sight string-pulling,
 * allowing smooth click-to-walk across all six connected Singapore districts.
 */
export function findWalkRoute(start: Point, goal: Point, walkable: Walkable): Point[] {
  const clear = (a: Point, b: Point) => {
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    for (let i = 1; i <= count; i++) {
      if (!walkable(a.x + ((b.x - a.x) * i) / count, a.y + ((b.y - a.y) * i) / count)) return false;
    }
    return true;
  };

  if (clear(start, goal)) return [goal];

  const startTile = tileAtWorld(start.x, start.y);
  const goalTile = tileAtWorld(goal.x, goal.y);

  const keyOf = (c: number, r: number) => r * MAP_COLS + c;
  const fromKey = (k: number) => ({ col: k % MAP_COLS, row: Math.floor(k / MAP_COLS) });

  const nearestWalkable = (t: { col: number; row: number }) => {
    if (isTileWalkable(t.col, t.row)) return t;
    for (let rad = 1; rad <= 3; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          const nc = t.col + dc;
          const nr = t.row + dr;
          if (isTileWalkable(nc, nr)) return { col: nc, row: nr };
        }
      }
    }
    return null;
  };

  const s = nearestWalkable(startTile);
  const g = nearestWalkable(goalTile);
  if (!s || !g) return [];

  const startKey = keyOf(s.col, s.row);
  const goalKey = keyOf(g.col, g.row);
  if (startKey === goalKey) return clear(start, goal) ? [goal] : [isoToWorld(g.col, g.row)];

  const queue: number[] = [startKey];
  const parent = new Map<number, number>([[startKey, -1]]);

  for (let head = 0; head < queue.length; head++) {
    const key = queue[head];
    if (key === goalKey) {
      const raw: Point[] = [walkable(goal.x, goal.y) ? goal : isoToWorld(g.col, g.row)];
      for (let cur = parent.get(key) ?? -1; cur !== -1; cur = parent.get(cur) ?? -1) {
        if (cur === startKey) break;
        const t = fromKey(cur);
        raw.push(isoToWorld(t.col, t.row));
      }
      raw.reverse();

      const path: Point[] = [];
      let from = start;
      for (let i = 0; i < raw.length; ) {
        let next = i;
        while (next + 1 < raw.length && clear(from, raw[next + 1])) next++;
        from = raw[next];
        path.push(from);
        i = next + 1;
      }
      return path;
    }

    const { col, row } = fromKey(key);
    for (const [dc, dr] of STEPS) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= MAP_COLS || nr < 0 || nr >= MAP_ROWS) continue;
      const nextKey = keyOf(nc, nr);
      if (parent.has(nextKey) || !isTileWalkable(nc, nr)) continue;
      // Prevent cutting corners diagonally across solid tiles
      if (dc !== 0 && dr !== 0 && (!isTileWalkable(col + dc, row) || !isTileWalkable(col, row + dr))) {
        continue;
      }
      parent.set(nextKey, key);
      queue.push(nextKey);
    }
  }

  return [];
}
