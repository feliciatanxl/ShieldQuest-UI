import { ExpansionId, Point, toCanvas } from '../data/districts';
import { NPCEntity } from '../types/game';
import { GEOMETRY } from './expansionGeometry';
import { directionFor } from './sceneRenderer';

function residentAt(id: ExpansionId, index: number, time: number): NPCEntity {
  const resident = GEOMETRY[id].residents[index];
  const route = resident.route.map(toCanvas);
  const segments = [...route, ...route.slice(0, -1).reverse()].slice(1).map((to, i, tail) => {
    const from = i === 0 ? route[0] : tail[i - 1];
    return { from, to, distance: distance(from, to) };
  });
  let progress = time * 52 % segments.reduce((total, step) => total + step.distance, 0);
  for (const { from, to, distance: length } of segments) {
    if (progress < length) {
      const f = progress / length;
      return {
        id: resident.sheet, name: resident.name, role: resident.role,
        x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f,
        dir: directionFor(to.x - from.x, to.y - from.y), walking: true,
      };
    }
    progress -= length;
  }
  return { id: resident.sheet, name: resident.name, role: resident.role, ...route[0], dir: 'south' };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function districtResidents(
  district: ExpansionId, player: Point, dt: number, clocks: Map<string, number>,
): NPCEntity[] {
  return GEOMETRY[district].residents.map((_, index) => {
    const key = `${district}:${index}`;
    const time = clocks.get(key) ?? 0;
    const now = residentAt(district, index, time);
    const next = residentAt(district, index, time + dt);
    if (dt > 0 && distance(next, player) < 70 && distance(next, player) < distance(now, player)) {
      return { ...now, walking: false };
    }
    clocks.set(key, time + dt);
    return next;
  });
}
