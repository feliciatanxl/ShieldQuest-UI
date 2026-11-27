import { DistrictId } from '../data/districts';
import { districtAt, localPoint, onNeighbourhoodPath } from '../data/worldMap';
import { expansionWalkable } from './expansionGeometry';
import { isWalkable } from './sceneRenderer';

export function canWalkIn(district: DistrictId, x: number, y: number) {
  return district === 'block260' ? isWalkable(x, y) : expansionWalkable(district, x, y);
}

export function canWalkAt(x: number, y: number) {
  if (onNeighbourhoodPath(x, y)) return true;
  const area = districtAt(x, y);
  if (!area) return false;
  const point = localPoint(area, { x, y });
  return canWalkIn(area, point.x, point.y);
}
