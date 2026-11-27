import { DistrictId, ExpansionId, Point } from '../data/districts';
import { ALL_LANDMARKS } from '../data/singaporeWorld';

export function expansionLandmarks(district: DistrictId) {
  return ALL_LANDMARKS.filter((l) => l.district === district);
}

export function landmarkNear(district: ExpansionId, point: Point) {
  return ALL_LANDMARKS.filter((l) => l.district === district).find(
    (landmark) => Math.hypot(landmark.x - point.x, landmark.y - point.y) < 54,
  );
}
