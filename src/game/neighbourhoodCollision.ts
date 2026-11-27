import { DistrictId } from '../data/districts';
import { isWorldPointWalkable } from '../data/singaporeWorld';

export function canWalkIn(_district: DistrictId, x: number, y: number) {
  return isWorldPointWalkable(x, y);
}

export function canWalkAt(x: number, y: number) {
  return isWorldPointWalkable(x, y);
}
