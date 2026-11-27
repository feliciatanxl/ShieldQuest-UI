export const DISTRICT_NAMES = {
  block260: 'Blk 260 Shield View',
  estate: 'Shield View Residential Estate',
  mall: 'SUNhub Shopping Centre',
  market: 'Shiok Hawker & Sunshine Market',
  transport: 'Sunshine Transport District',
  park: 'Emerald Dragon Community Park',
} as const;

export type DistrictId = keyof typeof DISTRICT_NAMES;
export type ExpansionId = Exclude<DistrictId, 'block260'>;
export type Point = { x: number; y: number };

export function readDistrict(value: unknown): DistrictId {
  return typeof value === 'string' && Object.hasOwn(DISTRICT_NAMES, value)
    ? value as DistrictId
    : 'block260';
}

// Positions are in native 640×360 art pixels, converted to canvas coordinates below.
type Pair = readonly [number, number];
export const toCanvas = ([x, y]: Pair): Point => ({ x: x * 2, y: y * 2 });

export function districtArt(district: DistrictId, night: boolean): string {
  const light = night ? 'night' : 'day';
  return district === 'block260'
    ? `/assets/scenes/street-${light}.png`
    : `/assets/expansion/${district}-${light}.png`;
}
