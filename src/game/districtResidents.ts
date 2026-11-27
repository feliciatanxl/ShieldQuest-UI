import { ExpansionId, Point } from '../data/districts';
import { DISTRICT_RESIDENTS } from '../data/singaporeWorld';
import { NPCEntity } from '../types/game';
import { directionFor } from './sceneRenderer';

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function residentAt(route: Point[], sheet: NPCEntity['id'], name: string, role: string, time: number): NPCEntity {
  const segments = [...route, ...route.slice(0, -1).reverse()].slice(1).map((to, i, tail) => {
    const from = i === 0 ? route[0] : tail[i - 1];
    return { from, to, distance: distance(from, to) };
  });
  const total = segments.reduce((acc, s) => acc + s.distance, 0);
  if (total <= 0) return { id: sheet, name, role, ...route[0], dir: 'south' };
  let progress = (time * 52) % total;
  for (const { from, to, distance: length } of segments) {
    if (progress < length) {
      const f = progress / length;
      return {
        id: sheet,
        name,
        role,
        x: from.x + (to.x - from.x) * f,
        y: from.y + (to.y - from.y) * f,
        dir: directionFor(to.x - from.x, to.y - from.y),
        walking: true,
      };
    }
    progress -= length;
  }
  return { id: sheet, name, role, ...route[0], dir: 'south' };
}

export function districtResidents(
  district: ExpansionId,
  player: Point,
  dt: number,
  clocks: Map<string, number>,
): NPCEntity[] {
  return DISTRICT_RESIDENTS.filter((r) => r.district === district).map((resident) => {
    const key = resident.id;
    const time = clocks.get(key) ?? 0;
    const now = residentAt(resident.route, resident.sheet, resident.name, resident.role, time);
    const next = residentAt(resident.route, resident.sheet, resident.name, resident.role, time + dt);
    if (dt > 0 && distance(next, player) < 70 && distance(next, player) < distance(now, player)) {
      return { ...now, walking: false };
    }
    clocks.set(key, time + dt);
    return next;
  });
}
