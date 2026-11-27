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
type Gate = { district: DistrictId; at: Pair; arrival: Pair; hint: string };
const links: readonly (readonly [Gate, Gate])[] = [
  [
    { district: 'block260', at: [311, 70], arrival: [311, 94], hint: 'Sheltered linkway' },
    { district: 'estate', at: [92, 282], arrival: [121, 278], hint: 'Blk 260 linkway' },
  ],
  [
    { district: 'estate', at: [618, 328], arrival: [584, 314], hint: 'Garden walk' },
    { district: 'park', at: [24, 328], arrival: [58, 328], hint: 'Residential path' },
  ],
  [
    { district: 'park', at: [616, 326], arrival: [582, 326], hint: 'Park connector' },
    { district: 'transport', at: [49, 320], arrival: [83, 323], hint: 'Park-side crossing' },
  ],
  [
    { district: 'transport', at: [616, 328], arrival: [582, 328], hint: 'Sheltered drop-off' },
    { district: 'mall', at: [28, 254], arrival: [61, 255], hint: 'Bus bay walkway' },
  ],
  [
    { district: 'mall', at: [612, 307], arrival: [579, 310], hint: 'Market promenade' },
    { district: 'market', at: [24, 296], arrival: [58, 292], hint: 'SUNhub promenade' },
  ],
  [
    { district: 'market', at: [616, 313], arrival: [582, 309], hint: 'Minimart walkway' },
    { district: 'block260', at: [588, 343], arrival: [562, 339], hint: 'Sunshine Minimart walkway' },
  ],
];

export const toCanvas = ([x, y]: Pair): Point => ({ x: x * 2, y: y * 2 });

export const districtExits = (district: DistrictId) => links.flatMap(([a, b]) => {
  const [from, to] = a.district === district ? [a, b] : [b, a];
  return from.district === district
    ? [{ at: toCanvas(from.at), arrival: toCanvas(to.arrival), district: to.district, hint: from.hint }]
    : [];
});

export function exitTowardBlock260(district: DistrictId) {
  const exits = districtExits(district);
  return exits.find((exit) => exit.district === 'block260')
    ?? exits.find((exit) => districtExits(exit.district).some((next) => next.district === 'block260'))
    ?? exits[0];
}

export function districtArt(district: DistrictId, night: boolean): string {
  const light = night ? 'night' : 'day';
  return district === 'block260'
    ? `/assets/scenes/street-${light}.png`
    : `/assets/expansion/${district}-${light}.png`;
}
