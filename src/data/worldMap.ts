import { DistrictId, Point } from './districts';
import {
  districtAtWorld,
  ISO_DISTRICT_DESTINATIONS,
  isWorldPointWalkable,
} from './singaporeWorld';
import { WORLD_HEIGHT as ISO_WORLD_H, WORLD_WIDTH as ISO_WORLD_W } from '../game/isoGrid';

export const SCENE_WIDTH = 1280;
export const SCENE_HEIGHT = 720;
export const WORLD_WIDTH = ISO_WORLD_W;
export const WORLD_HEIGHT = ISO_WORLD_H;

// Unified world coordinate space: every district shares (0, 0) origin.
export const DISTRICT_ORIGINS: Record<DistrictId, Point> = {
  park: { x: 0, y: 0 },
  estate: { x: 0, y: 0 },
  transport: { x: 0, y: 0 },
  block260: { x: 0, y: 0 },
  market: { x: 0, y: 0 },
  mall: { x: 0, y: 0 },
};

export const DISTRICTS = Object.keys(DISTRICT_ORIGINS) as DistrictId[];

export function worldPoint(_district: DistrictId, p: Point): Point {
  return { x: p.x, y: p.y };
}

export function localPoint(_district: DistrictId, p: Point): Point {
  return { x: p.x, y: p.y };
}

export function districtAt(x: number, y: number): DistrictId | undefined {
  return districtAtWorld(x, y);
}

export const DISTRICT_DESTINATIONS: Record<DistrictId, Point> = ISO_DISTRICT_DESTINATIONS;

export function onNeighbourhoodPath(x: number, y: number): boolean {
  return isWorldPointWalkable(x, y);
}
