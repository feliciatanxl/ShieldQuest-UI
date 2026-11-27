import { DistrictId, Point } from '../data/districts';
import { NPCEntity } from '../types/game';

export const ART_SCALE = 2;
export const TILE_W = 64;
export const TILE_H = 32;
export const HALF_W = TILE_W / 2;
export const HALF_H = TILE_H / 2;

export const MAP_COLS = 52;
export const MAP_ROWS = 52;

export const ORIGIN_X = 1792;
export const ORIGIN_Y = 256;
export const WORLD_WIDTH = 3584;
export const WORLD_HEIGHT = 2176;

export type TileId =
  | 'grass'
  | 'grass_tuft'
  | 'grass_flower'
  | 'pavement'
  | 'pavement_alt'
  | 'void_deck'
  | 'plaza'
  | 'plaza_alt'
  | 'road_plain'
  | 'road_se'
  | 'road_sw'
  | 'road_busbay'
  | 'road_taxibay'
  | 'road_yellowbox'
  | 'zebra_sw'
  | 'zebra_se'
  | 'drain_se'
  | 'drain_sw'
  | 'tactile'
  | 'pcn_red'
  | 'pcn_green'
  | 'playground_orange'
  | 'playground_blue'
  | 'sandpit'
  | 'court_orange'
  | 'court_cream'
  | 'hawker_floor'
  | 'market_floor';

export type PropId =
  | 'hdb_blk260'
  | 'hdb_blk261'
  | 'hdb_blk262'
  | 'minimart_front'
  | 'dragon_playground'
  | 'rain_tree'
  | 'hawker_stall_chicken'
  | 'hawker_stall_caifan'
  | 'hawker_stall_noodles'
  | 'sunhub_atrium'
  | 'sg_bus'
  | 'sg_bus_f0'
  | 'sg_bus_f1'
  | 'sg_bus_f2'
  | 'sg_bus_f3';

export interface PropInstance {
  id: PropId;
  col: number;
  row: number;
  footCols: number;
  footRows: number;
  solid?: boolean;
  layer?: 'ground' | 'actor' | 'overhead';
  light?: boolean;
  flipX?: boolean;
  label?: string;
}

export interface DistrictLandmark {
  id: string;
  district: DistrictId;
  name: string;
  detail: string;
  x: number;
  y: number;
  color: string;
  refreshment?: boolean;
}

export interface DistrictResidentDef {
  id: string;
  district: DistrictId;
  sheet: NPCEntity['id'];
  name: string;
  role: string;
  route: Point[];
}

/** World coordinates (canvas px) for the center of tile (col, row). */
export function isoToWorld(col: number, row: number): Point {
  return {
    x: ORIGIN_X + (col - row) * HALF_W,
    y: ORIGIN_Y + (col + row) * HALF_H,
  };
}

/** Continuous fractional tile coordinates (col, row) for a world point (x, y). */
export function worldToIso(x: number, y: number): { col: number; row: number } {
  const dx = (x - ORIGIN_X) / HALF_W;
  const dy = (y - ORIGIN_Y) / HALF_H;
  return {
    col: (dx + dy) * 0.5,
    row: (dy - dx) * 0.5,
  };
}

/** Integer tile indices containing world point (x, y). */
export function tileAtWorld(x: number, y: number): { col: number; row: number } {
  const { col, row } = worldToIso(x, y);
  return {
    col: Math.floor(col + 0.5),
    row: Math.floor(row + 0.5),
  };
}
