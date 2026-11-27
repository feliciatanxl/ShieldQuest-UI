import { DistrictId, Point } from './districts';

export const SCENE_WIDTH = 1280;
export const SCENE_HEIGHT = 720;
export const WORLD_WIDTH = 4864;
export const WORLD_HEIGHT = 3408;
export const NORTH_LINK_GARDEN = { x: 2010, y: 920 };

export const DISTRICT_ORIGINS: Record<DistrictId, Point> = {
  park: { x: 32, y: 200 },
  estate: { x: 1354, y: 200 },
  transport: { x: 300, y: 1400 },
  block260: { x: 1900, y: 1280 },
  market: { x: 3460, y: 1400 },
  mall: { x: 2950, y: 2480 },
};

export const DISTRICTS = Object.keys(DISTRICT_ORIGINS) as DistrictId[];

export function worldPoint(district: DistrictId, p: Point): Point {
  const origin = DISTRICT_ORIGINS[district];
  return { x: origin.x + p.x, y: origin.y + p.y };
}

export function localPoint(district: DistrictId, p: Point): Point {
  const origin = DISTRICT_ORIGINS[district];
  return { x: p.x - origin.x, y: p.y - origin.y };
}

export function districtAt(x: number, y: number): DistrictId | undefined {
  return DISTRICTS.find((id) => {
    const origin = DISTRICT_ORIGINS[id];
    return x >= origin.x && x < origin.x + SCENE_WIDTH
      && y >= origin.y && y < origin.y + SCENE_HEIGHT;
  });
}

const pt = (x: number, y: number): Point => ({ x, y });
const junction = pt(3024, 2072);
const gardenTurn = pt(240, 1120);

export const NEIGHBOURHOOD_PATHS = [
  {
    radius: 40,
    points: [worldPoint('block260', pt(622, 171)), pt(2522, 1190), pt(2522, 979),
      worldPoint('estate', pt(1168, 650))],
  },
  {
    radius: 37,
    points: [worldPoint('estate', pt(186, 562)), worldPoint('estate', pt(130, 596)), pt(1340, 814),
      worldPoint('park', pt(1227, 650))],
  },
  {
    radius: 43,
    points: [worldPoint('park', pt(198, 658)), gardenTurn, pt(175, 1280), pt(175, 1973),
      pt(221, 2046), worldPoint('transport', pt(148, 647))],
  },
  {
    radius: 44,
    points: [worldPoint('transport', pt(1210, 656)), pt(1860, 2072), junction,
      pt(3270, 2072), pt(3380, 1990), worldPoint('market', pt(88, 590))],
  },
  {
    radius: 39,
    points: [worldPoint('block260', pt(1124, 676)), junction],
  },
  {
    radius: 43,
    points: [pt(2690, 2072), pt(2690, 2670), pt(2748, 2987), worldPoint('mall', pt(122, 507))],
  },
] as const;

export const DISTRICT_DESTINATIONS: Record<DistrictId, Point> = {
  block260: worldPoint('block260', pt(470, 485)),
  estate: worldPoint('estate', pt(1150, 628)),
  park: worldPoint('park', pt(560, 652)),
  transport: worldPoint('transport', pt(825, 648)),
  market: worldPoint('market', pt(320, 595)),
  mall: worldPoint('mall', pt(344, 541)),
};

// Roots sit in the verge beside the walkways, with canopies overhanging the paths.
export const VERGE_TREES = [
  pt(2895, 1165),
  pt(1373, 962), pt(1160, 1030), pt(405, 1080), pt(105, 1170),
  pt(278, 1380), pt(81, 1550), pt(260, 1760), pt(94, 1932),
  pt(1702, 2001), pt(1811, 2216), pt(2086, 2170), pt(2368, 2204),
  pt(2540, 2330), pt(2848, 2398), pt(2572, 2584), pt(2835, 2740),
  pt(2620, 2931), pt(2830, 3126), pt(3224, 2241), pt(3408, 2130),
];

const pathSegments = NEIGHBOURHOOD_PATHS.flatMap(({ points, radius }) =>
  points.slice(1).map((b, index) => {
    const a = points[index];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return { a, dx, dy, length: dx * dx + dy * dy, radius,
      minX: Math.min(a.x, b.x) - radius, maxX: Math.max(a.x, b.x) + radius,
      minY: Math.min(a.y, b.y) - radius, maxY: Math.max(a.y, b.y) + radius };
  }),
);

export function onNeighbourhoodPath(x: number, y: number): boolean {
  return pathSegments.some(({ a, dx, dy, length, radius, minX, maxX, minY, maxY }) => {
    if (x < minX || x > maxX || y < minY || y > maxY) return false;
    const px = x - a.x;
    const py = y - a.y;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / length));
    return (px - dx * t) ** 2 + (py - dy * t) ** 2 < radius ** 2;
  });
}
