import { DistrictId, Point } from '../data/districts';
import {
  DistrictLandmark,
  DistrictResidentDef,
  isoToWorld,
  MAP_COLS,
  MAP_ROWS,
  PropInstance,
  TileId,
  tileAtWorld,
  worldToIso,
} from '../game/isoGrid';

const NON_WALKABLE_TILES = new Set<TileId>([
  'road_plain',
  'road_se',
  'road_sw',
  'road_busbay',
  'road_taxibay',
  'road_yellowbox',
]);

export const DISTRICT_BOUNDS: Record<DistrictId, { c0: number; c1: number; r0: number; r1: number }> = {
  estate: { c0: 2, c1: 49, r0: 2, r1: 12 },
  park: { c0: 2, c1: 18, r0: 13, r1: 26 },
  block260: { c0: 19, c1: 27, r0: 13, r1: 26 },
  market: { c0: 28, c1: 49, r0: 13, r1: 26 },
  transport: { c0: 2, c1: 24, r0: 27, r1: 49 },
  mall: { c0: 25, c1: 49, r0: 27, r1: 49 },
};

export function districtAtTile(col: number, row: number): DistrictId | undefined {
  for (const id of Object.keys(DISTRICT_BOUNDS) as DistrictId[]) {
    const b = DISTRICT_BOUNDS[id];
    if (col >= b.c0 && col <= b.c1 && row >= b.r0 && row <= b.r1) return id;
  }
  return undefined;
}

export function districtAtWorld(x: number, y: number): DistrictId | undefined {
  const { col, row } = tileAtWorld(x, y);
  return districtAtTile(col, row);
}

// Spacious 52x52 Ang Mo Kio Town Centre layout matching the airy sunlit heartland square.
function buildTileGrid(): TileId[][] {
  const grid: TileId[][] = Array.from({ length: MAP_ROWS }, (_, r) =>
    Array.from({ length: MAP_COLS }, (__, c) => {
      const h = (c * 31 + r * 17) % 23;
      if (h === 0) return 'grass_flower';
      if (h <= 4) return 'grass_tuft';
      return 'grass';
    }),
  );

  const fillRect = (
    c0: number,
    r0: number,
    c1: number,
    r1: number,
    tile: TileId | ((c: number, r: number) => TileId),
  ) => {
    for (let r = Math.max(0, r0); r <= Math.min(MAP_ROWS - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(MAP_COLS - 1, c1); c++) {
        grid[r][c] = typeof tile === 'function' ? tile(c, r) : tile;
      }
    }
  };

  // 1. Ang Mo Kio Ave 3 / Sunshine Ave (row 27..32, col 3..48)
  fillRect(3, 27, 48, 27, 'drain_se');
  fillRect(3, 28, 48, 31, 'road_plain');
  fillRect(3, 29, 48, 29, (c: number) => (c % 2 === 0 ? 'road_se' : 'road_plain'));
  fillRect(3, 32, 48, 32, 'drain_se');

  // Bus Stop 26019 bay (north side) & SUNhub / AMK Hub Taxi Bay (south side)
  fillRect(15, 28, 19, 28, 'road_busbay');
  fillRect(15, 27, 19, 27, 'tactile');
  fillRect(28, 31, 32, 31, 'road_taxibay');

  // Two clean Signalised Zebra Crossings (walkable across road)
  fillRect(21, 28, 22, 31, 'zebra_sw');
  fillRect(21, 27, 22, 27, 'tactile');
  fillRect(21, 32, 22, 32, 'tactile');
  fillRect(33, 28, 34, 31, 'zebra_sw');
  fillRect(33, 27, 34, 27, 'tactile');
  fillRect(33, 32, 34, 32, 'tactile');

  // 2. Emerald Dragon Community Park Pocket (spacious continuous sandpit square)
  fillRect(8, 10, 8, 26, 'pcn_green');
  fillRect(9, 10, 9, 26, 'pcn_red');
  fillRect(10, 10, 17, 10, 'pcn_red');
  fillRect(10, 11, 17, 11, 'pcn_green');
  fillRect(10, 25, 11, 25, 'pcn_red');
  fillRect(10, 26, 11, 26, 'pcn_green');
  fillRect(12, 18, 18, 23, 'sandpit');
  fillRect(11, 18, 11, 23, 'pavement');

  // 3. Shield View Estate (set well back north on its own courtyard)
  fillRect(17, 6, 31, 11, 'void_deck');
  fillRect(19, 12, 20, 17, 'pavement'); // Wide path connecting Estate -> Blk 260 courtyard

  // 4. Blk 260 Shield View & Wide Sunlit Town Square
  fillRect(12, 24, 27, 26, (c: number, r: number) => ((c + r) % 2 === 0 ? 'pavement' : 'pavement_alt'));
  fillRect(19, 18, 27, 23, (c: number, r: number) => ((c + r) % 2 === 0 ? 'pavement' : 'pavement_alt'));
  fillRect(21, 16, 26, 20, 'void_deck');

  // 5. Shiok Hawker Terrace (east, cleanly aligned with Blk 260 promenade)
  fillRect(28, 22, 37, 26, 'hawker_floor');

  // 6. South Transport Apron & SUNhub / AMK Hub Plaza (across the avenue)
  fillRect(10, 33, 24, 36, (c: number, r: number) => ((c + r) % 2 === 0 ? 'pavement' : 'pavement_alt'));
  fillRect(25, 33, 42, 43, (c: number, r: number) => ((c + r) % 2 === 0 ? 'plaza' : 'plaza_alt'));
  fillRect(27, 33, 35, 33, 'tactile');

  return grid;
}

export const TILES: TileId[][] = buildTileGrid();

function buildProps(): PropInstance[] {
  const props: PropInstance[] = [];
  const add = (
    id: PropInstance['id'],
    col: number,
    row: number,
    opts: { footCols?: number; footRows?: number; solid?: boolean; flipX?: boolean; light?: boolean; label?: string } = {},
  ) => {
    props.push({
      id,
      col,
      row,
      footCols: opts.footCols ?? 1,
      footRows: opts.footRows ?? 1,
      solid: opts.solid ?? true,
      layer: 'actor',
      light: opts.light ?? false,
      flipX: opts.flipX ?? false,
      label: opts.label,
    });
  };

  // --- Blk 260 Shield View (set back with wide sunlit courtyard in front) ---
  add('hdb_blk260', 22, 16, { footCols: 4, footRows: 2, solid: true, light: true });

  // --- Sunshine Minimart & Shiok Hawker Row (spaced cleanly along east terrace) ---
  add('minimart_front', 24, 22, { footCols: 3, footRows: 2, solid: true, light: true, label: 'Sunshine Minimart' });
  add('hawker_stall_chicken', 28, 22, { footCols: 2, footRows: 2, solid: true, light: true });
  add('hawker_stall_caifan', 31, 22, { footCols: 2, footRows: 2, solid: true, light: true });
  add('hawker_stall_noodles', 34, 22, { footCols: 2, footRows: 2, solid: true, light: true });

  // --- Emerald Dragon Playground (centered in spacious sandpit) ---
  add('dragon_playground', 13, 19, { footCols: 4, footRows: 2, solid: true, label: 'Emerald Dragon Playground' });

  // --- Shield View Estate (north) ---
  add('hdb_blk261', 18, 6, { footCols: 3, footRows: 2, solid: true, light: true });
  add('hdb_blk262', 27, 6, { footCols: 3, footRows: 2, solid: true, light: true });

  // --- SUNhub / AMK Hub Shopping Centre (south across wide Ave 3) ---
  add('sunhub_atrium', 31, 37, { footCols: 4, footRows: 2, solid: true, light: true, label: 'SUNhub' });

  // --- Lush PixelLab Rain Trees clustered on outer lawns (never blocking walkways or facades) ---
  const trees: [number, number, boolean][] = [
    [10, 17, false],
    [13, 15, true],
    [16, 15, false],
    [15, 9, true],
    [32, 9, false],
    [38, 23, true],
    [11, 34, false],
    [16, 35, true],
    [21, 36, false],
    [24, 41, true],
    [38, 35, false],
    [41, 41, true],
    [31, 45, false],
  ];
  for (const [c, r, flipX] of trees) {
    add('rain_tree', c, r, { solid: true, flipX });
  }

  return props;
}

export const WORLD_PROPS: PropInstance[] = buildProps();

// Precompute solid tile occupancy grid
const SOLID_GRID: boolean[][] = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLS }, () => false),
);

for (const prop of WORLD_PROPS) {
  if (!prop.solid) continue;
  for (let r = prop.row; r < prop.row + prop.footRows; r++) {
    for (let c = prop.col; c < prop.col + prop.footCols; c++) {
      if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
        SOLID_GRID[r][c] = true;
      }
    }
  }
}

export function isTileWalkable(col: number, row: number): boolean {
  if (col < 2 || col >= MAP_COLS - 2 || row < 2 || row >= MAP_ROWS - 2) return false;
  if (SOLID_GRID[row][col]) return false;
  return !NON_WALKABLE_TILES.has(TILES[row][col]);
}

export function isWorldPointWalkable(x: number, y: number): boolean {
  const { col, row } = worldToIso(x, y);
  const ic = Math.floor(col + 0.5);
  const ir = Math.floor(row + 0.5);
  if (!isTileWalkable(ic, ir)) return false;

  const fc = col - ic;
  const fr = row - ir;
  if (fc > 0.28 && !isTileWalkable(ic + 1, ir)) return false;
  if (fc < -0.28 && !isTileWalkable(ic - 1, ir)) return false;
  if (fr > 0.28 && !isTileWalkable(ic, ir + 1)) return false;
  if (fr < -0.28 && !isTileWalkable(ic, ir - 1)) return false;
  return true;
}

// ---------------- Key Gameplay Locations ----------------

export const ISO_PLAYER_START = isoToWorld(20, 23);
export const ISO_UNCLE_POS = isoToWorld(20, 26);
export const ISO_AUNTIE_PATH: [Point, Point] = [isoToWorld(18, 25), isoToWorld(23, 25)];
export const ISO_WEI_MING_POS = isoToWorld(16, 25);
export const ISO_MR_LIM_POS = isoToWorld(25, 25);

export const ISO_ITEM_POS = {
  ezlink: isoToWorld(22, 20),
  chope: isoToWorld(23, 24),
  kopi: isoToWorld(29, 25),
};

const mmA = isoToWorld(24, 24);
const mmB = isoToWorld(26, 25);
export const ISO_MINIMART_CENTER = isoToWorld(25, 23);
export const ISO_MINIMART_ZONE = {
  x0: Math.min(mmA.x, mmB.x) - 42,
  y0: Math.min(mmA.y, mmB.y) - 16,
  x1: Math.max(mmA.x, mmB.x) + 42,
  y1: Math.max(mmA.y, mmB.y) + 16,
};

export const ISO_DISTRICT_DESTINATIONS: Record<DistrictId, Point> = {
  block260: isoToWorld(20, 23),
  estate: isoToWorld(23, 10),
  park: isoToWorld(15, 22),
  transport: isoToWorld(19, 34),
  market: isoToWorld(30, 25),
  mall: isoToWorld(33, 35),
};

export const ALL_LANDMARKS: DistrictLandmark[] = [
  {
    id: 'busstop',
    district: 'block260',
    name: 'Blk 260 Bus Stop (Stop 26019)',
    detail: 'Bus bay along Ang Mo Kio Ave 3 — Uncle Tan is looking for his missing EZ-Link card.',
    ...isoToWorld(19, 26),
    color: '#6bb09e',
  },
  {
    id: 'voiddeck',
    district: 'block260',
    name: 'Blk 260 Shield View Void Deck',
    detail: 'Spacious sunlit Blk 260 void deck & heartland courtyard.',
    ...isoToWorld(22, 20),
    color: '#d89b52',
  },
  {
    id: 'minimart',
    district: 'block260',
    name: 'Sunshine Minimart',
    detail: 'Anchor Quest: "The Lookout Dilemma" — practise all 6 S.H.I.E.L.D. choices.',
    ...isoToWorld(25, 25),
    color: '#e6b84c',
  },
  {
    id: 'estate-0',
    district: 'estate',
    name: 'Blocks 261 & 262 courtyard',
    detail: 'Shield View residential courtyard connecting Blk 260 to Emerald Dragon Park.',
    ...isoToWorld(23, 10),
    color: '#d89b52',
  },
  {
    id: 'park-0',
    district: 'park',
    name: 'Emerald Dragon Playground',
    detail: 'Mosaic tiles and steel rings form the iconic Singapore dragon on the wide sandpit.',
    ...isoToWorld(15, 22),
    color: '#e06848',
  },
  {
    id: 'transport-0',
    district: 'transport',
    name: 'AMK Ave 3 Crossing',
    detail: 'Signalised zebra crossing leading from Blk 260 to SUNhub plaza.',
    ...isoToWorld(21, 33),
    color: '#5ea89b',
  },
  {
    id: 'market-0',
    district: 'market',
    name: 'Shiok Hawker dining row',
    detail: 'Chicken rice, economic rice, and noodles along the sunny hawker terrace.',
    ...isoToWorld(30, 25),
    color: '#d97e4a',
    refreshment: true,
  },
  {
    id: 'mall-0',
    district: 'mall',
    name: 'SUNhub Taxi Bay & Entrance',
    detail: 'Tactile walkway and yellow Taxi Bay right in front of SUNhub Shopping Centre.',
    ...isoToWorld(32, 34),
    color: '#6ab6c4',
  },
];

export const DISTRICT_RESIDENTS: DistrictResidentDef[] = [
  {
    id: 'estate:0',
    district: 'estate',
    sheet: 'auntie',
    name: 'Madam Goh',
    role: 'Heading home from Shiok Hawker',
    route: [isoToWorld(18, 10), isoToWorld(24, 10), isoToWorld(29, 10)],
  },
  {
    id: 'park:0',
    district: 'park',
    sheet: 'student',
    name: 'Jia En',
    role: 'Playing near the Dragon Playground sandpit',
    route: [isoToWorld(13, 22), isoToWorld(16, 22), isoToWorld(17, 21)],
  },
  {
    id: 'transport:0',
    district: 'transport',
    sheet: 'student',
    name: 'Hui Wen',
    role: 'Walking toward the zebra crossing',
    route: [isoToWorld(14, 34), isoToWorld(18, 34), isoToWorld(21, 33)],
  },
  {
    id: 'market:0',
    district: 'market',
    sheet: 'uncle',
    name: 'Uncle Chua',
    role: 'Browsing the Chicken Rice & Noodles stalls',
    route: [isoToWorld(28, 25), isoToWorld(32, 25), isoToWorld(35, 25)],
  },
  {
    id: 'market:1',
    district: 'market',
    sheet: 'auntie',
    name: 'Madam Lim',
    role: 'Picking up dinner at Economic Rice',
    route: [isoToWorld(29, 24), isoToWorld(33, 24), isoToWorld(35, 24)],
  },
  {
    id: 'mall:0',
    district: 'mall',
    sheet: 'cashier',
    name: 'Mr Ong',
    role: 'Walking across SUNhub Plaza',
    route: [isoToWorld(27, 35), isoToWorld(33, 35), isoToWorld(38, 35)],
  },
];
